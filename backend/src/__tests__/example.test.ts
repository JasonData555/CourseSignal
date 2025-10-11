/**
 * Example Test Suite
 *
 * This file demonstrates how to use the testing infrastructure.
 * You can use this as a template for writing your own tests.
 */

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  query,
  countRows,
} from './utils/testDatabase';

import {
  createUser,
  createVisitor,
  createSession,
  createPurchase,
  createLaunch,
  createVisitorJourney,
} from './utils/factories';

import {
  generateTestAccessToken,
  expectValidUUID,
  expectDateClose,
  randomTestData,
} from './utils/testHelpers';

describe('Example Test Suite', () => {
  // Setup: Run once before all tests in this suite
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // Cleanup: Run before each test to ensure clean state
  beforeEach(async () => {
    await clearTestDatabase();
  });

  // Teardown: Run once after all tests in this suite
  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Test Database Utilities', () => {
    it('should create and query the database', async () => {
      const result = await query('SELECT NOW() as now');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeInstanceOf(Date);
    });

    it('should count rows in a table', async () => {
      const count = await countRows('users');
      expect(count).toBe(0);

      await createUser();
      const newCount = await countRows('users');
      expect(newCount).toBe(1);
    });
  });

  describe('User Factory', () => {
    it('should create a user with default values', async () => {
      const user = await createUser();

      expect(user).toBeDefined();
      expectValidUUID(user.id);
      expect(user.email).toMatch(/@example\.com$/);
      expect(user.password_hash).toBeDefined();
      expect(user.email_verified).toBe(false);
      expect(user.subscription_status).toBe('trial');
      expect(user.plainPassword).toBe('Test123456');
    });

    it('should create a user with custom values', async () => {
      const user = await createUser({
        email: 'custom@test.com',
        password: 'CustomPass123',
        emailVerified: true,
        subscriptionStatus: 'active',
      });

      expect(user.email).toBe('custom@test.com');
      expect(user.plainPassword).toBe('CustomPass123');
      expect(user.email_verified).toBe(true);
      expect(user.subscription_status).toBe('active');
    });
  });

  describe('Visitor Factory', () => {
    it('should create a visitor with associated user', async () => {
      const visitor = await createVisitor();

      expectValidUUID(visitor.id);
      expectValidUUID(visitor.user_id);
      expect(visitor.visitor_id).toMatch(/^visitor-/);
      expect(visitor.first_touch_data).toBeDefined();
      expect(visitor.device_fingerprint).toMatch(/^fp-/);
    });

    it('should create a visitor for an existing user', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });

      expect(visitor.user_id).toBe(user.id);
    });
  });

  describe('Session Factory', () => {
    it('should create a session with default UTM parameters', async () => {
      const session = await createSession();

      expectValidUUID(session.id);
      expect(session.source).toBe('google');
      expect(session.medium).toBe('cpc');
      expect(session.campaign).toBe('test-campaign');
    });

    it('should create a session for an existing visitor', async () => {
      const visitor = await createVisitor();
      const session = await createSession({ visitorId: visitor.id });

      expect(session.visitor_id).toBe(visitor.id);
    });
  });

  describe('Purchase Factory', () => {
    it('should create a purchase with default values', async () => {
      const purchase = await createPurchase();

      expectValidUUID(purchase.id);
      expect(purchase.amount).toBe('99.99');
      expect(purchase.currency).toBe('USD');
      expect(purchase.platform).toBe('kajabi');
      expect(purchase.attribution_status).toBe('matched');
    });

    it('should create a purchase with custom attribution', async () => {
      const user = await createUser();
      const visitor = await createVisitor({ userId: user.id });

      const purchase = await createPurchase({
        userId: user.id,
        visitorId: visitor.id,
        email: visitor.email,
        firstTouchSource: 'facebook',
        firstTouchMedium: 'social',
        lastTouchSource: 'email',
        lastTouchMedium: 'newsletter',
      });

      expect(purchase.visitor_id).toBe(visitor.id);
      expect(purchase.first_touch_source).toBe('facebook');
      expect(purchase.first_touch_medium).toBe('social');
      expect(purchase.last_touch_source).toBe('email');
      expect(purchase.last_touch_medium).toBe('newsletter');
    });
  });

  describe('Launch Factory', () => {
    it('should create a launch with default values', async () => {
      const launch = await createLaunch();

      expectValidUUID(launch.id);
      expect(launch.title).toBe('Test Launch');
      expect(launch.status).toBe('upcoming');
      expect(launch.revenue_goal).toBe('10000.00');
      expect(launch.sales_goal).toBe(100);
      expect(launch.share_enabled).toBe(false);
    });

    it('should create a launch with custom dates', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-14');

      const launch = await createLaunch({
        startDate,
        endDate,
        status: 'active',
      });

      expectDateClose(new Date(launch.start_date), startDate, 1000);
      expectDateClose(new Date(launch.end_date), endDate, 1000);
      expect(launch.status).toBe('active');
    });
  });

  describe('Visitor Journey Factory', () => {
    it('should create a complete visitor journey', async () => {
      const journey = await createVisitorJourney({
        email: 'journey@test.com',
        sessions: 3,
        purchase: true,
      });

      expect(journey.user).toBeDefined();
      expect(journey.visitor).toBeDefined();
      expect(journey.sessions).toHaveLength(3);
      expect(journey.purchase).toBeDefined();

      expect(journey.user.email).toBe('journey@test.com');
      expect(journey.visitor.email).toBe('journey@test.com');
      expect(journey.purchase?.email).toBe('journey@test.com');
    });

    it('should create a journey without purchase', async () => {
      const journey = await createVisitorJourney({
        sessions: 2,
        purchase: false,
      });

      expect(journey.sessions).toHaveLength(2);
      expect(journey.purchase).toBeNull();
    });
  });

  describe('Test Helpers', () => {
    it('should generate valid JWT tokens', () => {
      const token = generateTestAccessToken({
        userId: '123',
        email: 'test@example.com',
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should validate UUIDs', () => {
      expectValidUUID('123e4567-e89b-12d3-a456-426614174000');

      expect(() => {
        expectValidUUID('not-a-uuid');
      }).toThrow();
    });

    it('should compare dates with tolerance', () => {
      const date1 = new Date('2024-01-01T12:00:00Z');
      const date2 = new Date('2024-01-01T12:00:00.500Z'); // 500ms later

      expectDateClose(date1, date2, 1000); // Within 1 second tolerance
    });

    it('should generate random test data', () => {
      const email = randomTestData.email();
      expect(email).toMatch(/@example\.com$/);

      const str = randomTestData.string(5);
      expect(str.length).toBeLessThanOrEqual(5);

      const num = randomTestData.number(1, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(10);

      const bool = randomTestData.boolean();
      expect(typeof bool).toBe('boolean');

      const date = randomTestData.date(7);
      expect(date.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Integration Example', () => {
    it('should demonstrate a complete test scenario', async () => {
      // 1. Create a user
      const user = await createUser({
        email: 'test@coursesignal.com',
        emailVerified: true,
      });

      // 2. Create a launch
      const launch = await createLaunch({
        userId: user.id,
        title: 'Summer 2024 Launch',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-14'),
        revenueGoal: 50000,
        salesGoal: 500,
      });

      // 3. Create visitor journey
      const journey = await createVisitorJourney({
        email: 'customer@example.com',
        sessions: 3,
        purchase: true,
      });

      // 4. Associate purchase with launch
      await query(
        'UPDATE purchases SET launch_id = $1, user_id = $2 WHERE id = $3',
        [launch.id, user.id, journey.purchase?.id]
      );

      // 5. Verify data
      const purchaseCount = await countRows('purchases');
      expect(purchaseCount).toBe(1);

      const result = await query(
        'SELECT * FROM purchases WHERE launch_id = $1',
        [launch.id]
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].launch_id).toBe(launch.id);
    });
  });
});
