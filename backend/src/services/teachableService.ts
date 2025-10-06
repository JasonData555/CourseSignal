import axios from 'axios';
import { query } from '../db/connection';
import { encrypt, decrypt } from '../utils/encryption';
import * as attributionService from './attributionService';

const TEACHABLE_API_BASE = 'https://api.teachable.com';
const TEACHABLE_CLIENT_ID = process.env.TEACHABLE_CLIENT_ID;
const TEACHABLE_CLIENT_SECRET = process.env.TEACHABLE_CLIENT_SECRET;
const TEACHABLE_REDIRECT_URI = process.env.TEACHABLE_REDIRECT_URI;

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: TEACHABLE_CLIENT_ID!,
    redirect_uri: TEACHABLE_REDIRECT_URI!,
    response_type: 'code',
    state,
    scope: 'read:orders read:enrollments webhooks:write',
  });

  return `${TEACHABLE_API_BASE}/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const response = await axios.post(`${TEACHABLE_API_BASE}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    client_id: TEACHABLE_CLIENT_ID,
    client_secret: TEACHABLE_CLIENT_SECRET,
    redirect_uri: TEACHABLE_REDIRECT_URI,
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await axios.post(`${TEACHABLE_API_BASE}/oauth/token`, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: TEACHABLE_CLIENT_ID,
    client_secret: TEACHABLE_CLIENT_SECRET,
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
  };
}

export async function saveIntegration(
  userId: string,
  accessToken: string,
  refreshToken: string
) {
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = encrypt(refreshToken);

  await query(
    `INSERT INTO platform_integrations (user_id, platform, access_token, refresh_token, status)
     VALUES ($1, 'teachable', $2, $3, 'connected')
     ON CONFLICT (user_id, platform)
     DO UPDATE SET
       access_token = $2,
       refresh_token = $3,
       status = 'connected',
       updated_at = NOW()`,
    [userId, encryptedAccessToken, encryptedRefreshToken]
  );
}

export async function getIntegration(userId: string) {
  const result = await query(
    'SELECT id, access_token, refresh_token, status FROM platform_integrations WHERE user_id = $1 AND platform = $2',
    [userId, 'teachable']
  );

  if (result.rows.length === 0) {
    return null;
  }

  const integration = result.rows[0];

  return {
    id: integration.id,
    accessToken: decrypt(integration.access_token),
    refreshToken: decrypt(integration.refresh_token),
    status: integration.status,
  };
}

export async function registerWebhook(userId: string, accessToken: string) {
  const webhookUrl = `${process.env.APP_URL}/api/webhooks/teachable/${userId}`;

  const response = await axios.post(
    `${TEACHABLE_API_BASE}/v1/webhooks`,
    {
      url: webhookUrl,
      events: ['order.created', 'order.refunded', 'enrollment.created'],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const webhookId = response.data.id;

  // Save webhook ID
  await query(
    'UPDATE platform_integrations SET webhook_id = $1 WHERE user_id = $2 AND platform = $3',
    [webhookId, userId, 'teachable']
  );

  return webhookId;
}

export async function syncPurchases(userId: string) {
  const integration = await getIntegration(userId);

  if (!integration) {
    throw new Error('Teachable not connected');
  }

  // Create sync job
  const jobResult = await query(
    `INSERT INTO sync_jobs (user_id, platform, status, started_at)
     VALUES ($1, 'teachable', 'running', NOW())
     RETURNING id`,
    [userId]
  );

  const jobId = jobResult.rows[0].id;

  try {
    // Fetch orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await axios.get(`${TEACHABLE_API_BASE}/v1/orders`, {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
      },
      params: {
        created_after: thirtyDaysAgo.toISOString(),
        per_page: 100,
      },
    });

    const orders = response.data.orders || [];

    // Update total records
    await query('UPDATE sync_jobs SET total_records = $1 WHERE id = $2', [
      orders.length,
      jobId,
    ]);

    // Process each order
    let processed = 0;

    for (const order of orders) {
      // Skip refunded or failed orders
      if (order.status === 'refunded' || order.status === 'failed') {
        continue;
      }

      await attributionService.attributePurchase(userId, {
        email: order.email,
        amount: parseFloat(order.total) || 0,
        currency: order.currency || 'USD',
        courseName: order.product_name || 'Unknown Course',
        platform: 'teachable',
        platformPurchaseId: order.id.toString(),
        purchasedAt: new Date(order.created_at),
      });

      processed++;

      // Update progress
      await query('UPDATE sync_jobs SET processed_records = $1 WHERE id = $2', [processed, jobId]);
    }

    // Mark job as completed
    await query(
      'UPDATE sync_jobs SET status = $1, completed_at = NOW() WHERE id = $2',
      ['completed', jobId]
    );

    // Update last sync time
    await query(
      'UPDATE platform_integrations SET last_sync_at = NOW() WHERE user_id = $1 AND platform = $2',
      [userId, 'teachable']
    );

    return {
      jobId,
      totalRecords: orders.length,
      processedRecords: processed,
    };
  } catch (error: any) {
    // Mark job as failed
    await query(
      'UPDATE sync_jobs SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', error.message, jobId]
    );

    throw error;
  }
}

export async function handleWebhook(userId: string, event: any) {
  const { event_type, data } = event;

  if (event_type === 'order.created' || event_type === 'enrollment.created') {
    // For enrollment events, we need to fetch the order details
    let orderData = data;

    if (event_type === 'enrollment.created' && data.order_id) {
      const integration = await getIntegration(userId);
      if (integration) {
        try {
          const orderResponse = await axios.get(
            `${TEACHABLE_API_BASE}/v1/orders/${data.order_id}`,
            {
              headers: {
                Authorization: `Bearer ${integration.accessToken}`,
              },
            }
          );
          orderData = orderResponse.data.order;
        } catch (error) {
          console.error('Failed to fetch order details:', error);
          return;
        }
      }
    }

    await attributionService.attributePurchase(userId, {
      email: orderData.email,
      amount: parseFloat(orderData.total) || 0,
      currency: orderData.currency || 'USD',
      courseName: orderData.product_name || 'Unknown Course',
      platform: 'teachable',
      platformPurchaseId: orderData.id.toString(),
      purchasedAt: new Date(orderData.created_at),
    });
  } else if (event_type === 'order.refunded') {
    // Mark purchase as refunded
    await query(
      'UPDATE purchases SET amount = 0, updated_at = NOW() WHERE platform_purchase_id = $1 AND platform = $2',
      [data.id.toString(), 'teachable']
    );
  }
}

export async function getSyncStatus(userId: string) {
  const result = await query(
    `SELECT id, status, total_records, processed_records, error_message, started_at, completed_at
     FROM sync_jobs
     WHERE user_id = $1 AND platform = 'teachable'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
