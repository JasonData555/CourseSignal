import { Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { clsx } from 'clsx';
import { Recommendation } from './SmartRecommendations';

interface InsightsPanelProps {
  recommendations: Recommendation[];
  recommendationSource?: 'ai' | 'rule-based';
  loadingRecommendations?: boolean;
}

export function InsightsPanel({
  recommendations,
  recommendationSource = 'rule-based',
  loadingRecommendations = false,
}: InsightsPanelProps) {

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'insight':
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'text-success-600';
      case 'warning':
        return 'text-warning-600';
      case 'insight':
      default:
        return 'text-primary-600';
    }
  };

  // Don't render if no recommendations
  if (recommendations.length === 0 && !loadingRecommendations) {
    return null;
  }

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-lg p-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
          AI Insights
        </h3>
        {recommendationSource === 'ai' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
            ✨ AI
          </span>
        )}
      </div>

      {/* Content */}
      {loadingRecommendations ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
          <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent text-primary-600 rounded-full" />
          <span>Generating insights...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0"
            >
              <span className={clsx('mt-0.5 flex-shrink-0', getIconColor(rec.type))}>
                {getIcon(rec.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {rec.title}
                </div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  {rec.description.length > 120
                    ? `${rec.description.substring(0, 120)}...`
                    : rec.description}
                </div>
                {rec.action && (
                  <div className="text-sm text-primary-700 mt-1 font-medium">
                    → {rec.action}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
