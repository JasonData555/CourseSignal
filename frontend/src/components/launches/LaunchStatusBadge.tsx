import { Badge, BadgeVariant } from '../design-system';

export type LaunchStatus = 'upcoming' | 'active' | 'completed' | 'archived';

interface LaunchStatusBadgeProps {
  status: LaunchStatus;
}

export function LaunchStatusBadge({ status }: LaunchStatusBadgeProps) {
  const config: Record<LaunchStatus, { variant: BadgeVariant; label: string; pulse?: boolean }> = {
    upcoming: { variant: 'upcoming', label: 'Upcoming', pulse: false },
    active: { variant: 'active', label: 'Active', pulse: true },
    completed: { variant: 'completed', label: 'Completed' },
    archived: { variant: 'archived', label: 'Archived' },
  };

  const { variant, label, pulse } = config[status];

  return (
    <Badge variant={variant} pulse={pulse}>
      {label}
    </Badge>
  );
}
