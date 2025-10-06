import { Card } from '../design-system';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export interface Recommendation {
  id: string;
  type: 'opportunity' | 'warning' | 'insight';
  title: string;
  description: string;
  metric?: string;
  action?: string;
}

interface SmartRecommendationsProps {
  recommendations: Recommendation[];
}

export function SmartRecommendations({ recommendations }: SmartRecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-success-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'insight':
        return <Lightbulb className="w-5 h-5 text-primary-600" />;
    }
  };

  const getBgColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'opportunity':
        return 'bg-success-50 border-success-200';
      case 'warning':
        return 'bg-warning-50 border-warning-200';
      case 'insight':
        return 'bg-primary-50 border-primary-200';
    }
  };

  const getTextColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'opportunity':
        return 'text-success-900';
      case 'warning':
        return 'text-warning-900';
      case 'insight':
        return 'text-primary-900';
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary-600" />
          Smart Recommendations
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Actionable insights based on your revenue data
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <Card
            key={rec.id}
            className={clsx('border', getBgColor(rec.type))}
            padding="md"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getIcon(rec.type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className={clsx('font-semibold mb-1', getTextColor(rec.type))}>
                  {rec.title}
                </h3>
                <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                {rec.metric && (
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    {rec.metric}
                  </p>
                )}
                {rec.action && (
                  <p className="text-sm font-medium text-primary-700">
                    → {rec.action}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
