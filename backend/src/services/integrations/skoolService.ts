import axios from 'axios';
import crypto from 'crypto';
import { query } from '../../db/connection';
import { encrypt, decrypt } from '../../utils/encryption';
import * as attributionService from '../attributionService';

// Skool uses third-party SkoolAPI for programmatic access
// Documentation: https://docs.skoolapi.com/
const SKOOL_API_BASE = process.env.SKOOL_API_BASE || 'https://api.skoolapi.com';
const SKOOL_WEBHOOK_SECRET = process.env.SKOOL_WEBHOOK_SECRET;

/**
 * Skool Integration Service
 *
 * Unlike Kajabi/Teachable, Skool doesn't have native OAuth.
 * This service uses:
 * 1. API Key authentication (from SkoolAPI.com or Skool settings)
 * 2. Webhook-based purchase notifications (via Zapier/external processors)
 * 3. Manual sync capability for historical purchases
 */

/**
 * Save Skool integration with API key
 * No OAuth flow - user provides API key directly
 */
export async function saveIntegration(
  userId: string,
  apiKey: string,
  communityId?: string
) {
  const encryptedApiKey = encrypt(apiKey);

  await query(
    `INSERT INTO platform_integrations (user_id, platform, api_key, webhook_secret, status)
     VALUES ($1, 'skool', $2, $3, 'connected')
     ON CONFLICT (user_id, platform)
     DO UPDATE SET
       api_key = $2,
       webhook_secret = $3,
       status = 'connected',
       updated_at = NOW()`,
    [userId, encryptedApiKey, communityId || null]
  );
}

/**
 * Get Skool integration for a user
 */
export async function getIntegration(userId: string) {
  const result = await query(
    'SELECT id, api_key, webhook_secret, status FROM platform_integrations WHERE user_id = $1 AND platform = $2',
    [userId, 'skool']
  );

  if (result.rows.length === 0) {
    return null;
  }

  const integration = result.rows[0];

  return {
    id: integration.id,
    apiKey: decrypt(integration.api_key),
    communityId: integration.webhook_secret, // Reusing webhook_secret field for community ID
    status: integration.status,
  };
}

/**
 * Generate webhook URL for user to configure in Skool/Zapier
 * This URL receives purchase notifications
 */
export function getWebhookUrl(userId: string): string {
  return `${process.env.APP_URL}/api/webhooks/skool/${userId}`;
}

/**
 * Sync purchases from Skool (manual sync fallback)
 *
 * Note: Skool's API is limited. This function attempts to fetch
 * purchase data if available via SkoolAPI or returns error message
 * prompting user to use webhook-based integration
 */
export async function syncPurchases(userId: string) {
  const integration = await getIntegration(userId);

  if (!integration) {
    throw new Error('Skool not connected');
  }

  // Create sync job
  const jobResult = await query(
    `INSERT INTO sync_jobs (user_id, platform, status, started_at)
     VALUES ($1, 'skool', 'running', NOW())
     RETURNING id`,
    [userId]
  );

  const jobId = jobResult.rows[0].id;

  try {
    // Note: SkoolAPI may not have purchase/transaction endpoints yet
    // This is a placeholder for when/if they add this functionality
    // For now, recommend webhook-based integration via Zapier

    // Attempt to fetch members who joined recently (as proxy for purchases)
    // This would need to be updated based on actual SkoolAPI capabilities
    const response = await axios.get(`${SKOOL_API_BASE}/v1/members`, {
      headers: {
        'X-Api-Secret': integration.apiKey,
        'Content-Type': 'application/json',
      },
      params: {
        limit: 100,
        // Add date filter if API supports it
      },
    });

    const members = response.data?.members || [];

    // Update total records
    await query('UPDATE sync_jobs SET total_records = $1 WHERE id = $2', [
      members.length,
      jobId,
    ]);

    let processed = 0;

    // Note: This assumes members API includes payment/purchase data
    // Actual implementation depends on SkoolAPI capabilities
    for (const member of members) {
      // Skip if no purchase/payment data
      if (!member.payment_amount || member.payment_amount <= 0) {
        continue;
      }

      await attributionService.attributePurchase(userId, {
        email: member.email,
        amount: parseFloat(member.payment_amount) || 0,
        currency: member.currency || 'USD',
        courseName: member.community_name || 'Skool Community Access',
        platform: 'skool',
        platformPurchaseId: member.id.toString(),
        purchasedAt: new Date(member.joined_at || member.created_at),
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
      [userId, 'skool']
    );

    return {
      jobId,
      totalRecords: members.length,
      processedRecords: processed,
      note: processed === 0
        ? 'No purchases found. For best results, use webhook-based integration via Zapier for real-time purchase tracking.'
        : undefined,
    };
  } catch (error: any) {
    // Mark job as failed
    const errorMessage = error.response?.status === 404
      ? 'Skool API endpoint not available. Please use webhook-based integration via Zapier.'
      : error.message;

    await query(
      'UPDATE sync_jobs SET status = $1, error_message = $2 WHERE id = $3',
      ['failed', errorMessage, jobId]
    );

    throw new Error(errorMessage);
  }
}

/**
 * Verify webhook signature from Skool/Zapier
 *
 * Skool webhooks may come from:
 * 1. Skool's Zapier plugin
 * 2. External payment processors (Stripe, CopeCart, SamCart)
 *
 * Verification method depends on source
 */
export function verifyWebhookSignature(payload: string | any, signature: string | undefined): boolean {
  // If no webhook secret configured, skip verification (less secure but functional)
  if (!SKOOL_WEBHOOK_SECRET) {
    console.warn('SKOOL_WEBHOOK_SECRET not configured - webhook verification disabled');
    return true; // Allow webhook but log warning
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
      .createHmac('sha256', SKOOL_WEBHOOK_SECRET)
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

/**
 * Handle incoming webhook from Skool/Zapier
 *
 * Expected webhook payload format (flexible based on source):
 * {
 *   event_type: 'member.joined' | 'purchase.completed' | 'payment.succeeded',
 *   data: {
 *     email: string,
 *     amount: number,
 *     currency: string,
 *     community_name: string,
 *     member_id: string,
 *     purchased_at: string,
 *   }
 * }
 */
export async function handleWebhook(userId: string, event: any) {
  const { event_type, data, type, payload } = event;

  // Normalize different webhook formats
  const eventType = event_type || type || 'purchase.completed';
  const eventData = data || payload || event;

  // Handle purchase/payment events
  if (
    eventType === 'purchase.completed' ||
    eventType === 'payment.succeeded' ||
    eventType === 'member.joined' ||
    eventType === 'enrollment.created' ||
    eventData.email // Fallback: any event with email and amount
  ) {
    // Extract purchase data with fallbacks for different formats
    const email = eventData.email || eventData.customer_email || eventData.user_email;
    const amount = parseFloat(eventData.amount || eventData.payment_amount || eventData.total || 0);
    const currency = eventData.currency || 'USD';
    const courseName = eventData.community_name || eventData.product_name || eventData.course_name || 'Skool Community';
    const purchaseId = eventData.member_id || eventData.purchase_id || eventData.id || `skool-${Date.now()}`;
    const purchasedAt = eventData.purchased_at || eventData.created_at || eventData.timestamp || new Date().toISOString();

    // Validate required fields
    if (!email) {
      console.error('Skool webhook missing email:', eventData);
      throw new Error('Webhook payload missing required field: email');
    }

    // Only process if there's an actual purchase amount
    if (amount > 0) {
      await attributionService.attributePurchase(userId, {
        email,
        amount,
        currency,
        courseName,
        platform: 'skool',
        platformPurchaseId: purchaseId.toString(),
        purchasedAt: new Date(purchasedAt),
        deviceFingerprint: undefined, // Not available from Skool webhooks
      });
    } else {
      console.warn('Skool webhook has zero amount, skipping:', eventData);
    }
  } else if (eventType === 'member.removed' || eventType === 'refund.completed') {
    // Handle refunds/removals
    const purchaseId = eventData.member_id || eventData.purchase_id || eventData.id;

    if (purchaseId) {
      await query(
        'UPDATE purchases SET amount = 0, updated_at = NOW() WHERE platform_purchase_id = $1 AND platform = $2',
        [purchaseId.toString(), 'skool']
      );
    }
  }
}

/**
 * Get sync status for Skool integration
 */
export async function getSyncStatus(userId: string) {
  const result = await query(
    `SELECT id, status, total_records, processed_records, error_message, started_at, completed_at
     FROM sync_jobs
     WHERE user_id = $1 AND platform = 'skool'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Test API key validity by making a simple API call
 */
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    // Attempt to fetch user/community info to validate API key
    const response = await axios.get(`${SKOOL_API_BASE}/v1/me`, {
      headers: {
        'X-Api-Secret': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.status === 200;
  } catch (error: any) {
    console.error('Skool API key test failed:', error.message);
    return false;
  }
}
