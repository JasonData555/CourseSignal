import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layouts';
import {
  DateRangeSelector,
  DateRange,
  Button,
  MetricCardSkeleton,
  TableSkeleton,
} from '../components/design-system';
import {
  RevenueSummary,
  RevenueBySource,
  RecentPurchases,
  SmartRecommendations,
  QuickInsights,
  SourceData,
  Purchase,
  Recommendation,
} from '../components/dashboard';
import { Download, Database, Filter } from 'lucide-react';
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
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, selectedSource]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Build query params
      const sourceParam = selectedSource !== 'all' ? `&source=${selectedSource}` : '';

      // Fetch summary
      const summaryResponse = await api.get(`/analytics/summary?range=${dateRange}${sourceParam}`);
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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Database className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Ready to see where your revenue comes from?
            </h1>
            <p className="text-lg text-gray-600">
              CourseSignal tracks every purchase back to its source.
              <br />
              Here's how to get started:
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Step 1 */}
            <div className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Connect Your Platform
                </h3>
                <p className="text-sm text-gray-600">
                  Link your Kajabi or Teachable account to automatically import purchases.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Install Tracking Script
                </h3>
                <p className="text-sm text-gray-600">
                  Add a simple code snippet to your course site to track visitor sources.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  See Results
                </h3>
                <p className="text-sm text-gray-600">
                  Watch your dashboard populate with attribution data as purchases come in.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => (window.location.href = '/settings')}
              size="lg"
            >
              Start Setup
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Setup takes about 5 minutes. You'll see data within 10 minutes of your first purchase.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-base text-gray-600 mt-1">
              See exactly where your revenue comes from
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
              <DateRangeSelector value={dateRange} onChange={setDateRange} />
            </div>
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

        {/* Quick Insights - Hero section with actionable summary */}
        {sourceData.length > 0 && (
          <QuickInsights
            sources={sourceData}
            totalRevenue={summaryData.totalRevenue}
            revenueTrend={summaryData.trends.revenue}
          />
        )}

        {/* Source Filter */}
        {sourceData.length > 0 && (
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <label htmlFor="source-filter" className="text-sm font-medium text-gray-700">
              Filter by Source:
            </label>
            <select
              id="source-filter"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-w-[180px]"
            >
              <option value="all">All Sources</option>
              {sourceData.map((source) => (
                <option key={source.source} value={source.source}>
                  {source.source.charAt(0).toUpperCase() + source.source.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Hero Metrics Section */}
        <RevenueSummary data={summaryData} />

        {/* Revenue by Source Table - Most important for attribution */}
        <RevenueBySource data={sourceData} />

        {/* Smart Recommendations - Contextual, supporting insights */}
        {recommendations.length > 0 && (
          <SmartRecommendations recommendations={recommendations} />
        )}

        {/* Recent Purchases Feed - Supporting detail */}
        <RecentPurchases purchases={recentPurchases} />
      </div>
    </DashboardLayout>
  );
}
