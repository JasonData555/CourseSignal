import { ProgressBar } from '../design-system';
import { DollarSign, Users } from 'lucide-react';

interface LaunchGoalProgressProps {
  revenueGoal?: number;
  salesGoal?: number;
  currentRevenue: number;
  currentStudents: number;
}

export function LaunchGoalProgress({
  revenueGoal,
  salesGoal,
  currentRevenue,
  currentStudents,
}: LaunchGoalProgressProps) {
  const revenuePercentage = revenueGoal ? (currentRevenue / revenueGoal) * 100 : 0;
  const salesPercentage = salesGoal ? (currentStudents / salesGoal) * 100 : 0;

  const hasGoals = revenueGoal || salesGoal;

  if (!hasGoals) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {revenueGoal && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Revenue Goal</span>
            <span className="text-sm text-gray-600 ml-auto">
              {formatCurrency(currentRevenue)} / {formatCurrency(revenueGoal)}
            </span>
          </div>
          <ProgressBar
            percentage={revenuePercentage}
            variant={revenuePercentage >= 100 ? 'success' : 'primary'}
            showPercentage={false}
          />
        </div>
      )}

      {salesGoal && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Sales Goal</span>
            <span className="text-sm text-gray-600 ml-auto">
              {currentStudents} / {salesGoal} students
            </span>
          </div>
          <ProgressBar
            percentage={salesPercentage}
            variant={salesPercentage >= 100 ? 'success' : 'primary'}
            showPercentage={false}
          />
        </div>
      )}
    </div>
  );
}
