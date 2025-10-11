/**
 * Analytics Service Tests
 *
 * Tests for dashboard analytics, revenue attribution, and data drill-down functionality.
 * This service provides aggregated metrics and reporting for the platform.
 */

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  createUser,
  createVisitor,
  createSession,
  createPurchase,
  query,
} from '../utils';
import * as analyticsService from '../../services/analyticsService';

describe('Analytics Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('getDashboardSummary', () => {
    it('should calculate summary metrics for a date range', async () => {
      const user = await createUser();

      // Create purchases within date range
      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      await createPurchase({
        userId: user.id,
        amount: 100,
        email: 'buyer1@example.com',
        purchasedAt: new Date('2024-06-05T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 200,
        email: 'buyer2@example.com',
        purchasedAt: new Date('2024-06-10T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 300,
        email: 'buyer1@example.com', // Same buyer, different purchase
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const summary = await analyticsService.getDashboardSummary(user.id, {
        startDate,
        endDate,
      });

      expect(summary.totalRevenue).toBe(600);
      expect(summary.totalStudents).toBe(2); // Unique emails
      expect(summary.totalPurchases).toBe(3);
      expect(summary.avgOrderValue).toBe(200); // 600 / 3
    });

    it('should calculate trends compared to previous period', async () => {
      const user = await createUser();

      // Current period: June 1-30
      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Previous period: May 1-31 (automatic calculation)
      await createPurchase({
        userId: user.id,
        amount: 100,
        email: 'prev1@example.com',
        purchasedAt: new Date('2024-05-15T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 100,
        email: 'prev2@example.com',
        purchasedAt: new Date('2024-05-20T12:00:00Z'),
      });

      // Current period
      await createPurchase({
        userId: user.id,
        amount: 300,
        email: 'current1@example.com',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const summary = await analyticsService.getDashboardSummary(user.id, {
        startDate,
        endDate,
      });

      // Revenue trend: (300 - 200) / 200 * 100 = 50%
      expect(summary.trends.revenue).toBe(50);

      // Students trend: (1 - 2) / 2 * 100 = -50%
      expect(summary.trends.students).toBe(-50);
    });

    it('should return zeros for empty period', async () => {
      const user = await createUser();

      const summary = await analyticsService.getDashboardSummary(user.id, {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      });

      expect(summary.totalRevenue).toBe(0);
      expect(summary.totalStudents).toBe(0);
      expect(summary.totalPurchases).toBe(0);
      expect(summary.avgOrderValue).toBe(0);
      expect(summary.trends.revenue).toBe(0);
      expect(summary.trends.students).toBe(0);
    });

    it('should only include purchases within date range', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Within range
      await createPurchase({
        userId: user.id,
        amount: 100,
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      // Before range
      await createPurchase({
        userId: user.id,
        amount: 200,
        purchasedAt: new Date('2024-05-31T12:00:00Z'),
      });

      // After range
      await createPurchase({
        userId: user.id,
        amount: 300,
        purchasedAt: new Date('2024-07-01T12:00:00Z'),
      });

      const summary = await analyticsService.getDashboardSummary(user.id, {
        startDate,
        endDate,
      });

      expect(summary.totalRevenue).toBe(100);
      expect(summary.totalPurchases).toBe(1);
    });

    it('should handle zero previous period revenue for trend calculation', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Only current period purchases (no previous period)
      await createPurchase({
        userId: user.id,
        amount: 100,
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const summary = await analyticsService.getDashboardSummary(user.id, {
        startDate,
        endDate,
      });

      // Should handle divide by zero gracefully
      expect(summary.trends.revenue).toBe(0);
      expect(summary.trends.students).toBe(0);
    });
  });

  describe('getRevenueBySource', () => {
    it('should aggregate revenue by source', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Create visitors for tracking
      const googleVisitor = await createVisitor({
        userId: user.id,
        firstTouchData: { source: 'google', medium: 'cpc' },
      });

      const facebookVisitor = await createVisitor({
        userId: user.id,
        firstTouchData: { source: 'facebook', medium: 'social' },
      });

      // Create purchases with different sources
      await createPurchase({
        userId: user.id,
        visitorId: googleVisitor.id,
        amount: 100,
        firstTouchSource: 'google',
        email: 'google1@example.com',
        purchasedAt: new Date('2024-06-05T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        visitorId: googleVisitor.id,
        amount: 200,
        firstTouchSource: 'google',
        email: 'google2@example.com',
        purchasedAt: new Date('2024-06-10T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        visitorId: facebookVisitor.id,
        amount: 150,
        firstTouchSource: 'facebook',
        email: 'facebook1@example.com',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getRevenueBySource(user.id, {
        startDate,
        endDate,
      });

      const googleStats = result.find(r => r.source === 'google');
      const facebookStats = result.find(r => r.source === 'facebook');

      expect(googleStats).toBeDefined();
      expect(googleStats?.revenue).toBe(300);
      expect(googleStats?.students).toBe(2);
      expect(googleStats?.avgOrderValue).toBe('150.00'); // 300 / 2

      expect(facebookStats).toBeDefined();
      expect(facebookStats?.revenue).toBe(150);
      expect(facebookStats?.students).toBe(1);
    });

    it('should calculate conversion rates correctly', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Create 10 visitors from Google
      for (let i = 0; i < 10; i++) {
        await createVisitor({
          userId: user.id,
          firstTouchData: { source: 'google', medium: 'cpc' },
        });
      }

      // Create 2 purchases from Google (20% conversion)
      const googleVisitor = await createVisitor({
        userId: user.id,
        firstTouchData: { source: 'google', medium: 'cpc' },
      });

      await createPurchase({
        userId: user.id,
        visitorId: googleVisitor.id,
        amount: 100,
        firstTouchSource: 'google',
        email: 'buyer1@example.com',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        visitorId: googleVisitor.id,
        amount: 100,
        firstTouchSource: 'google',
        email: 'buyer2@example.com',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getRevenueBySource(user.id, {
        startDate,
        endDate,
      });

      const googleStats = result.find(r => r.source === 'google');

      // 2 buyers / 11 total visitors = 18.18% (rounded)
      expect(googleStats?.conversionRate).toBe('18.18');
    });

    it('should handle unmatched purchases', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: null, // Unmatched
        attributionStatus: 'unmatched',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getRevenueBySource(user.id, {
        startDate,
        endDate,
      });

      const unmatchedStats = result.find(r => r.source === 'unmatched');

      expect(unmatchedStats).toBeDefined();
      expect(unmatchedStats?.revenue).toBe(100);
    });

    it('should order results by revenue descending', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Create purchases with different revenue amounts
      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: 'google',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 500,
        firstTouchSource: 'facebook',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 300,
        firstTouchSource: 'email',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getRevenueBySource(user.id, {
        startDate,
        endDate,
      });

      expect(result[0].source).toBe('facebook'); // Highest revenue
      expect(result[1].source).toBe('email');
      expect(result[2].source).toBe('google');
    });

    it('should calculate revenue per visitor', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Create 5 visitors
      for (let i = 0; i < 5; i++) {
        await createVisitor({
          userId: user.id,
          firstTouchData: { source: 'twitter', medium: 'social' },
        });
      }

      // Create purchases totaling $500
      await createPurchase({
        userId: user.id,
        amount: 500,
        firstTouchSource: 'twitter',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getRevenueBySource(user.id, {
        startDate,
        endDate,
      });

      const twitterStats = result.find(r => r.source === 'twitter');

      // 500 revenue / 5 visitors = 100.00
      expect(twitterStats?.revenuePerVisitor).toBe('100.00');
    });
  });

  describe('getRecentPurchases', () => {
    it('should return recent purchases ordered by date', async () => {
      const user = await createUser();

      const purchase1 = await createPurchase({
        userId: user.id,
        amount: 100,
        courseName: 'Course 1',
        firstTouchSource: 'google',
        purchasedAt: new Date('2024-06-01T12:00:00Z'),
      });

      const purchase2 = await createPurchase({
        userId: user.id,
        amount: 200,
        courseName: 'Course 2',
        firstTouchSource: 'facebook',
        purchasedAt: new Date('2024-06-05T12:00:00Z'),
      });

      const purchase3 = await createPurchase({
        userId: user.id,
        amount: 300,
        courseName: 'Course 3',
        firstTouchSource: 'email',
        purchasedAt: new Date('2024-06-10T12:00:00Z'),
      });

      const result = await analyticsService.getRecentPurchases(user.id, 10);

      expect(result.length).toBe(3);
      // Should be ordered by purchasedAt DESC (most recent first)
      expect(result[0].courseName).toBe('Course 3');
      expect(result[1].courseName).toBe('Course 2');
      expect(result[2].courseName).toBe('Course 1');
    });

    it('should limit results to specified count', async () => {
      const user = await createUser();

      // Create 10 purchases
      for (let i = 0; i < 10; i++) {
        await createPurchase({
          userId: user.id,
          amount: 100,
          purchasedAt: new Date(`2024-06-${String(i + 1).padStart(2, '0')}T12:00:00Z`),
        });
      }

      const result = await analyticsService.getRecentPurchases(user.id, 5);

      expect(result.length).toBe(5);
    });

    it('should default to 20 purchases if no limit specified', async () => {
      const user = await createUser();

      // Create 25 purchases
      for (let i = 0; i < 25; i++) {
        await createPurchase({
          userId: user.id,
          amount: 100,
          purchasedAt: new Date(`2024-06-01T${String(i).padStart(2, '0')}:00:00Z`),
        });
      }

      const result = await analyticsService.getRecentPurchases(user.id);

      expect(result.length).toBe(20); // Default limit
    });

    it('should include all required fields', async () => {
      const user = await createUser();

      await createPurchase({
        userId: user.id,
        amount: 99.99,
        courseName: 'Test Course',
        firstTouchSource: 'linkedin',
        email: 'buyer@example.com',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getRecentPurchases(user.id);

      expect(result[0]).toMatchObject({
        id: expect.any(String),
        amount: 99.99,
        courseName: 'Test Course',
        source: 'linkedin',
        email: 'buyer@example.com',
        purchasedAt: expect.any(Date),
      });
    });

    it('should show "unmatched" for purchases without source', async () => {
      const user = await createUser();

      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: null,
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getRecentPurchases(user.id);

      expect(result[0].source).toBe('unmatched');
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV with correct headers', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: 'google',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const csv = await analyticsService.exportToCSV(user.id, {
        startDate,
        endDate,
      });

      const lines = csv.split('\n');
      const headers = lines[0];

      expect(headers).toBe(
        'Source,Visitors,Revenue,Students,Conversion Rate %,Avg Order Value,Revenue Per Visitor'
      );
    });

    it('should generate CSV with data rows', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      const visitor = await createVisitor({
        userId: user.id,
        firstTouchData: { source: 'google' },
      });

      await createPurchase({
        userId: user.id,
        visitorId: visitor.id,
        amount: 100,
        firstTouchSource: 'google',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const csv = await analyticsService.exportToCSV(user.id, {
        startDate,
        endDate,
      });

      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThan(1); // Header + at least one data row
      expect(lines[1]).toContain('google');
    });

    it('should handle empty data gracefully', async () => {
      const user = await createUser();

      const csv = await analyticsService.exportToCSV(user.id, {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-30'),
      });

      const lines = csv.split('\n');
      expect(lines.length).toBe(1); // Only headers
    });
  });

  describe('getDrillDownData', () => {
    it('should drill down into specific source by campaign and medium', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Create purchases from Google with different campaigns
      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: 'google',
        firstTouchMedium: 'cpc',
        firstTouchCampaign: 'summer-sale',
        purchasedAt: new Date('2024-06-05T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 200,
        firstTouchSource: 'google',
        firstTouchMedium: 'cpc',
        firstTouchCampaign: 'summer-sale',
        purchasedAt: new Date('2024-06-10T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 150,
        firstTouchSource: 'google',
        firstTouchMedium: 'organic',
        firstTouchCampaign: 'seo',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getDrillDownData(user.id, 'google', {
        startDate,
        endDate,
      });

      expect(result.length).toBe(2); // Two unique campaign/medium combinations

      const summerSale = result.find(r => r.campaign === 'summer-sale');
      const seo = result.find(r => r.campaign === 'seo');

      expect(summerSale).toBeDefined();
      expect(summerSale?.revenue).toBe(300);
      expect(summerSale?.students).toBe(2);
      expect(summerSale?.medium).toBe('cpc');

      expect(seo).toBeDefined();
      expect(seo?.revenue).toBe(150);
      expect(seo?.students).toBe(1);
      expect(seo?.medium).toBe('organic');
    });

    it('should order drill-down results by revenue descending', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: 'facebook',
        firstTouchCampaign: 'campaign-a',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 500,
        firstTouchSource: 'facebook',
        firstTouchCampaign: 'campaign-b',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 300,
        firstTouchSource: 'facebook',
        firstTouchCampaign: 'campaign-c',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getDrillDownData(user.id, 'facebook', {
        startDate,
        endDate,
      });

      expect(result[0].campaign).toBe('campaign-b'); // Highest revenue
      expect(result[1].campaign).toBe('campaign-c');
      expect(result[2].campaign).toBe('campaign-a');
    });

    it('should handle purchases without campaign', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: 'direct',
        firstTouchCampaign: null,
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getDrillDownData(user.id, 'direct', {
        startDate,
        endDate,
      });

      expect(result[0].campaign).toBe('no_campaign');
    });

    it('should only return data for specified source', async () => {
      const user = await createUser();

      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-30T23:59:59Z');

      // Create purchases from different sources
      await createPurchase({
        userId: user.id,
        amount: 100,
        firstTouchSource: 'google',
        firstTouchCampaign: 'google-campaign',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      await createPurchase({
        userId: user.id,
        amount: 200,
        firstTouchSource: 'facebook',
        firstTouchCampaign: 'facebook-campaign',
        purchasedAt: new Date('2024-06-15T12:00:00Z'),
      });

      const result = await analyticsService.getDrillDownData(user.id, 'google', {
        startDate,
        endDate,
      });

      expect(result.length).toBe(1);
      expect(result[0].campaign).toBe('google-campaign');
    });
  });
});
