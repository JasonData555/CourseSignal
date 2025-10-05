import { ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
}

export function EmptyState({ icon, title, description, action, progress }: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gray-100 rounded-full">
            {icon}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{description}</p>

      {progress && (
        <div className="max-w-sm mx-auto mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{progress.label || 'Progress'}</span>
            <span className="font-medium">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {action && (
        <Button variant="primary" size="lg" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  );
}
