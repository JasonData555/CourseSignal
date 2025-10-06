import { clsx } from 'clsx';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  percentage,
  label,
  showPercentage = true,
  variant = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const variantClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-600">
              {clampedPercentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={clsx('h-full transition-all duration-300 ease-out', variantClasses[variant])}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
