import { DollarSign, Users, TrendingUp, ShoppingCart, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';

interface CompactMetricsBarProps {
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

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number;
  showDivider?: boolean;
}

function Metric({ icon, label, value, trend, showDivider = true }: MetricProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-4 px-3',
      showDivider && 'lg:border-r border-gray-200',
      'border-b lg:border-b-0 last:border-b-0',
      '[&:nth-child(2)]:border-b lg:[&:nth-child(2)]:border-b-0',
      '[&:nth-child(2)]:lg:border-r'
    )}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide text-gray-600 font-medium">{label}</span>
      </div>
      <div className="text-metric-md font-bold text-gray-900 mb-1">{value}</div>
      {hasTrend && (
        <div
          className={clsx(
            'flex items-center gap-1 text-xs font-semibold',
            isPositive && 'text-success-600',
            isNegative && 'text-danger-600'
          )}
        >
          {isPositive && <ArrowUp className="w-3 h-3" />}
          {isNegative && <ArrowDown className="w-3 h-3" />}
          <span>
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function CompactMetricsBar({
  totalRevenue,
  totalStudents,
  avgOrderValue,
  totalPurchases,
  trends,
}: CompactMetricsBarProps) {
  return (
    <div className="bg-white rounded-lg shadow-card border border-gray-200">
      {/* Desktop: 4 columns, Tablet: 2x2 grid, Mobile: Stacked */}
      <div className="grid grid-cols-2 lg:grid-cols-4">
        <Metric
          icon={<DollarSign className="w-5 h-5 text-primary-600" />}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          trend={trends.revenue}
          showDivider={true}
        />
        <Metric
          icon={<Users className="w-5 h-5 text-primary-600" />}
          label="Students"
          value={totalStudents.toLocaleString()}
          trend={trends.students}
          showDivider={true}
        />
        <Metric
          icon={<TrendingUp className="w-5 h-5 text-primary-600" />}
          label="Avg Order Value"
          value={`$${avgOrderValue.toLocaleString()}`}
          trend={trends.avgOrderValue}
          showDivider={true}
        />
        <Metric
          icon={<ShoppingCart className="w-5 h-5 text-primary-600" />}
          label="Purchases"
          value={totalPurchases.toLocaleString()}
          showDivider={false}
        />
      </div>
    </div>
  );
}
