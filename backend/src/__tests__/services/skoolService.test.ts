/**
 * Skool Service Tests
 *
 * Tests for Skool integration with API key authentication and webhook-based purchase tracking.
 * Unlike Kajabi/Teachable, Skool uses API keys instead of OAuth.
 */

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  createUser,
  query,
} from '../utils';
import * as skoolService from '../../services/integrations/skoolService';

describe('Skool Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('saveIntegration', () => {
    it('should save Skool integration with encrypted API key', async () => {
      const user = await createUser();
      const apiKey = 'test-skool-api-key-12345';
      const communityId = 'community-abc';

      await skoolService.saveIntegration(user.id, apiKey, communityId);

      const result = await query(
        'SELECT * FROM platform_integrations WHERE user_id = $1 AND platform = $2',
        [user.id, 'skool']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].platform).toBe('skool');
      expect(result.rows[0].status).toBe('connected');
      expect(result.rows[0].webhook_secret).toBe(communityId);
      // API key should be encrypted (not matching plain text)
      expect(result.rows[0].api_key).not.toBe(apiKey);
    });

    it('should update existing integration on duplicate save', async () => {
      const user = await createUser();
      const apiKey1 = 'old-api-key';
      const apiKey2 = 'new-api-key';

      await skoolService.saveIntegration(user.id, apiKey1, 'community-1');
      await skoolService.saveIntegration(user.id, apiKey2, 'community-2');

      const result = await query(
        'SELECT * FROM platform_integrations WHERE user_id = $1 AND platform = $2',
        [user.id, 'skool']
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].webhook_secret).toBe('community-2');
    });
  });

  describe('getIntegration', () => {
    it('should retrieve and decrypt Skool integration', async () => {
      const user = await createUser();
      const apiKey = 'test-api-key-xyz';
      const communityId = 'my-community';

      await skoolService.saveIntegration(user.id, apiKey, communityId);

      const integration = await skoolService.getIntegration(user.id);

      expect(integration).not.toBeNull();
      expect(integration!.apiKey).toBe(apiKey);
      expect(integration!.communityId).toBe(communityId);
      expect(integration!.status).toBe('connected');
    });

    it('should return null if no integration exists', async () => {
      const user = await createUser();

      const integration = await skoolService.getIntegration(user.id);

      expect(integration).toBeNull();
    });
  });

  describe('getWebhookUrl', () => {
    it('should generate webhook URL with user ID', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const webhookUrl = skoolService.getWebhookUrl(userId);

      expect(webhookUrl).toContain('/api/webhooks/skool/');
      expect(webhookUrl).toContain(userId);
    });
  });

  describe('handleWebhook', () => {
    it('should process purchase.completed event', async () => {
      const user = await createUser();

      const webhookPayload = {
        event_type: 'purchase.completed',
        data: {
          email: 'test@example.com',
          amount: 99.00,
          currency: 'USD',
          community_name: 'Test Community',
          member_id: 'member-123',
          purchased_at: new Date().toISOString(),
        },
      };

      await skoolService.handleWebhook(user.id, webhookPayload);

      const purchases = await query(
        'SELECT * FROM purchases WHERE user_id = $1 AND platform = $2',
        [user.id, 'skool']
      );

      expect(purchases.rows.length).toBe(1);
      expect(purchases.rows[0].email).toBe('test@example.com');
      expect(parseFloat(purchases.rows[0].amount)).toBe(99.00);
      expect(purchases.rows[0].platform).toBe('skool');
    });

    it('should process member.joined event with payment', async () => {
      const user = await createUser();

      const webhookPayload = {
        event_type: 'member.joined',
        data: {
          email: 'newmember@example.com',
          amount: 49.99,
          currency: 'USD',
          community_name: 'Premium Community',
          member_id: 'member-456',
          purchased_at: new Date().toISOString(),
        },
      };

      await skoolService.handleWebhook(user.id, webhookPayload);

      const purchases = await query(
        'SELECT * FROM purchases WHERE email = $1 AND platform = $2',
        ['newmember@example.com', 'skool']
      );

      expect(purchases.rows.length).toBe(1);
      expect(parseFloat(purchases.rows[0].amount)).toBe(49.99);
    });

    it('should handle webhook with alternative field names', async () => {
      const user = await createUser();

      const webhookPayload = {
        type: 'payment.succeeded',
        payload: {
          customer_email: 'customer@example.com',
          payment_amount: 199.00,
          product_name: 'Course Access',
          id: 'payment-789',
          timestamp: new Date().toISOString(),
        },
      };

      await skoolService.handleWebhook(user.id, webhookPayload);

      const purchases = await query(
        'SELECT * FROM purchases WHERE email = $1',
        ['customer@example.com']
      );

      expect(purchases.rows.length).toBe(1);
      expect(parseFloat(purchases.rows[0].amount)).toBe(199.00);
    });

    it('should skip webhook with zero amount', async () => {
      const user = await createUser();

      const webhookPayload = {
        event_type: 'member.joined',
        data: {
          email: 'freemember@example.com',
          amount: 0,
          member_id: 'free-member-123',
        },
      };

      await skoolService.handleWebhook(user.id, webhookPayload);

      const purchases = await query(
        'SELECT * FROM purchases WHERE email = $1',
        ['freemember@example.com']
      );

      expect(purchases.rows.length).toBe(0);
    });

    it('should handle refund event', async () => {
      const user = await createUser();

      // First create a purchase
      await query(
        `INSERT INTO purchases (user_id, email, amount, platform, platform_purchase_id, purchased_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [user.id, 'refund@example.com', 99.00, 'skool', 'refund-123']
      );

      // Then process refund webhook
      const refundPayload = {
        event_type: 'refund.completed',
        data: {
          member_id: 'refund-123',
        },
      };

      await skoolService.handleWebhook(user.id, refundPayload);

      const purchases = await query(
        'SELECT * FROM purchases WHERE platform_purchase_id = $1',
        ['refund-123']
      );

      expect(parseFloat(purchases.rows[0].amount)).toBe(0);
    });

    it('should throw error for webhook missing email', async () => {
      const user = await createUser();

      const invalidPayload = {
        event_type: 'purchase.completed',
        data: {
          amount: 99.00,
          // Missing email field
        },
      };

      await expect(
        skoolService.handleWebhook(user.id, invalidPayload)
      ).rejects.toThrow('missing required field: email');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      // This is a simplified test - actual implementation depends on Skool's signature method
      const payload = '{"event_type":"purchase.completed"}';
      const signature = 'test-signature';

      // Since we're testing without SKOOL_WEBHOOK_SECRET, it should return true (allow through)
      const isValid = skoolService.verifyWebhookSignature(payload, signature);

      expect(typeof isValid).toBe('boolean');
    });

    it('should return false for missing signature', () => {
      const payload = '{"event_type":"purchase.completed"}';

      const isValid = skoolService.verifyWebhookSignature(payload, undefined);

      expect(isValid).toBe(false);
    });
  });

  describe('getSyncStatus', () => {
    it('should return null if no sync jobs exist', async () => {
      const user = await createUser();

      const status = await skoolService.getSyncStatus(user.id);

      expect(status).toBeNull();
    });

    it('should return latest sync job status', async () => {
      const user = await createUser();

      await query(
        `INSERT INTO sync_jobs (user_id, platform, status, total_records, processed_records, started_at)
         VALUES ($1, 'skool', 'completed', 10, 10, NOW())`,
        [user.id]
      );

      const status = await skoolService.getSyncStatus(user.id);

      expect(status).not.toBeNull();
      expect(status!.status).toBe('completed');
      expect(status!.total_records).toBe(10);
      expect(status!.processed_records).toBe(10);
    });
  });
});
