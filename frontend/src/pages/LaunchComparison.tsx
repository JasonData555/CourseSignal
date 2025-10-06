import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layouts';
import { Card, Button, EmptyState, MetricCardSkeleton, Breadcrumbs } from '../components/design-system';
import { ArrowLeft, TrendingUp, DollarSign, Users } from 'lucide-react';
import api from '../lib/api';

interface ComparisonData {
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

export default function LaunchComparison() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const launchIds = ids.split(',').filter(Boolean).slice(0, 3);
      if (launchIds.length > 0) {
        fetchComparison(launchIds);
      } else {
        setError('No launch IDs provided');
        setLoading(false);
      }
    } else {
      setError('No launch IDs provided');
      setLoading(false);
    }
  }, [searchParams]);

  const fetchComparison = async (launchIds: string[]) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/launches/compare', { launchIds });
      setComparisonData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch comparison:', err);
      setError(err.response?.data?.error || 'Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
            <h1 className="text-3xl font-bold text-gray-900">Launch Comparison</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || comparisonData.length === 0) {
    return (
      <DashboardLayout>
        <div className="mb-8">
          <Button variant="secondary" onClick={() => navigate('/launches')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Launches
          </Button>
        </div>
        <EmptyState
          title="Unable to load comparison"
          description={error || 'No launches found for comparison'}
          action={{
            label: 'Back to Launches',
            onClick: () => navigate('/launches'),
          }}
        />
      </DashboardLayout>
    );
  }

  // Find the winner for each metric
  const winners = {
    revenue: comparisonData.reduce((max, launch) =>
      launch.revenue > max.revenue ? launch : max
    ),
    students: comparisonData.reduce((max, launch) =>
      launch.students > max.students ? launch : max
    ),
    conversion: comparisonData.reduce((max, launch) =>
      launch.conversionRate > max.conversionRate ? launch : max
    ),
    aov: comparisonData.reduce((max, launch) =>
      launch.avgOrderValue > max.avgOrderValue ? launch : max
    ),
    revenuePerDay: comparisonData.reduce((max, launch) =>
      launch.revenuePerDay > max.revenuePerDay ? launch : max
    ),
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Launches', href: '/launches' },
            { label: 'Launch Comparison' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Launch Comparison</h1>
          <p className="text-base text-gray-600 mt-1">
            Compare key metrics across {comparisonData.length} launch{comparisonData.length > 1 ? 'es' : ''}
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comparisonData.map((launch) => (
            <Card key={launch.launchId} className="relative">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{launch.title}</h3>
                <p className="text-sm text-gray-600">{launch.duration} days</p>
              </div>

              <div className="space-y-4">
                {/* Revenue */}
                <div className={launch.launchId === winners.revenue.launchId ? 'bg-success-50 -mx-6 -mt-2 px-6 pt-2 pb-4 rounded-t-lg' : ''}>
                  {launch.launchId === winners.revenue.launchId && (
                    <div className="flex items-center gap-1 text-xs font-medium text-success-700 mb-2">
                      <TrendingUp className="w-3 h-3" />
                      <span>Highest Revenue</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Revenue</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(launch.revenue)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formatCurrency(launch.revenuePerDay)}/day
                  </p>
                </div>

                {/* Students */}
                <div className={launch.launchId === winners.students.launchId ? 'bg-success-50 -mx-6 px-6 py-4 rounded-lg' : ''}>
                  {launch.launchId === winners.students.launchId && (
                    <div className="flex items-center gap-1 text-xs font-medium text-success-700 mb-2">
                      <TrendingUp className="w-3 h-3" />
                      <span>Most Students</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Students</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{launch.students}</p>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className={launch.launchId === winners.conversion.launchId ? 'bg-success-50 -mx-6 px-6 py-4 rounded-lg' : ''}>
                  {launch.launchId === winners.conversion.launchId && (
                    <div className="flex items-center gap-1 text-xs font-medium text-success-700 mb-2">
                      <TrendingUp className="w-3 h-3" />
                      <span>Highest Conversion</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-600">Conversion Rate</span>
                    <p className="text-xl font-bold text-gray-900">
                      {launch.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* AOV */}
                <div className={launch.launchId === winners.aov.launchId ? 'bg-success-50 -mx-6 px-6 py-4 rounded-lg' : ''}>
                  {launch.launchId === winners.aov.launchId && (
                    <div className="flex items-center gap-1 text-xs font-medium text-success-700 mb-2">
                      <TrendingUp className="w-3 h-3" />
                      <span>Highest AOV</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-600">Avg Order Value</span>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(launch.avgOrderValue)}
                    </p>
                  </div>
                </div>

                {/* Top Source */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-600">Top Source</span>
                    <p className="text-sm font-medium text-gray-900">{launch.topSource}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/launches/${launch.launchId}`)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Key Insights */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Best Overall Performance</p>
              <p className="text-lg font-bold text-gray-900">{winners.revenue.title}</p>
              <p className="text-sm text-gray-600 mt-1">
                Generated {formatCurrency(winners.revenue.revenue)} in revenue
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Highest Conversion Rate</p>
              <p className="text-lg font-bold text-gray-900">{winners.conversion.title}</p>
              <p className="text-sm text-gray-600 mt-1">
                {winners.conversion.conversionRate.toFixed(1)}% conversion rate
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
