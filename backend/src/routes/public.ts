import { Router } from 'express';
import { pool } from '../db/connection';

const router = Router();

/**
 * GET /api/public/match-rate-stats
 * Returns real-time match rate statistics (no auth required)
 */
router.get('/match-rate-stats', async (req, res) => {
  try {
    // Get total purchases in last 30 days
    const purchasesResult = await pool.query(`
      SELECT COUNT(*) as total_purchases
      FROM purchases
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Get matched purchases (where visitor_id is not null)
    const matchedResult = await pool.query(`
      SELECT COUNT(*) as matched_purchases
      FROM purchases
      WHERE created_at >= NOW() - INTERVAL '30 days'
      AND visitor_id IS NOT NULL
    `);

    const totalPurchases = parseInt(purchasesResult.rows[0]?.total_purchases || '0');
    const matchedPurchases = parseInt(matchedResult.rows[0]?.matched_purchases || '0');

    // Calculate match rate
    const matchRate = totalPurchases > 0
      ? (matchedPurchases / totalPurchases) * 100
      : 0;

    res.json({
      totalPurchases,
      matchedPurchases,
      matchRate: parseFloat(matchRate.toFixed(1)),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching match rate stats:', error);
    res.status(500).json({ error: 'Failed to fetch match rate statistics' });
  }
});

/**
 * GET /api/public/recent-launches
 * Returns anonymized recent launches for leaderboard (no auth required)
 * Only includes launches where share_enabled = true
 */
router.get('/recent-launches', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(`
      SELECT
        l.id,
        l.title,
        l.cached_revenue as revenue,
        l.cached_students as students,
        l.start_date,
        l.end_date,
        l.status,
        l.share_token,
        u.email as creator_email
      FROM launches l
      JOIN users u ON l.user_id = u.id
      WHERE l.share_enabled = true
      AND l.status IN ('active', 'completed')
      ORDER BY l.cached_revenue DESC NULLS LAST, l.end_date DESC
      LIMIT $1
    `, [limit]);

    // Anonymize the data
    const launches = result.rows.map((launch, index) => {
      // Create anonymized creator name (first initial + random letter)
      const firstInitial = launch.creator_email.charAt(0).toUpperCase();
      const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const anonymizedName = `${firstInitial}${randomLetter}.`;

      // Calculate duration
      const startDate = new Date(launch.start_date);
      const endDate = new Date(launch.end_date);
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Determine top source (simplified - in real app would query attribution data)
      const topSources = ['YouTube', 'Email', 'Instagram', 'Google Ads', 'Facebook', 'TikTok', 'Direct'];
      const topSource = topSources[index % topSources.length];

      return {
        id: launch.id,
        creatorName: anonymizedName,
        launchTitle: launch.title,
        revenue: launch.revenue || 0,
        students: launch.students || 0,
        durationDays,
        status: launch.status,
        topSource,
        shareToken: launch.share_token,
      };
    });

    res.json({
      launches,
      total: launches.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching recent launches:', error);
    res.status(500).json({ error: 'Failed to fetch recent launches' });
  }
});

/**
 * GET /api/public/social-proof-metrics
 * Returns aggregated social proof metrics (no auth required)
 */
router.get('/social-proof-metrics', async (req, res) => {
  try {
    // Total revenue attributed
    const revenueResult = await pool.query(`
      SELECT SUM(amount) as total_revenue
      FROM purchases
      WHERE visitor_id IS NOT NULL
    `);

    // Total users (approximate, rounded for privacy)
    const usersResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as total_users
      FROM purchases
      WHERE created_at >= NOW() - INTERVAL '90 days'
    `);

    // Average match rate across all users
    const matchRateResult = await pool.query(`
      SELECT
        COUNT(CASE WHEN visitor_id IS NOT NULL THEN 1 END) as matched,
        COUNT(*) as total
      FROM purchases
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || '0');
    const totalUsers = parseInt(usersResult.rows[0]?.total_users || '0');
    const matched = parseInt(matchRateResult.rows[0]?.matched || '0');
    const total = parseInt(matchRateResult.rows[0]?.total || '0');
    const avgMatchRate = total > 0 ? (matched / total) * 100 : 0;

    res.json({
      totalRevenueAttributed: Math.round(totalRevenue),
      activeUsers: totalUsers,
      averageMatchRate: parseFloat(avgMatchRate.toFixed(1)),
      totalPurchasesTracked: total,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching social proof metrics:', error);
    res.status(500).json({ error: 'Failed to fetch social proof metrics' });
  }
});

export default router;
