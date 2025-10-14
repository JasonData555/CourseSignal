import { query } from '../../db/connection';

export interface LaunchMetrics {
  revenue: number;
  students: number;
  purchases: number;
  conversionRate: number;
  avgOrderValue: number;
  revenuePerDay: number;
  goalProgress: {
    revenuePercentage: number;
    salesPercentage: number;
  };
  cached: boolean;
}

export interface LaunchAttribution {
  source: string;
  revenue: number;
  students: number;
  purchases: number;
  percentage: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  purchases: number;
}

export interface ComparisonData {
  launchId: string;
  title: string;
  revenue: number;
  students: number;
  conversionRate: number;
  avgOrderValue: number;
  topSource: string;
  revenuePerDay: number;
  duration: number;
}

/**
 * Get comprehensive metrics for a launch with caching for completed launches
 */
export async function getLaunchMetrics(userId: string, launchId: string): Promise<LaunchMetrics> {
  // Get launch details
  const launchResult = await query(
    'SELECT * FROM launches WHERE id = $1 AND user_id = $2',
    [launchId, userId]
  );

  if (launchResult.rows.length === 0) {
    throw new Error('Launch not found');
  }

  const launch = launchResult.rows[0];

  // If completed AND cache is fresh (< 1 hour old), return cached
  if (launch.status === 'completed' && launch.metrics_updated_at) {
    const cacheAge = Date.now() - new Date(launch.metrics_updated_at).getTime();
    if (cacheAge < 60 * 60 * 1000) {
      // 1 hour cache
      return {
        revenue: parseFloat(launch.cached_revenue || 0),
        students: parseInt(launch.cached_students || 0),
        purchases: 0, // Will calculate if needed
        conversionRate: parseFloat(launch.cached_conversion_rate || 0),
        avgOrderValue: 0, // Will calculate if needed
        revenuePerDay: 0, // Will calculate if needed
        goalProgress: {
          revenuePercentage: launch.revenue_goal
            ? (parseFloat(launch.cached_revenue || 0) / launch.revenue_goal) * 100
            : 0,
          salesPercentage: launch.sales_goal
            ? (parseInt(launch.cached_students || 0) / launch.sales_goal) * 100
            : 0,
        },
        cached: true,
      };
    }
  }

  // Otherwise, compute fresh metrics
  const metrics = await computeLaunchMetrics(userId, launchId);

  // Cache if completed
  if (launch.status === 'completed') {
    await query(
      `UPDATE launches
       SET cached_revenue = $1,
           cached_students = $2,
           cached_conversion_rate = $3,
           metrics_updated_at = NOW()
       WHERE id = $4`,
      [metrics.revenue, metrics.students, metrics.conversionRate, launchId]
    );
  }

  return { ...metrics, cached: false };
}

/**
 * Compute fresh launch metrics from database
 */
async function computeLaunchMetrics(userId: string, launchId: string): Promise<LaunchMetrics> {
  const launchResult = await query(
    'SELECT * FROM launches WHERE id = $1 AND user_id = $2',
    [launchId, userId]
  );

  if (launchResult.rows.length === 0) {
    throw new Error('Launch not found');
  }

  const launch = launchResult.rows[0];

  // Get purchase metrics
  const metricsResult = await query(
    `SELECT
       COALESCE(SUM(amount), 0) as total_revenue,
       COUNT(DISTINCT email) as total_students,
       COUNT(*) as total_purchases,
       COALESCE(AVG(amount), 0) as avg_order_value
     FROM purchases
     WHERE launch_id = $1`,
    [launchId]
  );

  const purchaseData = metricsResult.rows[0];

  // Get visitor count for conversion rate
  const visitorResult = await query(
    `SELECT COUNT(DISTINCT visitor_id) as total_visitors
     FROM visitors
     WHERE user_id = $1
       AND created_at BETWEEN $2 AND $3`,
    [userId, launch.start_date, launch.end_date]
  );

  const totalVisitors = parseInt(visitorResult.rows[0].total_visitors || 0);
  const totalStudents = parseInt(purchaseData.total_students || 0);

  // Calculate duration in days
  const startDate = new Date(launch.start_date);
  const endDate = new Date(launch.end_date);
  const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const revenue = parseFloat(purchaseData.total_revenue || 0);
  const conversionRate = totalVisitors > 0 ? (totalStudents / totalVisitors) * 100 : 0;

  return {
    revenue,
    students: totalStudents,
    purchases: parseInt(purchaseData.total_purchases || 0),
    conversionRate,
    avgOrderValue: parseFloat(purchaseData.avg_order_value || 0),
    revenuePerDay: revenue / durationDays,
    goalProgress: {
      revenuePercentage: launch.revenue_goal ? (revenue / launch.revenue_goal) * 100 : 0,
      salesPercentage: launch.sales_goal ? (totalStudents / launch.sales_goal) * 100 : 0,
    },
    cached: false,
  };
}

/**
 * Get revenue attribution by source for a launch
 */
export async function getLaunchAttribution(userId: string, launchId: string): Promise<LaunchAttribution[]> {
  const result = await query(
    `SELECT
       COALESCE(first_touch_source, 'unmatched') as source,
       COALESCE(SUM(amount), 0) as revenue,
       COUNT(DISTINCT email) as students,
       COUNT(*) as purchases
     FROM purchases
     WHERE launch_id = $1
     GROUP BY first_touch_source
     ORDER BY revenue DESC`,
    [launchId]
  );

  // Calculate total revenue for percentages
  const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);

  return result.rows.map((row) => ({
    source: row.source || 'unmatched',
    revenue: parseFloat(row.revenue || 0),
    students: parseInt(row.students || 0),
    purchases: parseInt(row.purchases || 0),
    percentage: totalRevenue > 0 ? (parseFloat(row.revenue || 0) / totalRevenue) * 100 : 0,
  }));
}

/**
 * Get daily revenue breakdown for a launch
 */
export async function getDailyRevenueChart(userId: string, launchId: string): Promise<DailyRevenue[]> {
  const result = await query(
    `SELECT
       DATE(purchased_at) as date,
       COALESCE(SUM(amount), 0) as revenue,
       COUNT(*) as purchases
     FROM purchases
     WHERE launch_id = $1
     GROUP BY DATE(purchased_at)
     ORDER BY date ASC`,
    [launchId]
  );

  return result.rows.map((row) => ({
    date: row.date,
    revenue: parseFloat(row.revenue || 0),
    purchases: parseInt(row.purchases || 0),
  }));
}

/**
 * Compare multiple launches side-by-side
 */
export async function compareLaunches(userId: string, launchIds: string[]): Promise<ComparisonData[]> {
  if (launchIds.length === 0 || launchIds.length > 3) {
    throw new Error('Must compare between 1 and 3 launches');
  }

  const comparisons: ComparisonData[] = [];

  for (const launchId of launchIds) {
    const launch = await query(
      'SELECT * FROM launches WHERE id = $1 AND user_id = $2',
      [launchId, userId]
    );

    if (launch.rows.length === 0) {
      continue;
    }

    const launchData = launch.rows[0];

    // Get metrics
    const metrics = await query(
      `SELECT
         COALESCE(SUM(amount), 0) as total_revenue,
         COUNT(DISTINCT email) as total_students,
         COALESCE(AVG(amount), 0) as avg_order_value
       FROM purchases
       WHERE launch_id = $1`,
      [launchId]
    );

    const purchaseData = metrics.rows[0];

    // Get visitor count
    const visitorResult = await query(
      `SELECT COUNT(DISTINCT visitor_id) as total_visitors
       FROM visitors
       WHERE user_id = $1
         AND created_at BETWEEN $2 AND $3`,
      [userId, launchData.start_date, launchData.end_date]
    );

    const totalVisitors = parseInt(visitorResult.rows[0].total_visitors || 0);
    const totalStudents = parseInt(purchaseData.total_students || 0);
    const conversionRate = totalVisitors > 0 ? (totalStudents / totalVisitors) * 100 : 0;

    // Get top source
    const topSourceResult = await query(
      `SELECT first_touch_source
       FROM purchases
       WHERE launch_id = $1
       GROUP BY first_touch_source
       ORDER BY SUM(amount) DESC
       LIMIT 1`,
      [launchId]
    );

    const topSource = topSourceResult.rows[0]?.first_touch_source || 'none';

    // Calculate duration in days
    const startDate = new Date(launchData.start_date);
    const endDate = new Date(launchData.end_date);
    const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const revenue = parseFloat(purchaseData.total_revenue || 0);

    comparisons.push({
      launchId: launchData.id,
      title: launchData.title,
      revenue,
      students: totalStudents,
      conversionRate,
      avgOrderValue: parseFloat(purchaseData.avg_order_value || 0),
      topSource,
      revenuePerDay: revenue / durationDays,
      duration: durationDays,
    });
  }

  return comparisons;
}

/**
 * Get real-time stats for active launches (no caching)
 */
export async function getLiveStats(userId: string, launchId: string) {
  return computeLaunchMetrics(userId, launchId);
}

/**
 * Get launch metrics for public recap page
 */
export async function getPublicLaunchMetrics(shareToken: string) {
  // Get launch by share token
  const launchResult = await query(
    'SELECT * FROM launches WHERE share_token = $1 AND share_enabled = TRUE',
    [shareToken]
  );

  if (launchResult.rows.length === 0) {
    throw new Error('Launch not found or sharing disabled');
  }

  const launch = launchResult.rows[0];

  // Get purchase metrics
  const metricsResult = await query(
    `SELECT
       COALESCE(SUM(amount), 0) as total_revenue,
       COUNT(DISTINCT email) as total_students,
       COUNT(*) as total_purchases,
       COALESCE(AVG(amount), 0) as avg_order_value
     FROM purchases
     WHERE launch_id = $1`,
    [launch.id]
  );

  const purchaseData = metricsResult.rows[0];

  // Get top 3 sources
  const sourcesResult = await query(
    `SELECT
       COALESCE(first_touch_source, 'unmatched') as source,
       COALESCE(SUM(amount), 0) as revenue,
       COUNT(DISTINCT email) as students
     FROM purchases
     WHERE launch_id = $1
     GROUP BY first_touch_source
     ORDER BY revenue DESC
     LIMIT 3`,
    [launch.id]
  );

  // Get daily revenue
  const dailyResult = await query(
    `SELECT
       DATE(purchased_at) as date,
       COALESCE(SUM(amount), 0) as revenue
     FROM purchases
     WHERE launch_id = $1
     GROUP BY DATE(purchased_at)
     ORDER BY date ASC`,
    [launch.id]
  );

  // Get visitor count for conversion rate
  const visitorResult = await query(
    `SELECT COUNT(DISTINCT visitor_id) as total_visitors
     FROM visitors
     WHERE user_id = $1
       AND created_at BETWEEN $2 AND $3`,
    [launch.user_id, launch.start_date, launch.end_date]
  );

  const totalVisitors = parseInt(visitorResult.rows[0].total_visitors || 0);
  const totalStudents = parseInt(purchaseData.total_students || 0);
  const conversionRate = totalVisitors > 0 ? (totalStudents / totalVisitors) * 100 : 0;

  return {
    launch: {
      title: launch.title,
      description: launch.description,
      startDate: launch.start_date,
      endDate: launch.end_date,
    },
    metrics: {
      revenue: parseFloat(purchaseData.total_revenue || 0),
      students: totalStudents,
      purchases: parseInt(purchaseData.total_purchases || 0),
      conversionRate,
      avgOrderValue: parseFloat(purchaseData.avg_order_value || 0),
    },
    topSources: sourcesResult.rows.map((row) => ({
      source: row.source,
      revenue: parseFloat(row.revenue || 0),
      students: parseInt(row.students || 0),
    })),
    dailyRevenue: dailyResult.rows.map((row) => ({
      date: row.date,
      revenue: parseFloat(row.revenue || 0),
    })),
  };
}
