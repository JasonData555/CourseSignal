import { ReactNode } from 'react';
import { clsx } from 'clsx';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'archived';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  pulse?: boolean;
}

export function Badge({ children, variant = 'default', className, pulse = false }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-600/10',
    success: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20',
    warning: 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-600/20',
    danger: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-600/20',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    primary: 'bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20',

    // Status variants (semantic)
    upcoming: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    active: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20',
    completed: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-600/10',
    archived: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-600/10',
  };

  const showDot = pulse || variant === 'active' || variant === 'upcoming';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
        'text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {/* Status dot for active/upcoming */}
      {showDot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'active' && 'bg-success-600',
          variant === 'upcoming' && 'bg-blue-600',
          pulse && 'animate-pulse'
        )} />
      )}
      {children}
    </span>
  );
}
