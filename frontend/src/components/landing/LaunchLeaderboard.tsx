import { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, ExternalLink, Flame } from 'lucide-react';
import api from '../../lib/api';

interface Launch {
  id: string;
  creatorName: string;
  launchTitle: string;
  revenue: number;
  students: number;
  durationDays: number;
  status: string;
  topSource: string;
  shareToken: string | null;
}

export function LaunchLeaderboard() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchLaunches();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchLaunches();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchLaunches = async () => {
    try {
      const response = await api.get('/public/recent-launches?limit=8');
      setLaunches(response.data.launches);
      setLastUpdated(new Date(response.data.lastUpdated));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch launches:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-8 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-chart-series6 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Recent Launches</h3>
              <p className="text-sm text-primary-100">
                See what course creators are achieving with data-driven launches
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm">
            <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-gray-100">
        {launches.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No public launches yet. Be the first to share your results!</p>
          </div>
        ) : (
          launches.map((launch, index) => {
            const isTopThree = index < 3;
            const rank = index + 1;

            return (
              <div
                key={launch.id}
                className={`p-6 transition-all hover:bg-gray-50 ${
                  isTopThree ? 'bg-success-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        rank === 1
                          ? 'bg-warning-100 text-warning-700'
                          : rank === 2
                          ? 'bg-gray-200 text-gray-700'
                          : rank === 3
                          ? 'bg-warning-50 text-warning-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rank}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            {launch.creatorName}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 truncate">
                            {launch.launchTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{launch.durationDays} days</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>Top: {launch.topSource}</span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="text-2xl font-bold text-gray-900">
                          ${(launch.revenue / 1000).toFixed(1)}K
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{launch.students} students</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 mt-3">
                      {launch.status === 'active' && (
                        <span className="px-2 py-1 bg-success-100 text-success-700 rounded text-xs font-medium flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></div>
                          Active Now
                        </span>
                      )}
                      {launch.status === 'completed' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          Completed
                        </span>
                      )}
                      {launch.shareToken && (
                        <a
                          href={`/public/launch/${launch.shareToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium flex items-center gap-1 hover:bg-primary-200 transition"
                        >
                          View Recap
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Updated{' '}
            {Math.floor((Date.now() - lastUpdated.getTime()) / 1000 / 60)} minutes ago
          </div>
          <div className="text-primary-600 font-medium">
            Share your launch results to appear here
          </div>
        </div>
      </div>
    </div>
  );
}
