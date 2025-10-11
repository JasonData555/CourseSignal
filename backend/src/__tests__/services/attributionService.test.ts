/**
 * Attribution Service Tests
 *
 * Tests for the core purchase attribution logic that matches purchases to visitors
 * via email or device fingerprint and assigns first/last touch attribution.
 */

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  createUser,
  createVisitor,
  createSession,
  createPurchase,
  createLaunch,
  expectValidUUID,
  query,
} from '../utils';
import * as attributionService from '../../services/attributionService';
import * as trackingService from '../../services/trackingService';

// Mock the trackingService
jest.mock('../../services/trackingService');
const mockTrackingService = trackingService as jest.Mocked<typeof trackingService>;

// Mock the query function from db/connection
jest.mock('../../db/connection', () => ({
  query: jest.fn(),
}));

const mockQuery = require('../../db/connection').query as jest.MockedFunction<any>;

describe('Attribution Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('attributePurchase', () => {
    it('should match purchase by email and return matched status', async () => {
      const user = await createUser();
      const visitor = await createVisitor({
        userId: user.id,
        email: 'buyer@example.com',
        firstTouchData: {
          source: 'google',
          medium: 'cpc',
          campaign: 'summer-sale',
        },
      });

      const session = await createSession({
        visitorId: visitor.id,
        source: 'facebook',
        medium: 'social',
        campaign: 'retargeting',
      });

      // Mock trackingService responses
      mockTrackingService.findVisitorByEmail.mockResolvedValue({
        id: visitor.id,
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstTouchData: visitor.first_touch_data,
      });

      mockTrackingService.getVisitorSessions.mockResolvedValue([
        {
          session_id: session.session_id,
          source: session.source,
          medium: session.medium,
          campaign: session.campaign,
          content: session.content,
          term: session.term,
          referrer: session.referrer,
          landing_page: session.landing_page,
          timestamp: session.timestamp,
        },
      ]);

      // Mock query for purchase insert
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-123' }],
      });

      // Mock query for launch assignment
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const purchase = {
        email: 'buyer@example.com',
        amount: 99.99,
        currency: 'USD',
        courseName: 'Test Course',
        platform: 'kajabi' as const,
        platformPurchaseId: 'kjb_12345',
        purchasedAt: new Date(),
      };

      const result = await attributionService.attributePurchase(user.id, purchase);

      expect(result.status).toBe('matched');
      expect(result.purchaseId).toBe('purchase-123');
      expect(result.visitorId).toBe(visitor.visitor_id);
      expect(result.firstTouch).toMatchObject({
        source: 'google',
        medium: 'cpc',
        campaign: 'summer-sale',
      });
      expect(result.lastTouch).toMatchObject({
        source: 'facebook',
        medium: 'social',
        campaign: 'retargeting',
      });

      expect(mockTrackingService.findVisitorByEmail).toHaveBeenCalledWith(user.id, 'buyer@example.com');
      expect(mockTrackingService.getVisitorSessions).toHaveBeenCalledWith(visitor.id);
    });

    it('should match purchase by device fingerprint when email match fails', async () => {
      const user = await createUser();
      const fingerprint = 'fp-unique-12345';
      const visitor = await createVisitor({
        userId: user.id,
        deviceFingerprint: fingerprint,
        firstTouchData: {
          source: 'instagram',
          medium: 'social',
          campaign: 'influencer',
        },
      });

      const session = await createSession({
        visitorId: visitor.id,
        source: 'direct',
        medium: 'none',
      });

      // Mock: email match fails
      mockTrackingService.findVisitorByEmail.mockResolvedValue(null);

      // Mock: fingerprint match succeeds
      mockTrackingService.findVisitorByFingerprint.mockResolvedValue({
        id: visitor.id,
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstTouchData: visitor.first_touch_data,
      });

      mockTrackingService.getVisitorSessions.mockResolvedValue([
        {
          session_id: session.session_id,
          source: session.source,
          medium: session.medium,
          campaign: session.campaign,
          content: session.content,
          term: session.term,
          referrer: session.referrer,
          landing_page: session.landing_page,
          timestamp: session.timestamp,
        },
      ]);

      // Mock purchase insert
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-456' }],
      });

      // Mock launch assignment
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const purchase = {
        email: 'different-email@example.com',
        amount: 199.99,
        platform: 'teachable' as const,
        platformPurchaseId: 'tch_67890',
        purchasedAt: new Date(),
        deviceFingerprint: fingerprint,
      };

      const result = await attributionService.attributePurchase(user.id, purchase);

      expect(result.status).toBe('matched');
      expect(result.visitorId).toBe(visitor.visitor_id);
      expect(mockTrackingService.findVisitorByEmail).toHaveBeenCalledWith(user.id, 'different-email@example.com');
      expect(mockTrackingService.findVisitorByFingerprint).toHaveBeenCalledWith(user.id, fingerprint, 24);
    });

    it('should return unmatched status when no visitor is found', async () => {
      const user = await createUser();

      // Mock: no matches
      mockTrackingService.findVisitorByEmail.mockResolvedValue(null);
      mockTrackingService.findVisitorByFingerprint.mockResolvedValue(null);

      // Mock purchase insert
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-unmatched' }],
      });

      // Mock launch assignment
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const purchase = {
        email: 'unknown@example.com',
        amount: 49.99,
        platform: 'kajabi' as const,
        platformPurchaseId: 'kjb_99999',
        purchasedAt: new Date(),
        deviceFingerprint: 'fp-unknown',
      };

      const result = await attributionService.attributePurchase(user.id, purchase);

      expect(result.status).toBe('unmatched');
      expect(result.purchaseId).toBe('purchase-unmatched');
      expect(result.visitorId).toBeUndefined();
      expect(result.firstTouch).toBeNull();
      expect(result.lastTouch).toBeNull();
    });

    it('should use first touch as last touch when visitor has no sessions', async () => {
      const user = await createUser();
      const visitor = await createVisitor({
        userId: user.id,
        email: 'nosessions@example.com',
        firstTouchData: {
          source: 'youtube',
          medium: 'video',
          campaign: 'tutorial',
        },
      });

      mockTrackingService.findVisitorByEmail.mockResolvedValue({
        id: visitor.id,
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstTouchData: visitor.first_touch_data,
      });

      // No sessions
      mockTrackingService.getVisitorSessions.mockResolvedValue([]);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-nosessions' }],
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const purchase = {
        email: 'nosessions@example.com',
        amount: 299.99,
        platform: 'stripe' as const,
        platformPurchaseId: 'stripe_abc',
        purchasedAt: new Date(),
      };

      const result = await attributionService.attributePurchase(user.id, purchase);

      expect(result.status).toBe('matched');
      expect(result.firstTouch).toEqual(result.lastTouch);
      expect(result.firstTouch.source).toBe('youtube');
    });

    it('should auto-assign purchase to active launch within date range', async () => {
      const user = await createUser();
      const visitor = await createVisitor({
        userId: user.id,
        email: 'launch@example.com',
      });

      mockTrackingService.findVisitorByEmail.mockResolvedValue({
        id: visitor.id,
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstTouchData: visitor.first_touch_data,
      });

      mockTrackingService.getVisitorSessions.mockResolvedValue([]);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-launch' }],
      });

      // Mock launch assignment (simulates finding active launch)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'launch-123' }] });

      const purchase = {
        email: 'launch@example.com',
        amount: 499.99,
        platform: 'kajabi' as const,
        platformPurchaseId: 'kjb_launch',
        purchasedAt: new Date(),
      };

      await attributionService.attributePurchase(user.id, purchase);

      // Verify launch assignment query was called
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const launchAssignmentCall = mockQuery.mock.calls[1];
      expect(launchAssignmentCall[0]).toContain('UPDATE purchases p');
      expect(launchAssignmentCall[0]).toContain('SET launch_id = l.id');
      expect(launchAssignmentCall[1]).toEqual(['purchase-launch', user.id]);
    });

    it('should handle purchase with missing optional fields', async () => {
      const user = await createUser();
      const visitor = await createVisitor({
        userId: user.id,
        email: 'minimal@example.com',
      });

      mockTrackingService.findVisitorByEmail.mockResolvedValue({
        id: visitor.id,
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstTouchData: visitor.first_touch_data,
      });

      mockTrackingService.getVisitorSessions.mockResolvedValue([]);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-minimal' }],
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const purchase = {
        email: 'minimal@example.com',
        amount: 99,
        platform: 'kajabi' as const,
        platformPurchaseId: 'minimal',
        purchasedAt: new Date(),
        // No currency, courseName, deviceFingerprint
      };

      const result = await attributionService.attributePurchase(user.id, purchase);

      expect(result.status).toBe('matched');
      expect(result.purchaseId).toBe('purchase-minimal');

      // Verify query used 'USD' as default currency
      const insertCall = mockQuery.mock.calls[0];
      expect(insertCall[1]).toContain('USD'); // Default currency
    });

    it('should prioritize email match over fingerprint match', async () => {
      const user = await createUser();
      const emailVisitor = await createVisitor({
        userId: user.id,
        email: 'priority@example.com',
        firstTouchData: { source: 'email', medium: 'newsletter' },
      });

      const fingerprintVisitor = await createVisitor({
        userId: user.id,
        deviceFingerprint: 'fp-123',
        firstTouchData: { source: 'google', medium: 'cpc' },
      });

      // Email match succeeds
      mockTrackingService.findVisitorByEmail.mockResolvedValue({
        id: emailVisitor.id,
        visitorId: emailVisitor.visitor_id,
        email: emailVisitor.email,
        firstTouchData: emailVisitor.first_touch_data,
      });

      mockTrackingService.getVisitorSessions.mockResolvedValue([]);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-priority' }],
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const purchase = {
        email: 'priority@example.com',
        amount: 99,
        platform: 'kajabi' as const,
        platformPurchaseId: 'priority',
        purchasedAt: new Date(),
        deviceFingerprint: 'fp-123',
      };

      const result = await attributionService.attributePurchase(user.id, purchase);

      // Should use email visitor, not fingerprint visitor
      expect(result.visitorId).toBe(emailVisitor.visitor_id);
      expect(result.firstTouch.source).toBe('email');

      // Fingerprint match should NOT be called
      expect(mockTrackingService.findVisitorByFingerprint).not.toHaveBeenCalled();
    });

    it('should handle visitor with multiple sessions and use most recent for last touch', async () => {
      const user = await createUser();
      const visitor = await createVisitor({
        userId: user.id,
        email: 'multisession@example.com',
        firstTouchData: { source: 'organic', medium: 'search' },
      });

      const now = new Date();
      const session1 = {
        session_id: 'session-1',
        source: 'google',
        medium: 'cpc',
        campaign: 'campaign-1',
        timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
      };

      const session2 = {
        session_id: 'session-2',
        source: 'facebook',
        medium: 'social',
        campaign: 'campaign-2',
        timestamp: new Date(now.getTime() - 1800000), // 30 min ago
      };

      const session3 = {
        session_id: 'session-3',
        source: 'email',
        medium: 'newsletter',
        campaign: 'campaign-3',
        timestamp: new Date(now.getTime() - 600000), // 10 min ago (most recent)
      };

      mockTrackingService.findVisitorByEmail.mockResolvedValue({
        id: visitor.id,
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstTouchData: visitor.first_touch_data,
      });

      mockTrackingService.getVisitorSessions.mockResolvedValue([
        session1,
        session2,
        session3,
      ]);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'purchase-multisession' }],
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const purchase = {
        email: 'multisession@example.com',
        amount: 199,
        platform: 'kajabi' as const,
        platformPurchaseId: 'multisession',
        purchasedAt: new Date(),
      };

      const result = await attributionService.attributePurchase(user.id, purchase);

      // Last touch should be the most recent session (session3)
      expect(result.lastTouch.source).toBe('email');
      expect(result.lastTouch.medium).toBe('newsletter');
      expect(result.lastTouch.campaign).toBe('campaign-3');
    });
  });

  describe('reattributePurchase', () => {
    it('should successfully reattribute an unmatched purchase', async () => {
      const user = await createUser();
      const purchase = await createPurchase({
        userId: user.id,
        email: 'reattribute@example.com',
        attributionStatus: 'unmatched',
      });

      const visitor = await createVisitor({
        userId: user.id,
        email: 'reattribute@example.com',
      });

      const session = await createSession({
        visitorId: visitor.id,
        source: 'twitter',
        medium: 'social',
      });

      // Mock purchase lookup
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            user_id: user.id,
            email: 'reattribute@example.com',
            platform_purchase_id: purchase.platform_purchase_id,
          },
        ],
      });

      mockTrackingService.findVisitorByEmail.mockResolvedValue({
        id: visitor.id,
        visitorId: visitor.visitor_id,
        email: visitor.email,
        firstTouchData: visitor.first_touch_data,
      });

      mockTrackingService.getVisitorSessions.mockResolvedValue([
        {
          session_id: session.session_id,
          source: session.source,
          medium: session.medium,
          campaign: session.campaign,
        },
      ]);

      // Mock update query
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await attributionService.reattributePurchase(purchase.id);

      expect(result.status).toBe('matched');
      expect(result.visitorId).toBe(visitor.visitor_id);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should return still_unmatched when visitor is not found', async () => {
      const user = await createUser();
      const purchase = await createPurchase({
        userId: user.id,
        email: 'notfound@example.com',
        attributionStatus: 'unmatched',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            user_id: user.id,
            email: 'notfound@example.com',
            platform_purchase_id: purchase.platform_purchase_id,
          },
        ],
      });

      mockTrackingService.findVisitorByEmail.mockResolvedValue(null);

      const result = await attributionService.reattributePurchase(purchase.id);

      expect(result.status).toBe('still_unmatched');
    });

    it('should throw error when purchase is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        attributionService.reattributePurchase('nonexistent-id')
      ).rejects.toThrow('Purchase not found');
    });
  });

  describe('getMatchRate', () => {
    it('should calculate match rate correctly with mixed purchases', async () => {
      const user = await createUser();

      // Create 3 matched and 1 unmatched purchases
      await createPurchase({ userId: user.id, attributionStatus: 'matched' });
      await createPurchase({ userId: user.id, attributionStatus: 'matched' });
      await createPurchase({ userId: user.id, attributionStatus: 'matched' });
      await createPurchase({ userId: user.id, attributionStatus: 'unmatched' });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total: '4',
            matched: '3',
          },
        ],
      });

      const matchRate = await attributionService.getMatchRate(user.id);

      expect(matchRate).toBe(75); // 3/4 = 75%
    });

    it('should return 0 when there are no purchases', async () => {
      const user = await createUser();

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total: '0',
            matched: '0',
          },
        ],
      });

      const matchRate = await attributionService.getMatchRate(user.id);

      expect(matchRate).toBe(0);
    });

    it('should return 100 when all purchases are matched', async () => {
      const user = await createUser();

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total: '5',
            matched: '5',
          },
        ],
      });

      const matchRate = await attributionService.getMatchRate(user.id);

      expect(matchRate).toBe(100);
    });
  });
});
