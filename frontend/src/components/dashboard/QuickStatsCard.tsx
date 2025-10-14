import { TrendingUp, DollarSign, Target, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface QuickStatsCardProps {
  conversionRate: number;
  revenuePerVisitor: number;
  topSource: {
    name: string;
    revenue: number;
  } | null;
  matchRate: number;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  isLast?: boolean;
}

function StatItem({ icon, label, value, subtext, isLast = false }: StatItemProps) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 py-3',
        !isLast && 'border-b border-gray-200'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wide text-gray-600 font-medium mb-1">
          {label}
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtext && (
          <div className="text-xs text-gray-600 mt-0.5">{subtext}</div>
        )}
      </div>
    </div>
  );
}

export function QuickStatsCard({
  conversionRate,
  revenuePerVisitor,
  topSource,
  matchRate,
}: QuickStatsCardProps) {
  // Determine conversion rate color
  const conversionColor = conversionRate >= 5
    ? 'text-success-600'
    : conversionRate >= 2
    ? 'text-gray-600'
    : 'text-warning-600';

  const conversionIcon = (
    <TrendingUp
      className={clsx('w-5 h-5', conversionColor)}
    />
  );

  // Match rate color
  const matchColor = matchRate >= 85
    ? 'text-success-600'
    : matchRate >= 70
    ? 'text-warning-600'
    : 'text-danger-600';

  const matchIcon = (
    <CheckCircle className={clsx('w-5 h-5', matchColor)} />
  );

  return (
    <div className="bg-slate-50 rounded-lg border border-gray-200 p-6 h-full">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Key Metrics
      </h3>

      <div className="space-y-0">
        <StatItem
          icon={conversionIcon}
          label="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          subtext={
            conversionRate >= 5
              ? 'Excellent performance'
              : conversionRate >= 2
              ? 'Average performance'
              : 'Room for improvement'
          }
        />

        <StatItem
          icon={<DollarSign className="w-5 h-5 text-primary-600" />}
          label="Revenue per Visitor"
          value={`$${revenuePerVisitor.toFixed(2)}`}
        />

        {topSource && (
          <StatItem
            icon={<Target className="w-5 h-5 text-primary-600" />}
            label="Top Source"
            value={topSource.name}
            subtext={`$${topSource.revenue.toLocaleString()} revenue`}
          />
        )}

        <StatItem
          icon={matchIcon}
          label="Match Rate"
          value={`${matchRate.toFixed(0)}%`}
          subtext={
            matchRate >= 85
              ? 'Great attribution accuracy'
              : matchRate >= 70
              ? 'Good attribution'
              : 'Consider improving tracking'
          }
          isLast
        />
      </div>
    </div>
  );
}
