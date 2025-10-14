import { useState, useEffect } from 'react';
import { ChevronRight, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { Recommendation, Purchase } from './index';

interface InsightsSidebarProps {
  recommendations: Recommendation[];
  recentPurchases: Purchase[];
  recommendationSource?: 'ai' | 'rule-based';
  loadingRecommendations?: boolean;
  onViewAllPurchases?: () => void;
}

export function InsightsSidebar({
  recommendations,
  recentPurchases,
  recommendationSource = 'rule-based',
  loadingRecommendations = false,
  onViewAllPurchases,
}: InsightsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('dashboard_sidebar_collapsed');
    if (savedState) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('dashboard_sidebar_collapsed', String(newState));
  };

  const displayedRecommendations = showAllRecommendations
    ? recommendations
    : recommendations.slice(0, 3);

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
        return 'text-success-600 bg-success-50';
      case 'warning':
        return 'text-warning-600 bg-warning-50';
      case 'insight':
      default:
        return 'text-primary-600 bg-primary-50';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const purchaseDate = new Date(date);
    const diffMs = now.getTime() - purchaseDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Collapsed state - vertical tab
  if (isCollapsed) {
    return (
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer"
        onClick={handleToggleCollapse}
      >
        <div className="bg-primary-600 text-white px-3 py-6 rounded-l-lg shadow-lg hover:bg-primary-700 transition-colors">
          <div className="flex items-center gap-2 writing-mode-vertical">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium whitespace-nowrap rotate-180">
              Insights ({recommendations.length})
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-bold text-gray-900">AI Insights</h3>
            {recommendationSource === 'ai' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                ✨ AI
              </span>
            )}
          </div>
          <button
            onClick={handleToggleCollapse}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {loadingRecommendations ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary-600 rounded-full" />
              <p className="mt-2 text-xs">Generating insights...</p>
            </div>
          ) : displayedRecommendations.length > 0 ? (
            <>
              {displayedRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <div className={clsx('p-1.5 rounded', getIconColor(rec.type))}>
                      {getIcon(rec.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                        {rec.description}
                      </p>
                      {rec.action && (
                        <p className="text-xs text-primary-700 font-medium">
                          → {rec.action}
                        </p>
                      )}
                      {rec.metric && (
                        <div className="mt-2 text-sm font-bold text-primary-600">
                          {rec.metric}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {recommendations.length > 3 && (
                <button
                  onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                  className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-2"
                >
                  {showAllRecommendations
                    ? 'Show Less'
                    : `Show ${recommendations.length - 3} More`}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs">No insights available yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="border-t border-gray-200 bg-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-600" />
              <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            </div>

            {recentPurchases.length > 0 ? (
              <div className="space-y-2">
                {recentPurchases.slice(0, 5).map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center gap-2 text-xs text-gray-700 py-1.5 px-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-900">
                      ${purchase.amount.toFixed(0)}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{purchase.source}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {formatTimeAgo(purchase.purchasedAt)}
                    </span>
                  </div>
                ))}

                {onViewAllPurchases && recentPurchases.length > 5 && (
                  <button
                    onClick={onViewAllPurchases}
                    className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-medium py-2"
                  >
                    View all purchases →
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                No recent purchases
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
