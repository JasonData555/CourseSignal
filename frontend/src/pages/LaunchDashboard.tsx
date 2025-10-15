import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layouts';
import { Card, Button, MetricCard, EmptyState, MetricCardSkeleton, Breadcrumbs } from '../components/design-system';
import {
  LaunchStatusBadge,
  LaunchGoalProgress,
  LaunchTimeline,
  LaunchStatus,
} from '../components/launches';
// import { RevenueBySource } from '../components/dashboard';
import {
  DollarSign,
  Users,
  TrendingUp,
  Share2,
  Eye,
  Copy,
  CheckCircle,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import api from '../lib/api';

interface LaunchData {
  id: string;
  title: string;
  description?: string;
  status: LaunchStatus;
  start_date: string;
  end_date: string;
  revenue_goal?: number;
  sales_goal?: number;
  share_enabled: boolean;
  share_token?: string;
  current_revenue: number;
  purchase_count: number;
}

interface LaunchMetrics {
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
}

interface SourceData {
  source: string;
  revenue: number;
  students: number;
  purchases: number;
  percentage: number;
}

// Daily revenue interface for future chart implementations
// interface DailyRevenue {
//   date: string;
//   revenue: number;
//   purchases: number;
// }

export default function LaunchDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [launch, setLaunch] = useState<LaunchData | null>(null);
  const [metrics, setMetrics] = useState<LaunchMetrics | null>(null);
  const [attribution, setAttribution] = useState<SourceData[]>([]);
  // Daily revenue data available for future charts
  // const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLaunchData();

    // Set up polling for active launches
    const interval = setInterval(() => {
      if (launch?.status === 'active') {
        fetchLiveStats();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [id, launch?.status]);

  const fetchLaunchData = async () => {
    setLoading(true);
    try {
      const [launchRes, analyticsRes, viewsRes] = await Promise.all([
        api.get(`/launches/${id}`),
        api.get(`/launches/${id}/analytics`),
        api.get(`/launches/${id}/views`).catch(() => ({ data: { viewCount: 0 } })),
      ]);

      setLaunch(launchRes.data);
      setMetrics(analyticsRes.data.metrics);
      setAttribution(analyticsRes.data.attribution);
      // setDailyRevenue(analyticsRes.data.dailyRevenue);
      setViewCount(viewsRes.data.viewCount);
    } catch (error) {
      console.error('Failed to fetch launch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStats = async () => {
    try {
      const response = await api.get(`/launches/${id}/live-stats`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch live stats:', error);
    }
  };

  const handleEnableShare = async () => {
    setShareLoading(true);
    try {
      const response = await api.post(`/launches/${id}/enable-share`);
      setLaunch((prev) => prev ? {
        ...prev,
        share_enabled: true,
        share_token: response.data.shareToken,
      } : null);
    } catch (error) {
      console.error('Failed to enable sharing:', error);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    if (launch?.share_token) {
      const url = `${window.location.origin}/public/launch/${launch.share_token}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => navigate('/launches')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!launch || !metrics) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Launch not found"
          description="The launch you're looking for doesn't exist or has been deleted."
          action={{
            label: 'Back to Launches',
            onClick: () => navigate('/launches'),
          }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Launches', href: '/launches' },
            { label: launch.title },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{launch.title}</h1>
              <LaunchStatusBadge status={launch.status} />
            </div>
            {launch.description && (
              <p className="text-base text-gray-600">{launch.description}</p>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate(`/launches/compare?ids=${id}`)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Compare
          </Button>
        </div>

        {/* Timeline */}
        <Card>
          <LaunchTimeline
            status={launch.status}
            startDate={launch.start_date}
            endDate={launch.end_date}
          />
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Revenue"
            value={metrics.revenue}
            format="currency"
            icon={<DollarSign className="w-6 h-6 text-primary-600" />}
          />
          <MetricCard
            label="Students"
            value={metrics.students}
            format="number"
            icon={<Users className="w-6 h-6 text-primary-600" />}
          />
          <MetricCard
            label="Conversion Rate"
            value={metrics.conversionRate}
            format="percentage"
            icon={<TrendingUp className="w-6 h-6 text-primary-600" />}
          />
          <MetricCard
            label="Avg Order Value"
            value={metrics.avgOrderValue}
            format="currency"
            icon={<DollarSign className="w-6 h-6 text-primary-600" />}
          />
        </div>

        {/* Goal Progress */}
        {(launch.revenue_goal || launch.sales_goal) && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Goal Progress</h2>
            <LaunchGoalProgress
              revenueGoal={launch.revenue_goal}
              salesGoal={launch.sales_goal}
              currentRevenue={metrics.revenue}
              currentStudents={metrics.students}
            />
          </Card>
        )}

        {/* Attribution */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Source</h2>
          {attribution.length > 0 ? (
            <div className="space-y-3">
              {attribution.map((source) => (
                <div key={source.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{source.source}</p>
                    <p className="text-sm text-gray-600">
                      {source.students} students • {source.purchases} purchases
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(source.revenue)}
                    </p>
                    <p className="text-sm text-gray-600">{source.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No revenue data yet</p>
          )}
        </Card>

        {/* Share Settings */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Public Launch Recap
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Share your launch results with a public recap page
              </p>
            </div>
            {viewCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>{viewCount} views</span>
              </div>
            )}
          </div>

          {launch.share_enabled && launch.share_token ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/public/launch/${launch.share_token}`}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <Button variant="secondary" onClick={handleCopyShareLink}>
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Anyone with this link can view your launch recap page with key metrics and
                attribution data.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Enable sharing to create a public recap page that showcases your launch results.
                Perfect for sharing on social media, with affiliates, or in your portfolio.
              </p>
              <Button onClick={handleEnableShare} loading={shareLoading}>
                <Share2 className="w-4 h-4 mr-2" />
                Enable Public Sharing
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
