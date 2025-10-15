import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layouts';
import { Button, MetricCardSkeleton } from '../components/design-system';
import { LaunchCard, LaunchStatus } from '../components/launches';
import { Plus, Rocket } from 'lucide-react';
import api from '../lib/api';

interface Launch {
  id: string;
  title: string;
  description?: string;
  status: LaunchStatus;
  start_date: string;
  end_date: string;
  current_revenue: number;
  purchase_count: number;
  revenue_goal?: number;
  sales_goal?: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Launches() {
  const navigate = useNavigate();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LaunchStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLaunches();
  }, [statusFilter, currentPage]);

  const fetchLaunches = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 12,
        sortBy: 'start_date',
        sortOrder: 'desc',
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get('/launches', { params });
      setLaunches(response.data.launches);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch launches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLaunch = () => {
    navigate('/launches/new');
  };

  const filterButtons: Array<{ value: LaunchStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  if (loading && launches.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Launches</h1>
            <Button onClick={handleCreateLaunch}>
              <Plus className="w-4 h-4 mr-2" />
              New Launch
            </Button>
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

  if (!loading && launches.length === 0 && statusFilter === 'all') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center">
          <Rocket className="w-16 h-16 text-primary-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Track Your Next Launch with Precision
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            See which channels drive sales during your time-limited promotions.
            <br />
            Set goals, compare performance, and share results publicly.
          </p>

          <Button onClick={handleCreateLaunch} size="lg">
            Create Your First Launch
          </Button>

          <div className="mt-12 text-left bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
              Popular Launch Types
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-gray-900">Early Bird Promotion</p>
                  <p className="text-sm text-gray-600">Limited-time discount for course pre-orders</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-gray-900">Flash Sale</p>
                  <p className="text-sm text-gray-600">24-48 hour discount to boost sales</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2" />
                <div>
                  <p className="font-medium text-gray-900">Course Launch Week</p>
                  <p className="text-sm text-gray-600">Multi-day promotion with cart open/close dates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Launches</h1>
            <p className="text-base text-gray-600 mt-1">
              Monitor your time-limited promotions with real-time attribution
            </p>
          </div>
          <Button onClick={handleCreateLaunch}>
            <Plus className="w-4 h-4 mr-2" />
            New Launch
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active Launches - Pinned Section */}
        {statusFilter === 'all' && launches.some(l => l.status === 'active') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-600 rounded-full animate-pulse" />
              <h2 className="text-xl font-semibold text-gray-900">Active Now</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {launches
                .filter(l => l.status === 'active')
                .map((launch) => (
                  <div key={launch.id} className="ring-2 ring-success-200 rounded-lg">
                    <LaunchCard
                      id={launch.id}
                      title={launch.title}
                      description={launch.description}
                      status={launch.status}
                      startDate={launch.start_date}
                      endDate={launch.end_date}
                      currentRevenue={parseFloat(launch.current_revenue as any)}
                      purchaseCount={launch.purchase_count}
                      revenueGoal={launch.revenue_goal ? parseFloat(launch.revenue_goal as any) : undefined}
                      salesGoal={launch.sales_goal}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* All Launches Grid */}
        {statusFilter === 'all' && launches.some(l => l.status !== 'active') && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">All Launches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {launches
                .filter(l => l.status !== 'active')
                .map((launch) => (
                  <LaunchCard
                    key={launch.id}
                    id={launch.id}
                    title={launch.title}
                    description={launch.description}
                    status={launch.status}
                    startDate={launch.start_date}
                    endDate={launch.end_date}
                    currentRevenue={parseFloat(launch.current_revenue as any)}
                    purchaseCount={launch.purchase_count}
                    revenueGoal={launch.revenue_goal ? parseFloat(launch.revenue_goal as any) : undefined}
                    salesGoal={launch.sales_goal}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Filtered Launches Grid (when not "all") */}
        {statusFilter !== 'all' && (
          <>
            {launches.length === 0 ? (
              <div className="text-center py-12">
                <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No {statusFilter} launches found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {launches.map((launch) => (
                  <LaunchCard
                    key={launch.id}
                    id={launch.id}
                    title={launch.title}
                    description={launch.description}
                    status={launch.status}
                    startDate={launch.start_date}
                    endDate={launch.end_date}
                    currentRevenue={parseFloat(launch.current_revenue as any)}
                    purchaseCount={launch.purchase_count}
                    revenueGoal={launch.revenue_goal ? parseFloat(launch.revenue_goal as any) : undefined}
                    salesGoal={launch.sales_goal}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="secondary"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {pagination.pages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
