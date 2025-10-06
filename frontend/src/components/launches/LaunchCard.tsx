import { Card } from '../design-system';
import { LaunchStatusBadge, LaunchStatus } from './LaunchStatusBadge';
import { Calendar, DollarSign, Users, Clock, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LaunchCardProps {
  id: string;
  title: string;
  description?: string;
  status: LaunchStatus;
  startDate: string;
  endDate: string;
  currentRevenue: number;
  purchaseCount: number;
  revenueGoal?: number;
  salesGoal?: number;
}

export function LaunchCard({
  id,
  title,
  description,
  status,
  startDate,
  endDate,
  currentRevenue,
  purchaseCount,
  revenueGoal,
  salesGoal,
}: LaunchCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDaysRemaining = () => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilStart = () => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysSinceEnd = () => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = now.getTime() - end.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAvgDailyRevenue = () => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    return currentRevenue / diffDays;
  };

  const revenueProgress = revenueGoal ? (currentRevenue / revenueGoal) * 100 : null;
  const salesProgress = salesGoal ? (purchaseCount / salesGoal) * 100 : null;

  // Check if launch exceeded goals by 20%+
  const isWinner = status === 'completed' && (
    (revenueProgress !== null && revenueProgress >= 120) ||
    (salesProgress !== null && salesProgress >= 120)
  );

  return (
    <Link to={`/launches/${id}`}>
      <Card hover className="cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isWinner && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-warning-50 text-warning-700 rounded-full text-xs font-medium">
                <Award className="w-3 h-3" />
                Winner
              </div>
            )}
            <LaunchStatusBadge status={status} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDate(startDate)} - {formatDate(endDate)}
          </span>
        </div>

        {/* Status-specific info */}
        {status === 'active' && (
          <div className="mb-4 p-3 bg-success-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-success-900">
                <Clock className="w-4 h-4" />
                <span>
                  {getDaysRemaining() === 1
                    ? '1 day remaining'
                    : getDaysRemaining() > 0
                    ? `${getDaysRemaining()} days remaining`
                    : 'Ends today'}
                </span>
              </div>
              <div className="text-sm text-success-700">
                <span className="font-semibold">{formatCurrency(getAvgDailyRevenue())}</span>
                <span className="text-xs ml-1">/ day</span>
              </div>
            </div>
          </div>
        )}

        {status === 'upcoming' && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <Clock className="w-4 h-4" />
              <span>
                {getDaysUntilStart() === 1
                  ? 'Starts tomorrow'
                  : getDaysUntilStart() === 0
                  ? 'Starts today'
                  : `Starts in ${getDaysUntilStart()} days`}
              </span>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4" />
              <span>
                Ended {getDaysSinceEnd() === 0 ? 'today' : getDaysSinceEnd() === 1 ? 'yesterday' : `${getDaysSinceEnd()} days ago`}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Revenue</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentRevenue)}
            </div>
            {revenueProgress !== null && (
              <div className="text-xs text-gray-500 mt-1">
                {revenueProgress.toFixed(0)}% of goal
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Users className="w-4 h-4" />
              <span>Students</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{purchaseCount}</div>
            {salesProgress !== null && (
              <div className="text-xs text-gray-500 mt-1">
                {salesProgress.toFixed(0)}% of goal
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
