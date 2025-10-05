import { ReactNode } from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
          <p className="text-sm text-gray-600 font-normal">{label}</p>
          <p className="mt-2 text-4xl font-bold text-gray-900">{formatValue(value)}</p>

          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {trendPositive && (
                <>
                  <TrendingUp className="w-4 h-4 text-success-600" />
                  <span className="text-sm font-medium text-success-600">
                    ↑ {Math.abs(trend).toFixed(1)}%
                  </span>
                </>
              )}
              {trendNegative && (
                <>
                  <TrendingDown className="w-4 h-4 text-danger-600" />
                  <span className="text-sm font-medium text-danger-600">
                    ↓ {Math.abs(trend).toFixed(1)}%
                  </span>
                </>
              )}
              {trend === 0 && (
                <span className="text-sm font-medium text-gray-500">—</span>
              )}
              {trendLabel && (
                <span className="text-sm text-gray-500 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="flex-shrink-0 p-3 bg-primary-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
