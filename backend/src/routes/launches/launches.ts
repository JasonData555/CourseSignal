import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import * as launchService from '../../services/launches/launchService';
import * as launchAnalyticsService from '../../services/launches/launchAnalyticsService';

const router = Router();

/**
 * List launches with pagination and filtering
 * GET /api/launches?page=1&limit=20&status=active&sortBy=start_date&sortOrder=desc
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page, limit, status, sortBy, sortOrder } = req.query;

    const result = await launchService.listLaunches(userId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as any,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    res.json(result);
  } catch (error: any) {
    console.error('List launches error:', error);
    res.status(500).json({ error: error.message || 'Failed to list launches' });
  }
});

/**
 * Create a new launch
 * POST /api/launches
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title, description, start_date, end_date, revenue_goal, sales_goal } = req.body;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: 'Title, start_date, and end_date are required' });
    }

    const launch = await launchService.createLaunch(userId, {
      title,
      description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      revenue_goal: revenue_goal ? parseFloat(revenue_goal) : undefined,
      sales_goal: sales_goal ? parseInt(sales_goal) : undefined,
    });

    res.status(201).json(launch);
  } catch (error: any) {
    console.error('Create launch error:', error);
    res.status(500).json({ error: error.message || 'Failed to create launch' });
  }
});

/**
 * Get a single launch by ID
 * GET /api/launches/:id
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const launch = await launchService.getLaunch(userId, id);
    res.json(launch);
  } catch (error: any) {
    console.error('Get launch error:', error);
    res.status(404).json({ error: error.message || 'Launch not found' });
  }
});

/**
 * Update a launch
 * PUT /api/launches/:id
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, start_date, end_date, revenue_goal, sales_goal } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (revenue_goal !== undefined) updateData.revenue_goal = parseFloat(revenue_goal);
    if (sales_goal !== undefined) updateData.sales_goal = parseInt(sales_goal);

    const launch = await launchService.updateLaunch(userId, id, updateData);
    res.json(launch);
  } catch (error: any) {
    console.error('Update launch error:', error);
    res.status(500).json({ error: error.message || 'Failed to update launch' });
  }
});

/**
 * Delete a launch
 * DELETE /api/launches/:id
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await launchService.deleteLaunch(userId, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete launch error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete launch' });
  }
});

/**
 * Archive a launch
 * POST /api/launches/:id/archive
 */
router.post('/:id/archive', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const launch = await launchService.archiveLaunch(userId, id);
    res.json(launch);
  } catch (error: any) {
    console.error('Archive launch error:', error);
    res.status(500).json({ error: error.message || 'Failed to archive launch' });
  }
});

/**
 * Duplicate a launch
 * POST /api/launches/:id/duplicate
 */
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const launch = await launchService.duplicateLaunch(userId, id);
    res.status(201).json(launch);
  } catch (error: any) {
    console.error('Duplicate launch error:', error);
    res.status(500).json({ error: error.message || 'Failed to duplicate launch' });
  }
});

/**
 * Get launch analytics/metrics
 * GET /api/launches/:id/analytics
 */
router.get('/:id/analytics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const [metrics, attribution, dailyRevenue] = await Promise.all([
      launchAnalyticsService.getLaunchMetrics(userId, id),
      launchAnalyticsService.getLaunchAttribution(userId, id),
      launchAnalyticsService.getDailyRevenueChart(userId, id),
    ]);

    res.json({
      metrics,
      attribution,
      dailyRevenue,
    });
  } catch (error: any) {
    console.error('Get launch analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to get launch analytics' });
  }
});

/**
 * Get live stats for active launch
 * GET /api/launches/:id/live-stats
 */
router.get('/:id/live-stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const stats = await launchAnalyticsService.getLiveStats(userId, id);
    res.json(stats);
  } catch (error: any) {
    console.error('Get live stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to get live stats' });
  }
});

/**
 * Enable sharing for a launch
 * POST /api/launches/:id/enable-share
 */
router.post('/:id/enable-share', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { password, expiresAt } = req.body;

    const options: launchService.ShareOptions = {};
    if (password) options.password = password;
    if (expiresAt) options.expiresAt = new Date(expiresAt);

    const result = await launchService.enableShare(userId, id, options);
    res.json(result);
  } catch (error: any) {
    console.error('Enable share error:', error);
    res.status(500).json({ error: error.message || 'Failed to enable sharing' });
  }
});

/**
 * Disable sharing for a launch
 * POST /api/launches/:id/disable-share
 */
router.post('/:id/disable-share', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const launch = await launchService.disableShare(userId, id);
    res.json(launch);
  } catch (error: any) {
    console.error('Disable share error:', error);
    res.status(500).json({ error: error.message || 'Failed to disable sharing' });
  }
});

/**
 * Get view count for a launch
 * GET /api/launches/:id/views
 */
router.get('/:id/views', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = await launchService.getLaunchViewCount(userId, id);
    res.json(result);
  } catch (error: any) {
    console.error('Get view count error:', error);
    res.status(500).json({ error: error.message || 'Failed to get view count' });
  }
});

/**
 * Compare multiple launches
 * POST /api/launches/compare
 * Body: { launchIds: ['id1', 'id2', 'id3'] }
 */
router.post('/compare', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { launchIds } = req.body;

    if (!launchIds || !Array.isArray(launchIds)) {
      return res.status(400).json({ error: 'launchIds array is required' });
    }

    const comparison = await launchAnalyticsService.compareLaunches(userId, launchIds);
    res.json(comparison);
  } catch (error: any) {
    console.error('Compare launches error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare launches' });
  }
});

/**
 * PUBLIC ENDPOINT: Get launch recap data by share token (no auth required)
 * GET /api/public/launches/:shareToken?password=optional
 */
router.get('/public/:shareToken', async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const { password } = req.query;

    const launch = await launchService.getPublicLaunchData(shareToken, password as string);
    const metrics = await launchAnalyticsService.getPublicLaunchMetrics(shareToken);

    res.json({
      launch,
      metrics,
    });
  } catch (error: any) {
    console.error('Get public launch error:', error);

    if (error.message === 'Password required') {
      return res.status(401).json({ error: error.message, requiresPassword: true });
    }

    if (error.message === 'Invalid password') {
      return res.status(403).json({ error: error.message });
    }

    if (error.message === 'Share link has expired') {
      return res.status(410).json({ error: error.message });
    }

    res.status(404).json({ error: 'Launch not found or sharing disabled' });
  }
});

export default router;
