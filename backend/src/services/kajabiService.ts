import axios from 'axios';
import crypto from 'crypto';
import { query } from '../db/connection';
import { encrypt, decrypt } from '../utils/encryption';
import * as attributionService from './attributionService';

const KAJABI_API_BASE = 'https://api.kajabi.com';
const KAJABI_CLIENT_ID = process.env.KAJABI_CLIENT_ID;
const KAJABI_CLIENT_SECRET = process.env.KAJABI_CLIENT_SECRET;
const KAJABI_REDIRECT_URI = process.env.KAJABI_REDIRECT_URI;
const KAJABI_WEBHOOK_SECRET = process.env.KAJABI_WEBHOOK_SECRET;

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: KAJABI_CLIENT_ID!,
    redirect_uri: KAJABI_REDIRECT_URI!,
    response_type: 'code',
    state,
    scope: 'read:offers read:orders webhooks:write',
  });

  return `${KAJABI_API_BASE}/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string) {
  const response = await axios.post(`${KAJABI_API_BASE}/oauth/token`, {
    grant_type: 'authorization_code',
    code,
    client_id: KAJABI_CLIENT_ID,
    client_secret: KAJABI_CLIENT_SECRET,
    redirect_uri: KAJABI_REDIRECT_URI,
  });

  return {
    accessToken: response.data.access_token,
    refreshToken: response.data.refresh_token,
    expiresIn: response.data.expires_in,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await axios.post(`${KAJABI_API_BASE}/oauth/token`, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: KAJABI_CLIENT_ID,
    client_secret: KAJABI_CLIENT_SECRET,
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
     VALUES ($1, 'kajabi', $2, $3, 'connected')
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
    [userId, 'kajabi']
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
  const webhookUrl = `${process.env.APP_URL}/api/webhooks/kajabi/${userId}`;

  const response = await axios.post(
    `${KAJABI_API_BASE}/v1/webhooks`,
    {
      url: webhookUrl,
      events: ['offer.purchased', 'offer.refunded'],
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
    [webhookId, userId, 'kajabi']
  );

  return webhookId;
}

export async function syncPurchases(userId: string) {
  const integration = await getIntegration(userId);

  if (!integration) {
    throw new Error('Kajabi not connected');
  }

  // Create sync job
  const jobResult = await query(
    `INSERT INTO sync_jobs (user_id, platform, status, started_at)
     VALUES ($1, 'kajabi', 'running', NOW())
     RETURNING id`,
    [userId]
  );

  const jobId = jobResult.rows[0].id;

  try {
    // Fetch purchases from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await axios.get(`${KAJABI_API_BASE}/v1/offers`, {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
      },
      params: {
        created_after: thirtyDaysAgo.toISOString(),
        per_page: 100,
      },
    });

    const purchases = response.data.offers || [];

    // Update total records
    await query('UPDATE sync_jobs SET total_records = $1 WHERE id = $2', [
      purchases.length,
      jobId,
    ]);

    // Process each purchase
    let processed = 0;

    for (const purchase of purchases) {
      await attributionService.attributePurchase(userId, {
        email: purchase.customer_email,
        amount: purchase.amount / 100, // Convert cents to dollars
        currency: 'USD',
        courseName: purchase.offer_name,
        platform: 'kajabi',
        platformPurchaseId: purchase.id,
        purchasedAt: new Date(purchase.created_at),
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
      [userId, 'kajabi']
    );

    return {
      jobId,
      totalRecords: purchases.length,
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

/**
 * Verify webhook signature from Kajabi
 * @param payload - Raw webhook payload (string or object)
 * @param signature - Signature from X-Kajabi-Signature header
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(payload: string | any, signature: string | undefined): boolean {
  if (!KAJABI_WEBHOOK_SECRET) {
    console.error('KAJABI_WEBHOOK_SECRET not configured - webhook verification disabled');
    return false;
  }

  if (!signature) {
    console.error('Missing webhook signature');
    return false;
  }

  try {
    // Convert payload to string if it's an object
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Generate HMAC SHA-256 signature
    const expectedSignature = crypto
      .createHmac('sha256', KAJABI_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

export async function handleWebhook(userId: string, event: any) {
  const { event_type, data } = event;

  if (event_type === 'offer.purchased') {
    // Note: Kajabi webhooks don't include device fingerprint data
    // Attribution relies primarily on email matching
    // Fingerprint fallback only works if purchase came through our own checkout
    await attributionService.attributePurchase(userId, {
      email: data.customer_email,
      amount: data.amount / 100,
      currency: 'USD',
      courseName: data.offer_name,
      platform: 'kajabi',
      platformPurchaseId: data.id,
      purchasedAt: new Date(data.created_at),
      deviceFingerprint: undefined, // Not available from Kajabi webhooks
    });
  } else if (event_type === 'offer.refunded') {
    // Mark purchase as refunded
    await query(
      'UPDATE purchases SET amount = 0, updated_at = NOW() WHERE platform_purchase_id = $1 AND platform = $2',
      [data.id, 'kajabi']
    );
  }
}

export async function getSyncStatus(userId: string) {
  const result = await query(
    `SELECT id, status, total_records, processed_records, error_message, started_at, completed_at
     FROM sync_jobs
     WHERE user_id = $1 AND platform = 'kajabi'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
