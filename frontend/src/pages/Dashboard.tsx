import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layouts';
import {
  DateRangeSelector,
  DateRange,
  Button,
  MetricCardSkeleton,
  TableSkeleton,
  Table,
  Column,
  Toast,
  ToastContainer,
} from '../components/design-system';
import {
  CompactMetricsBar,
  InsightsPanel,
  HorizontalBarChart,
  QuickStatsCard,
  SourceData,
  Recommendation,
} from '../components/dashboard';
import { Download, Database, Filter, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../lib/api';
import { useToast } from '../hooks/useToast';

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
  const { toasts, removeToast, error: showError } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationSource, setRecommendationSource] = useState<'ai' | 'rule-based'>('rule-based');
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

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

      // Fetch AI-powered recommendations
      await fetchRecommendations(summaryResponse.data, sourcesResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (summary: SummaryData, sources: SourceData[]) => {
    setLoadingRecommendations(true);
    try {
      const response = await api.post('/recommendations/generate', {
        summary,
        sources,
      });

      setRecommendations(response.data.recommendations);
      setRecommendationSource(response.data.source);
    } catch (error) {
      console.error('Failed to fetch recommendations, using fallback:', error);
      // Fallback to client-side rule-based recommendations
      const fallbackRecs = generateRecommendations(summary, sources);
      setRecommendations(fallbackRecs);
      setRecommendationSource('rule-based');
    } finally {
      setLoadingRecommendations(false);
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

  const handleSourceClick = (source: string) => {
    setSelectedSource(source);
  };

  const maxRevenue = Math.max(...sourceData.map((d) => d.revenue), 1);

  const columns: Column<SourceData>[] = [
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (row) => (
        <div className="font-medium text-gray-900 capitalize">{row.source}</div>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-gray-900 mb-1">
            ${row.revenue.toLocaleString()}
          </div>
          {/* Horizontal bar for visual comparison */}
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${(row.revenue / maxRevenue) * 100}%`,
                backgroundColor: '#009392' // Teal from chart palette
              }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'visitors',
      header: 'Visitors',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">{row.visitors.toLocaleString()}</span>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">{row.students.toLocaleString()}</span>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Conversion',
      sortable: true,
      align: 'right',
      render: (row) => {
        const rate = parseFloat(row.conversionRate);
        return (
          <span
            className={clsx(
              'font-medium',
              rate >= 5
                ? 'text-success-600'
                : rate >= 2
                ? 'text-gray-700'
                : 'text-warning-600'
            )}
          >
            {row.conversionRate}%
          </span>
        );
      },
    },
    {
      key: 'avgOrderValue',
      header: 'AOV',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">${row.avgOrderValue}</span>
      ),
    },
    {
      key: 'revenuePerVisitor',
      header: 'Rev/Visitor',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">${row.revenuePerVisitor}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>

          <TableSkeleton />
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              See exactly where your revenue comes from
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Source Filter */}
            {sourceData.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="text-sm border-none focus:ring-0 focus:outline-none min-w-[140px]"
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

        {/* Compact Metrics Bar */}
        <CompactMetricsBar
          totalRevenue={summaryData.totalRevenue}
          totalStudents={summaryData.totalStudents}
          avgOrderValue={summaryData.avgOrderValue}
          totalPurchases={summaryData.totalPurchases}
          trends={summaryData.trends}
        />

        {/* Revenue Attribution Section */}
        <div className="bg-white rounded-lg shadow-card border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue by Source</h2>
              <p className="text-sm text-gray-600 mt-1">
                See which traffic sources generate the most revenue
              </p>
            </div>
            {/* AI Insights Toggle Button */}
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors border border-gray-300 hover:bg-gray-50"
            >
              <Sparkles className="w-4 h-4" />
              {showInsights ? 'Hide' : 'Show'} Insights
            </button>
          </div>

          {/* Revenue Attribution Chart - Full Width */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <HorizontalBarChart
              data={sourceData}
              onBarClick={handleSourceClick}
              height={250}
            />
          </div>

          {/* Conditionally render Insights & Quick Stats */}
          {/* Responsive: 50/50 on lg (1024px+), stacked on smaller screens */}
          {showInsights && (
            <div className="flex flex-col xl:flex-row gap-4">
              {/* Left: AI Insights Panel (50% on xl+) */}
              <div className="w-full xl:w-1/2">
                <InsightsPanel
                  recommendations={recommendations.slice(0, 3)}
                  recommendationSource={recommendationSource}
                  loadingRecommendations={loadingRecommendations}
                />
              </div>

              {/* Right: Quick Stats Card (50% on xl+) */}
              <div className="w-full xl:w-1/2">
                <QuickStatsCard
                  conversionRate={
                    sourceData.length > 0
                      ? sourceData.reduce((sum, s) => sum + parseFloat(s.conversionRate), 0) / sourceData.length
                      : 0
                  }
                  revenuePerVisitor={
                    sourceData.length > 0
                      ? sourceData.reduce((sum, s) => sum + parseFloat(s.revenuePerVisitor), 0) / sourceData.length
                      : 0
                  }
                  topSource={
                    sourceData.length > 0
                      ? {
                          name: sourceData[0].source.charAt(0).toUpperCase() + sourceData[0].source.slice(1),
                          revenue: sourceData[0].revenue,
                        }
                      : null
                  }
                  matchRate={
                    summaryData && summaryData.totalPurchases > 0
                      ? (sourceData.reduce((sum, s) => sum + s.students, 0) / summaryData.totalPurchases) * 100
                      : 0
                  }
                />
              </div>
            </div>
          )}

          {/* Collapsible Detailed Table */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDetailedTable(!showDetailedTable)}
              className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              {showDetailedTable ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Detailed Table ({sourceData.length} sources)
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View Detailed Table ({sourceData.length} sources)
                </>
              )}
            </button>

            {showDetailedTable && (
              <div className="mt-4">
                <Table
                  columns={columns}
                  data={sourceData}
                  sortKey="revenue"
                  sortDirection="desc"
                  onRowClick={(row) => handleSourceClick(row.source)}
                  emptyMessage="No revenue data yet. Once purchases start coming in, you'll see them here."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
            autoClose={toast.autoClose}
            duration={toast.duration}
          />
        ))}
      </ToastContainer>
    </DashboardLayout>
  );
}
