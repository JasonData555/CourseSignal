/**
 * Launch Service Tests
 *
 * Tests for launch management, sharing, status updates, and purchase auto-assignment.
 * This service handles time-limited promotion tracking and analytics.
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
  expectAsyncThrow,
  query,
} from '../utils';
import * as launchService from '../../services/launchService';

describe('Launch Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('createLaunch', () => {
    it('should create a new launch with valid data', async () => {
      const user = await createUser();
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-14');

      const launch = await launchService.createLaunch(user.id, {
        title: 'Summer Sale 2024',
        description: 'Our biggest sale of the year',
        start_date: startDate,
        end_date: endDate,
        revenue_goal: 10000,
        sales_goal: 100,
      });

      expect(launch).toBeDefined();
      expectValidUUID(launch.id);
      expect(launch.title).toBe('Summer Sale 2024');
      expect(launch.description).toBe('Our biggest sale of the year');
      expect(new Date(launch.start_date)).toEqual(startDate);
      expect(new Date(launch.end_date)).toEqual(endDate);
      expect(parseFloat(launch.revenue_goal)).toBe(10000);
      expect(parseInt(launch.sales_goal)).toBe(100);
    });

    it('should auto-assign existing purchases within date range', async () => {
      const user = await createUser();
      const startDate = new Date('2024-06-01T00:00:00Z');
      const endDate = new Date('2024-06-14T23:59:59Z');

      // Create purchases within and outside the date range
      const purchaseInRange = await createPurchase({
        userId: user.id,
        purchasedAt: new Date('2024-06-05T12:00:00Z'),
      });

      const purchaseBeforeRange = await createPurchase({
        userId: user.id,
        purchasedAt: new Date('2024-05-30T12:00:00Z'),
      });

      const purchaseAfterRange = await createPurchase({
        userId: user.id,
        purchasedAt: new Date('2024-06-20T12:00:00Z'),
      });

      const launch = await launchService.createLaunch(user.id, {
        title: 'Test Launch',
        start_date: startDate,
        end_date: endDate,
      });

      // Verify only the purchase within range was assigned
      const result = await query(
        'SELECT id, launch_id FROM purchases WHERE user_id = $1',
        [user.id]
      );

      const purchases = result.rows;
      const inRange = purchases.find(p => p.id === purchaseInRange.id);
      const beforeRange = purchases.find(p => p.id === purchaseBeforeRange.id);
      const afterRange = purchases.find(p => p.id === purchaseAfterRange.id);

      expect(inRange?.launch_id).toBe(launch.id);
      expect(beforeRange?.launch_id).toBeNull();
      expect(afterRange?.launch_id).toBeNull();
    });

    it('should throw error if end date is before start date', async () => {
      const user = await createUser();

      await expectAsyncThrow(
        () => launchService.createLaunch(user.id, {
          title: 'Invalid Launch',
          start_date: new Date('2024-06-14'),
          end_date: new Date('2024-06-01'), // Before start date
        }),
        'End date must be after start date'
      );
    });

    it('should create launch with minimal required fields', async () => {
      const user = await createUser();

      const launch = await launchService.createLaunch(user.id, {
        title: 'Minimal Launch',
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-07-14'),
      });

      expect(launch.title).toBe('Minimal Launch');
      expect(launch.description).toBeNull();
      expect(launch.revenue_goal).toBeNull();
      expect(launch.sales_goal).toBeNull();
    });

    it('should set initial status based on current date', async () => {
      const user = await createUser();

      // Future launch
      const futureLaunch = await launchService.createLaunch(user.id, {
        title: 'Future Launch',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      expect(futureLaunch.status).toBe('upcoming');

      // Active launch
      const activeLaunch = await launchService.createLaunch(user.id, {
        title: 'Active Launch',
        start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(activeLaunch.status).toBe('active');

      // Past launch
      const pastLaunch = await launchService.createLaunch(user.id, {
        title: 'Past Launch',
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Ended 7 days ago
      });

      expect(pastLaunch.status).toBe('completed');
    });
  });

  describe('getLaunch', () => {
    it('should retrieve launch with computed fields', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });

      // Add some purchases
      await createPurchase({ userId: user.id, launchId: launch.id, amount: 100 });
      await createPurchase({ userId: user.id, launchId: launch.id, amount: 200 });

      const result = await launchService.getLaunch(user.id, launch.id);

      expect(result.id).toBe(launch.id);
      expect(parseInt(result.purchase_count)).toBe(2);
      expect(parseFloat(result.current_revenue)).toBe(300);
    });

    it('should throw error if launch not found', async () => {
      const user = await createUser();

      await expectAsyncThrow(
        () => launchService.getLaunch(user.id, 'nonexistent-id'),
        'Launch not found'
      );
    });

    it('should not retrieve launch belonging to different user', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const launch = await createLaunch({ userId: user1.id });

      await expectAsyncThrow(
        () => launchService.getLaunch(user2.id, launch.id),
        'Launch not found'
      );
    });
  });

  describe('updateLaunch', () => {
    it('should update launch title and description', async () => {
      const user = await createUser();
      const launch = await createLaunch({
        userId: user.id,
        title: 'Original Title',
        description: 'Original Description',
      });

      const updated = await launchService.updateLaunch(user.id, launch.id, {
        title: 'Updated Title',
        description: 'Updated Description',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated Description');
    });

    it('should update revenue and sales goals', async () => {
      const user = await createUser();
      const launch = await createLaunch({
        userId: user.id,
        revenueGoal: 5000,
        salesGoal: 50,
      });

      const updated = await launchService.updateLaunch(user.id, launch.id, {
        revenue_goal: 10000,
        sales_goal: 100,
      });

      expect(parseFloat(updated.revenue_goal)).toBe(10000);
      expect(parseInt(updated.sales_goal)).toBe(100);
    });

    it('should reassign purchases when date range changes', async () => {
      const user = await createUser();

      // Create launch with initial date range
      const launch = await createLaunch({
        userId: user.id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-07'),
      });

      // Create purchases
      const purchase1 = await createPurchase({
        userId: user.id,
        purchasedAt: new Date('2024-06-05'), // In original range
      });

      const purchase2 = await createPurchase({
        userId: user.id,
        purchasedAt: new Date('2024-06-10'), // Outside original range
      });

      // Manually assign purchase1 to launch
      await query('UPDATE purchases SET launch_id = $1 WHERE id = $2', [launch.id, purchase1.id]);

      // Update launch to extend date range
      await launchService.updateLaunch(user.id, launch.id, {
        end_date: new Date('2024-06-14'), // Now includes purchase2
      });

      // Verify purchases were reassigned
      const purchases = await query(
        'SELECT id, launch_id FROM purchases WHERE user_id = $1 ORDER BY purchased_at',
        [user.id]
      );

      expect(purchases.rows[0].launch_id).toBe(launch.id); // purchase1 still assigned
      expect(purchases.rows[1].launch_id).toBe(launch.id); // purchase2 now assigned
    });

    it('should throw error if no fields provided to update', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });

      await expectAsyncThrow(
        () => launchService.updateLaunch(user.id, launch.id, {}),
        'No fields to update'
      );
    });

    it('should throw error if launch not found', async () => {
      const user = await createUser();

      await expectAsyncThrow(
        () => launchService.updateLaunch(user.id, 'nonexistent-id', { title: 'New Title' }),
        'Launch not found'
      );
    });
  });

  describe('deleteLaunch', () => {
    it('should delete a launch', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });

      const result = await launchService.deleteLaunch(user.id, launch.id);

      expect(result.success).toBe(true);

      // Verify launch is deleted
      const check = await query('SELECT id FROM launches WHERE id = $1', [launch.id]);
      expect(check.rows.length).toBe(0);
    });

    it('should throw error if launch not found', async () => {
      const user = await createUser();

      await expectAsyncThrow(
        () => launchService.deleteLaunch(user.id, 'nonexistent-id'),
        'Launch not found'
      );
    });

    it('should unlink purchases when launch is deleted', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });
      const purchase = await createPurchase({ userId: user.id, launchId: launch.id });

      await launchService.deleteLaunch(user.id, launch.id);

      // Verify purchase launch_id is now null (CASCADE behavior)
      const purchaseCheck = await query(
        'SELECT launch_id FROM purchases WHERE id = $1',
        [purchase.id]
      );
      expect(purchaseCheck.rows[0].launch_id).toBeNull();
    });
  });

  describe('archiveLaunch', () => {
    it('should set launch status to archived', async () => {
      const user = await createUser();
      const launch = await createLaunch({
        userId: user.id,
        status: 'completed',
      });

      const archived = await launchService.archiveLaunch(user.id, launch.id);

      expect(archived.status).toBe('archived');
    });

    it('should throw error if launch not found', async () => {
      const user = await createUser();

      await expectAsyncThrow(
        () => launchService.archiveLaunch(user.id, 'nonexistent-id'),
        'Launch not found'
      );
    });
  });

  describe('listLaunches', () => {
    it('should return paginated list of launches', async () => {
      const user = await createUser();

      // Create 5 launches
      for (let i = 0; i < 5; i++) {
        await createLaunch({
          userId: user.id,
          title: `Launch ${i + 1}`,
        });
      }

      const result = await launchService.listLaunches(user.id, {
        page: 1,
        limit: 3,
      });

      expect(result.launches.length).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.pages).toBe(2);
    });

    it('should filter launches by status', async () => {
      const user = await createUser();

      await createLaunch({ userId: user.id, status: 'upcoming' });
      await createLaunch({ userId: user.id, status: 'active' });
      await createLaunch({ userId: user.id, status: 'completed' });
      await createLaunch({ userId: user.id, status: 'archived' });

      const activeOnly = await launchService.listLaunches(user.id, {
        status: 'active',
      });

      expect(activeOnly.launches.length).toBe(1);
      expect(activeOnly.launches[0].status).toBe('active');
    });

    it('should sort launches by specified field and order', async () => {
      const user = await createUser();

      await createLaunch({
        userId: user.id,
        title: 'Launch A',
        startDate: new Date('2024-06-01'),
      });

      await createLaunch({
        userId: user.id,
        title: 'Launch B',
        startDate: new Date('2024-07-01'),
      });

      await createLaunch({
        userId: user.id,
        title: 'Launch C',
        startDate: new Date('2024-05-01'),
      });

      // Sort by start_date ascending
      const ascending = await launchService.listLaunches(user.id, {
        sortBy: 'start_date',
        sortOrder: 'asc',
      });

      expect(ascending.launches[0].title).toBe('Launch C'); // May 1
      expect(ascending.launches[1].title).toBe('Launch A'); // Jun 1
      expect(ascending.launches[2].title).toBe('Launch B'); // Jul 1

      // Sort by start_date descending
      const descending = await launchService.listLaunches(user.id, {
        sortBy: 'start_date',
        sortOrder: 'desc',
      });

      expect(descending.launches[0].title).toBe('Launch B'); // Jul 1
      expect(descending.launches[1].title).toBe('Launch A'); // Jun 1
      expect(descending.launches[2].title).toBe('Launch C'); // May 1
    });

    it('should return empty list if no launches match filter', async () => {
      const user = await createUser();

      const result = await launchService.listLaunches(user.id, {
        status: 'active',
      });

      expect(result.launches.length).toBe(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should only return launches for specified user', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      await createLaunch({ userId: user1.id });
      await createLaunch({ userId: user1.id });
      await createLaunch({ userId: user2.id });

      const user1Launches = await launchService.listLaunches(user1.id);

      expect(user1Launches.launches.length).toBe(2);
    });
  });

  describe('enableShare', () => {
    it('should enable sharing and generate share token', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });

      const result = await launchService.enableShare(user.id, launch.id);

      expect(result.shareToken).toBeDefined();
      expectValidUUID(result.shareToken);
      expect(result.shareUrl).toContain(result.shareToken);
      expect(result.launch.share_enabled).toBe(true);
      expect(result.launch.share_token).toBe(result.shareToken);
    });

    it('should enable sharing with password protection', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });

      const result = await launchService.enableShare(user.id, launch.id, {
        password: 'secret123',
      });

      expect(result.launch.share_password_hash).toBeDefined();
      expect(result.launch.share_password_hash).not.toBe('secret123'); // Should be hashed
    });

    it('should enable sharing with expiration date', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const result = await launchService.enableShare(user.id, launch.id, {
        expiresAt,
      });

      expect(result.launch.share_expires_at).toBeDefined();
      expect(new Date(result.launch.share_expires_at).getTime()).toBeCloseTo(
        expiresAt.getTime(),
        -3 // Within 1000ms
      );
    });

    it('should throw error if launch not found', async () => {
      const user = await createUser();

      await expectAsyncThrow(
        () => launchService.enableShare(user.id, 'nonexistent-id'),
        'Launch not found'
      );
    });
  });

  describe('disableShare', () => {
    it('should disable sharing for a launch', async () => {
      const user = await createUser();
      const launch = await createLaunch({
        userId: user.id,
        shareEnabled: true,
        shareToken: uuidv4(),
      });

      const result = await launchService.disableShare(user.id, launch.id);

      expect(result.share_enabled).toBe(false);
    });

    it('should throw error if launch not found', async () => {
      const user = await createUser();

      await expectAsyncThrow(
        () => launchService.disableShare(user.id, 'nonexistent-id'),
        'Launch not found'
      );
    });
  });

  describe('updateAllLaunchStatuses', () => {
    it('should update upcoming launches to active when start date reached', async () => {
      const user = await createUser();

      // Create upcoming launch that should become active
      const upcomingLaunch = await createLaunch({
        userId: user.id,
        startDate: new Date(Date.now() - 3600000), // Started 1 hour ago
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
      });

      const result = await launchService.updateAllLaunchStatuses();

      expect(result.activated).toBeGreaterThanOrEqual(1);

      // Verify status was updated
      const updated = await query('SELECT status FROM launches WHERE id = $1', [upcomingLaunch.id]);
      expect(updated.rows[0].status).toBe('active');
    });

    it('should update active launches to completed when end date passed', async () => {
      const user = await createUser();

      // Create active launch that should be completed
      const activeLaunch = await createLaunch({
        userId: user.id,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 3600000), // Ended 1 hour ago
        status: 'active',
      });

      const result = await launchService.updateAllLaunchStatuses();

      expect(result.completed).toBeGreaterThanOrEqual(1);

      // Verify status was updated
      const updated = await query('SELECT status FROM launches WHERE id = $1', [activeLaunch.id]);
      expect(updated.rows[0].status).toBe('completed');
    });

    it('should not update archived launches', async () => {
      const user = await createUser();

      // Create archived launch with dates that would trigger update
      const archivedLaunch = await createLaunch({
        userId: user.id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'archived',
      });

      await launchService.updateAllLaunchStatuses();

      // Verify status remains archived
      const updated = await query('SELECT status FROM launches WHERE id = $1', [archivedLaunch.id]);
      expect(updated.rows[0].status).toBe('archived');
    });

    it('should return counts of activated and completed launches', async () => {
      const user = await createUser();

      // No launches to update
      const result = await launchService.updateAllLaunchStatuses();

      expect(result).toHaveProperty('activated');
      expect(result).toHaveProperty('completed');
      expect(typeof result.activated).toBe('number');
      expect(typeof result.completed).toBe('number');
    });
  });

  describe('duplicateLaunch', () => {
    it('should create a copy of an existing launch', async () => {
      const user = await createUser();
      const original = await createLaunch({
        userId: user.id,
        title: 'Original Launch',
        description: 'Original Description',
        revenueGoal: 5000,
        salesGoal: 50,
      });

      const duplicate = await launchService.duplicateLaunch(user.id, original.id);

      expect(duplicate.title).toBe('Original Launch (Copy)');
      expect(duplicate.description).toBe('Original Description');
      expect(parseFloat(duplicate.revenue_goal)).toBe(5000);
      expect(parseInt(duplicate.sales_goal)).toBe(50);
      expect(duplicate.id).not.toBe(original.id);
    });

    it('should set new dates for duplicated launch', async () => {
      const user = await createUser();
      const original = await createLaunch({
        userId: user.id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-14'),
      });

      const duplicate = await launchService.duplicateLaunch(user.id, original.id);

      // Dates should be different from original
      expect(new Date(duplicate.start_date).getTime()).not.toBe(
        new Date(original.start_date).getTime()
      );
      expect(new Date(duplicate.end_date).getTime()).not.toBe(
        new Date(original.end_date).getTime()
      );
    });
  });

  describe('getLaunchViewCount', () => {
    it('should return view count for a launch', async () => {
      const user = await createUser();
      const launch = await createLaunch({
        userId: user.id,
        shareEnabled: true,
        shareToken: 'test-token',
      });

      // Simulate views
      await query('INSERT INTO launch_views (launch_id, share_token) VALUES ($1, $2)', [
        launch.id,
        'test-token',
      ]);
      await query('INSERT INTO launch_views (launch_id, share_token) VALUES ($1, $2)', [
        launch.id,
        'test-token',
      ]);

      const result = await launchService.getLaunchViewCount(user.id, launch.id);

      expect(result.viewCount).toBe(2);
    });

    it('should return 0 views for launch with no views', async () => {
      const user = await createUser();
      const launch = await createLaunch({ userId: user.id });

      const result = await launchService.getLaunchViewCount(user.id, launch.id);

      expect(result.viewCount).toBe(0);
    });
  });
});
