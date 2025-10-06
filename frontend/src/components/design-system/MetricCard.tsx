import { ReactNode, cloneElement, isValidElement } from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  format = 'number',
  className,
}: MetricCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Uppercase label with letter-spacing for professionalism */}
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {label}
          </p>

          {/* Larger metric value - the hero */}
          <p className="mt-1 text-metric-lg font-bold text-gray-900 tracking-tight">
            {formatValue(value)}
          </p>

          {/* Trend indicator with pill background for emphasis */}
          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-1.5">
              <div className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                trendPositive && 'bg-success-50',
                trendNegative && 'bg-danger-50',
                trend === 0 && 'bg-gray-100'
              )}>
                {trendPositive && <TrendingUp className="w-4 h-4 text-success-600" />}
                {trendNegative && <TrendingDown className="w-4 h-4 text-danger-600" />}
                <span className={clsx(
                  'text-sm font-semibold',
                  trendPositive && 'text-success-700',
                  trendNegative && 'text-danger-700',
                  trend === 0 && 'text-gray-600'
                )}>
                  {trend === 0 ? '—' : `${Math.abs(trend).toFixed(1)}%`}
                </span>
              </div>
              {trendLabel && (
                <span className="text-xs text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Subtle icon that doesn't compete with data */}
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg">
            {isValidElement(icon)
              ? cloneElement(icon as React.ReactElement, {
                  className: 'w-5 h-5 text-gray-400'
                })
              : icon
            }
          </div>
        )}
      </div>
    </Card>
  );
}
