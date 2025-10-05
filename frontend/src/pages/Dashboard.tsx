import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layouts';
import {
  DateRangeSelector,
  DateRange,
  Button,
  EmptyState,
  MetricCardSkeleton,
  TableSkeleton,
} from '../components/design-system';
import {
  RevenueSummary,
  RevenueBySource,
  RecentPurchases,
  SmartRecommendations,
  SourceData,
  Purchase,
  Recommendation,
} from '../components/dashboard';
import { Download, Database } from 'lucide-react';
import api from '../lib/api';

interface SummaryData {
  totalRevenue: number;
  totalStudents: number;
  avgOrderValue: number;
  totalPurchases: number;
  trends: {
    revenue: number;
    students: number;
    avgOrderValue: number;
  };
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch summary
      const summaryResponse = await api.get(`/analytics/summary?range=${dateRange}`);
      setSummaryData(summaryResponse.data);

      // Fetch revenue by source
      const sourcesResponse = await api.get(`/analytics/sources?range=${dateRange}`);
      setSourceData(sourcesResponse.data);

      // Fetch recent purchases
      const purchasesResponse = await api.get('/analytics/recent-purchases?limit=10');
      setRecentPurchases(purchasesResponse.data);

      // Generate recommendations based on data
      const recs = generateRecommendations(summaryResponse.data, sourcesResponse.data);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (
    summary: SummaryData,
    sources: SourceData[]
  ): Recommendation[] => {
    const recs: Recommendation[] = [];

    // Find best and worst performing sources
    if (sources.length >= 2) {
      const sortedByConversion = [...sources].sort(
        (a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate)
      );
      const best = sortedByConversion[0];
      const worst = sortedByConversion[sortedByConversion.length - 1];

      if (parseFloat(best.conversionRate) > parseFloat(worst.conversionRate) * 1.5) {
        recs.push({
          id: 'best-source',
          type: 'opportunity',
          title: `${best.source} is your top performer`,
          description: `This channel converts at ${best.conversionRate}%, significantly better than other sources.`,
          action: `Consider increasing investment in ${best.source}`,
        });
      }

      // Check for underperforming sources
      if (parseFloat(worst.conversionRate) < 1 && worst.visitors > 100) {
        recs.push({
          id: 'worst-source',
          type: 'warning',
          title: `${worst.source} has low conversion`,
          description: `With ${worst.visitors} visitors but only ${worst.conversionRate}% conversion, there's room for improvement.`,
          action: `Review your ${worst.source} strategy or landing pages`,
        });
      }
    }

    // Revenue trend insights
    if (summary.trends.revenue > 20) {
      recs.push({
        id: 'revenue-growth',
        type: 'opportunity',
        title: 'Strong revenue growth',
        description: `Your revenue is up ${summary.trends.revenue.toFixed(1)}% compared to the previous period.`,
        metric: `+$${((summary.totalRevenue * summary.trends.revenue) / 100).toFixed(0)}`,
        action: 'Keep doing what you\'re doing!',
      });
    } else if (summary.trends.revenue < -10) {
      recs.push({
        id: 'revenue-decline',
        type: 'warning',
        title: 'Revenue declining',
        description: `Revenue is down ${Math.abs(summary.trends.revenue).toFixed(1)}% from last period.`,
        action: 'Review recent changes to your launch or marketing',
      });
    }

    // High AOV insight
    if (summary.trends.avgOrderValue > 15) {
      recs.push({
        id: 'aov-increase',
        type: 'insight',
        title: 'Average order value increasing',
        description: `Students are spending ${summary.trends.avgOrderValue.toFixed(1)}% more per purchase.`,
        action: 'Consider promoting higher-tier courses more prominently',
      });
    }

    return recs;
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/analytics/export?range=${dateRange}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `coursesignal-${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>

          <TableSkeleton />
          <TableSkeleton rows={3} />
        </div>
      </DashboardLayout>
    );
  }

  // Show empty state if no data
  if (!summaryData || summaryData.totalPurchases === 0) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<Database className="w-12 h-12 text-gray-400" />}
          title="No data yet"
          description="Connect your Kajabi account or install the tracking script to start seeing your revenue analytics."
          action={{
            label: 'Go to Settings',
            onClick: () => (window.location.href = '/settings'),
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
            <Button
              variant="secondary"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Hero Metrics Section */}
        <RevenueSummary data={summaryData} />

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <SmartRecommendations recommendations={recommendations} />
        )}

        {/* Revenue by Source Table */}
        <RevenueBySource data={sourceData} />

        {/* Recent Purchases Feed */}
        <RecentPurchases purchases={recentPurchases} />
      </div>
    </DashboardLayout>
  );
}
