import { query } from '../db/connection';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export async function getDashboardSummary(userId: string, dateRange: DateRange, source?: string) {
  const { startDate, endDate } = dateRange;

  // Build query parameters
  const params: any[] = [userId, startDate, endDate];
  let sourceFilter = '';

  if (source && source !== 'all') {
    sourceFilter = 'AND first_touch_source = $4';
    params.push(source);
  }

  // Get current period stats
  const currentResult = await query(
    `SELECT
      COALESCE(SUM(amount), 0) as total_revenue,
      COUNT(DISTINCT email) as total_students,
      COALESCE(AVG(amount), 0) as avg_order_value,
      COUNT(*) as total_purchases
    FROM purchases
    WHERE user_id = $1
      AND purchased_at >= $2
      AND purchased_at <= $3
      ${sourceFilter}`,
    params
  );

  const current = currentResult.rows[0];

  // Calculate previous period
  const periodDiff = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDiff);
  const prevEndDate = new Date(startDate.getTime() - 1);

  const prevParams: any[] = [userId, prevStartDate, prevEndDate];
  if (source && source !== 'all') {
    prevParams.push(source);
  }

  const previousResult = await query(
    `SELECT
      COALESCE(SUM(amount), 0) as total_revenue,
      COUNT(DISTINCT email) as total_students,
      COALESCE(AVG(amount), 0) as avg_order_value
    FROM purchases
    WHERE user_id = $1
      AND purchased_at >= $2
      AND purchased_at <= $3
      ${sourceFilter}`,
    prevParams
  );

  const previous = previousResult.rows[0];

  // Calculate trends
  const revenueTrend =
    previous.total_revenue > 0
      ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100
      : 0;

  const studentsTrend =
    previous.total_students > 0
      ? ((current.total_students - previous.total_students) / previous.total_students) * 100
      : 0;

  const aovTrend =
    previous.avg_order_value > 0
      ? ((current.avg_order_value - previous.avg_order_value) / previous.avg_order_value) * 100
      : 0;

  return {
    totalRevenue: parseFloat(current.total_revenue),
    totalStudents: parseInt(current.total_students),
    avgOrderValue: parseFloat(current.avg_order_value),
    totalPurchases: parseInt(current.total_purchases),
    trends: {
      revenue: Math.round(revenueTrend * 10) / 10,
      students: Math.round(studentsTrend * 10) / 10,
      avgOrderValue: Math.round(aovTrend * 10) / 10,
    },
  };
}

export async function getRevenueBySource(userId: string, dateRange: DateRange) {
  const { startDate, endDate } = dateRange;

  const result = await query(
    `SELECT
      COALESCE(p.first_touch_source, 'unmatched') as source,
      COUNT(DISTINCT v.visitor_id) as visitors,
      COALESCE(SUM(p.amount), 0) as revenue,
      COUNT(p.id) as students,
      COALESCE(AVG(p.amount), 0) as avg_order_value
    FROM purchases p
    LEFT JOIN visitors v ON p.visitor_id = v.id
    WHERE p.user_id = $1
      AND p.purchased_at >= $2
      AND p.purchased_at <= $3
    GROUP BY p.first_touch_source
    ORDER BY revenue DESC`,
    [userId, startDate, endDate]
  );

  // Get visitor counts per source
  const visitorResult = await query(
    `SELECT
      COALESCE(first_touch_data->>'source', 'direct') as source,
      COUNT(DISTINCT visitor_id) as total_visitors
    FROM visitors
    WHERE user_id = $1
      AND created_at >= $2
      AND created_at <= $3
    GROUP BY first_touch_data->>'source'`,
    [userId, startDate, endDate]
  );

  const visitorMap = new Map();
  visitorResult.rows.forEach((row) => {
    visitorMap.set(row.source, parseInt(row.total_visitors));
  });

  return result.rows.map((row) => {
    const totalVisitors = visitorMap.get(row.source) || 0;
    const students = parseInt(row.students);
    const revenue = parseFloat(row.revenue);

    return {
      source: row.source,
      visitors: totalVisitors,
      revenue,
      students,
      conversionRate: totalVisitors > 0 ? ((students / totalVisitors) * 100).toFixed(2) : '0.00',
      avgOrderValue: parseFloat(row.avg_order_value).toFixed(2),
      revenuePerVisitor: totalVisitors > 0 ? (revenue / totalVisitors).toFixed(2) : '0.00',
    };
  });
}

export async function getRecentPurchases(userId: string, limit: number = 20) {
  const result = await query(
    `SELECT
      p.id,
      p.amount,
      p.course_name,
      p.first_touch_source as source,
      p.purchased_at,
      p.email
    FROM purchases p
    WHERE p.user_id = $1
    ORDER BY p.purchased_at DESC
    LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    amount: parseFloat(row.amount),
    courseName: row.course_name,
    source: row.source || 'unmatched',
    purchasedAt: row.purchased_at,
    email: row.email,
  }));
}

export async function exportToCSV(userId: string, dateRange: DateRange): Promise<string> {
  const data = await getRevenueBySource(userId, dateRange);

  const headers = [
    'Source',
    'Visitors',
    'Revenue',
    'Students',
    'Conversion Rate %',
    'Avg Order Value',
    'Revenue Per Visitor',
  ];

  const rows = data.map((row) => [
    row.source,
    row.visitors,
    row.revenue,
    row.students,
    row.conversionRate,
    row.avgOrderValue,
    row.revenuePerVisitor,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

export async function getDrillDownData(
  userId: string,
  source: string,
  dateRange: DateRange
) {
  const { startDate, endDate } = dateRange;

  const result = await query(
    `SELECT
      COALESCE(p.first_touch_campaign, 'no_campaign') as campaign,
      COALESCE(p.first_touch_medium, 'none') as medium,
      COALESCE(SUM(p.amount), 0) as revenue,
      COUNT(p.id) as students,
      COALESCE(AVG(p.amount), 0) as avg_order_value
    FROM purchases p
    WHERE p.user_id = $1
      AND p.first_touch_source = $2
      AND p.purchased_at >= $3
      AND p.purchased_at <= $4
    GROUP BY p.first_touch_campaign, p.first_touch_medium
    ORDER BY revenue DESC`,
    [userId, source, startDate, endDate]
  );

  return result.rows.map((row) => ({
    campaign: row.campaign,
    medium: row.medium,
    revenue: parseFloat(row.revenue),
    students: parseInt(row.students),
    avgOrderValue: parseFloat(row.avg_order_value).toFixed(2),
  }));
}
