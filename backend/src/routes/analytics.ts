import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import * as analyticsService from '../services/analyticsService';

const router = Router();

function parseDateRange(range: string) {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'all':
      startDate.setFullYear(2020, 0, 1); // Start from 2020
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  return { startDate, endDate };
}

// Get dashboard summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const dateRange = parseDateRange(range);

    const summary = await analyticsService.getDashboardSummary(req.user!.userId, dateRange);

    res.json(summary);
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get revenue by source
router.get('/sources', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const dateRange = parseDateRange(range);

    const sources = await analyticsService.getRevenueBySource(req.user!.userId, dateRange);

    res.json(sources);
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue by source' });
  }
});

// Get recent purchases
router.get('/recent-purchases', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '20');

    const purchases = await analyticsService.getRecentPurchases(req.user!.userId, limit);

    res.json(purchases);
  } catch (error) {
    console.error('Recent purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch recent purchases' });
  }
});

// Export to CSV
router.get('/export', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const range = (req.query.range as string) || '30d';
    const dateRange = parseDateRange(range);

    const csv = await analyticsService.exportToCSV(req.user!.userId, dateRange);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=coursesignal-${range}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Drill down by source
router.get('/drilldown/:source', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { source } = req.params;
    const range = (req.query.range as string) || '30d';
    const dateRange = parseDateRange(range);

    const data = await analyticsService.getDrillDownData(req.user!.userId, source, dateRange);

    res.json(data);
  } catch (error) {
    console.error('Drilldown error:', error);
    res.status(500).json({ error: 'Failed to fetch drilldown data' });
  }
});

export default router;
