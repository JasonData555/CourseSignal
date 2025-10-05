import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-card',
    circular: 'rounded-full',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200',
        variantClasses[variant],
        variant === 'text' && !height && 'h-4',
        className
      )}
      style={style}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <Skeleton width="60%" className="mb-4" />
      <Skeleton width="40%" height={36} className="mb-2" />
      <Skeleton width="30%" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <Skeleton width="100%" height={40} className="mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width="100%" height={48} className="mb-2" />
      ))}
    </div>
  );
}
