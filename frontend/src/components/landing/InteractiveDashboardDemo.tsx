import { useState } from 'react';
import { TrendingUp, Users, DollarSign, ShoppingCart, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface SourceData {
  source: string;
  revenue: number;
  students: number;
  visitors: number;
  color: string;
}

const sampleData: SourceData[] = [
  { source: 'YouTube', revenue: 8247, students: 12, visitors: 342, color: 'bg-chart-series1' },
  { source: 'Email', revenue: 5120, students: 8, visitors: 156, color: 'bg-chart-series2' },
  { source: 'Google Ads', revenue: 2890, students: 5, visitors: 428, color: 'bg-chart-series3' },
  { source: 'Facebook', revenue: 2340, students: 4, visitors: 215, color: 'bg-chart-series4' },
  { source: 'Instagram', revenue: 1680, students: 3, visitors: 189, color: 'bg-chart-series5' },
  { source: 'TikTok', revenue: 890, students: 2, visitors: 134, color: 'bg-chart-series6' },
  { source: 'Direct', revenue: 1890, students: 3, visitors: 67, color: 'bg-chart-series7' },
];

export function InteractiveDashboardDemo() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const totalRevenue = sampleData.reduce((sum, item) => sum + item.revenue, 0);
  const totalStudents = sampleData.reduce((sum, item) => sum + item.students, 0);
  const totalVisitors = sampleData.reduce((sum, item) => sum + item.visitors, 0);

  // Currently unused but available for future interactivity
  // const selected = selectedSource ? sampleData.find((s) => s.source === selectedSource) : null;

  return (
    <div className="relative">
      <div
        className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200 transition-all duration-300 hover:shadow-elevated"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Revenue Attribution</h3>
            <p className="text-sm text-gray-500 mt-1">Click any source to see details</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span>Live Demo</span>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${totalRevenue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <Users className="w-3 h-3" />
              <span>Students</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>Visitors</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalVisitors}</div>
          </div>
        </div>

        {/* Revenue by Source - Interactive */}
        <div className="space-y-3">
          {sampleData.map((item) => {
            const percentage = (item.revenue / totalRevenue) * 100;
            const isSelected = selectedSource === item.source;

            return (
              <button
                key={item.source}
                onClick={() =>
                  setSelectedSource(isSelected ? null : item.source)
                }
                className={clsx(
                  'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Color indicator */}
                  <div className={`w-4 h-4 rounded-full ${item.color}`}></div>

                  {/* Source name */}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{item.source}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.students} students • {item.visitors} visitors
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      ${item.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Expanded details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-primary-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Conversion Rate</div>
                        <div className="font-semibold text-gray-900">
                          {((item.students / item.visitors) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Avg Order Value</div>
                        <div className="font-semibold text-gray-900">
                          ${Math.round(item.revenue / item.students)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Revenue/Visitor</div>
                        <div className="font-semibold text-gray-900">
                          ${Math.round(item.revenue / item.visitors)}
                        </div>
                      </div>
                    </div>

                    {/* Sample journey */}
                    <div className="mt-3 p-3 bg-white rounded border border-primary-200">
                      <div className="text-xs text-gray-600 mb-2">Sample Customer Journey:</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded">
                          {item.source}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {Math.floor(Math.random() * 3) + 1} sessions
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-1 bg-success-100 text-success-700 rounded flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          Purchase
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-success-500 rounded-full"></div>
            <span>Sample data • 87% match rate • Real-time updates</span>
          </div>
          <div className="flex items-center gap-1 text-primary-600 font-medium">
            <span>See YOUR data</span>
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Floating hint */}
      {isHovering && !selectedSource && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg animate-pulse whitespace-nowrap">
          👆 Click any source to see the customer journey
        </div>
      )}
    </div>
  );
}
