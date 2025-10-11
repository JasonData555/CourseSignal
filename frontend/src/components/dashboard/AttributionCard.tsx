import { clsx } from 'clsx';
import { AlertCircle, Trophy, ArrowRight } from 'lucide-react';
import { Badge, ProgressBar } from '../design-system';

export interface AttributionCardProps {
  source: string;
  revenue: number;
  visitors: number;
  students: number;
  conversionRate: string;
  avgOrderValue: string;
  revenuePerVisitor: string;
  maxRevenue: number;
  isTopPerformer?: boolean;
  needsAttention?: boolean;
  hasHighAOV?: boolean;
  onClick?: () => void;
}

export function AttributionCard({
  source,
  revenue,
  visitors,
  students,
  conversionRate,
  avgOrderValue,
  revenuePerVisitor,
  maxRevenue,
  isTopPerformer,
  needsAttention,
  hasHighAOV,
  onClick,
}: AttributionCardProps) {
  const conversionNum = parseFloat(conversionRate);
  const revenuePercentage = (revenue / maxRevenue) * 100;

  // Determine conversion quality
  const getConversionQuality = () => {
    if (conversionNum >= 5) return { label: 'Excellent', variant: 'success' as const };
    if (conversionNum >= 2) return { label: 'Good', variant: 'default' as const };
    return { label: 'Low', variant: 'warning' as const };
  };

  const conversionQuality = getConversionQuality();

  // Determine progress bar variant based on performance
  const getProgressVariant = () => {
    if (isTopPerformer) return 'success';
    if (needsAttention) return 'warning';
    return 'primary';
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg shadow-card p-6 transition-all duration-normal',
        'hover:shadow-card-hover',
        onClick && 'cursor-pointer active:scale-[0.98]'
      )}
    >
      {/* Header: Source name + Performance badges */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xl font-semibold text-gray-900 capitalize flex-1">
            {source}
          </h3>
          {isTopPerformer && (
            <div className="flex-shrink-0">
              <Trophy className="w-5 h-5 text-warning-500" />
            </div>
          )}
        </div>

        {/* Performance badges row */}
        <div className="flex flex-wrap gap-2">
          {isTopPerformer && (
            <Badge variant="success">
              Top Performer
            </Badge>
          )}
          {needsAttention && (
            <Badge variant="warning">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Needs Attention
            </Badge>
          )}
          {hasHighAOV && (
            <Badge variant="info">
              High AOV
            </Badge>
          )}
        </div>
      </div>

      {/* Revenue metric - Hero */}
      <div className="mb-4">
        <div
          className={clsx(
            'font-bold text-gray-900 mb-2',
            isTopPerformer ? 'text-metric-lg' : 'text-metric-md'
          )}
        >
          ${revenue.toLocaleString()}
        </div>
        <ProgressBar
          percentage={revenuePercentage}
          variant={getProgressVariant()}
          size="md"
          showPercentage={false}
          className="mb-1"
        />
        <p className="text-xs text-gray-500">
          {revenuePercentage.toFixed(0)}% of total revenue
        </p>
      </div>

      {/* Conversion rate badge */}
      <div className="mb-4">
        <Badge
          variant={conversionQuality.variant}
          className="font-semibold"
        >
          {conversionRate}% conversion
        </Badge>
        <p className="text-xs text-gray-600 mt-1">{conversionQuality.label} performance</p>
      </div>

      {/* Funnel visualization */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="font-medium">{visitors.toLocaleString()}</span>
          <span className="text-gray-400">visitors</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-primary-600">{students.toLocaleString()}</span>
          <span className="text-gray-400">students</span>
        </div>
      </div>

      {/* Secondary metrics footer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
            AOV
          </p>
          <p className="text-sm font-semibold text-gray-900">
            ${avgOrderValue}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
            Rev/Visitor
          </p>
          <p className="text-sm font-semibold text-gray-900">
            ${revenuePerVisitor}
          </p>
        </div>
      </div>
    </div>
  );
}
