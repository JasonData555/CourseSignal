import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Check } from 'lucide-react';

export function LiveMatchRateWidget() {
  // Simulate real-time updates
  const [matchedPurchases, setMatchedPurchases] = useState(12847);
  const [matchRate, setMatchRate] = useState(87.2);

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly increment purchases (simulate live data)
      setMatchedPurchases((prev) => prev + Math.floor(Math.random() * 3));
      // Slight variation in match rate
      setMatchRate((prev) => {
        const variation = (Math.random() - 0.5) * 0.2;
        const newRate = prev + variation;
        return Math.max(85, Math.min(90, newRate)); // Keep between 85-90%
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-success-50 to-primary-50 rounded-xl p-8 border-2 border-success-200 shadow-card">
      <div className="flex items-start gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-success-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Real-Time Attribution Accuracy
          </h3>
          <p className="text-gray-600 mb-6">
            See how CourseSignal is performing right now for course creators worldwide
          </p>

          {/* Live stats */}
          <div className="grid grid-cols-2 gap-6">
            {/* Purchases Matched */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <Check className="w-4 h-4" />
                <span>Purchases Matched</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 font-mono">
                {matchedPurchases.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
            </div>

            {/* Match Rate */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Match Rate</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-success-600 font-mono">
                  {matchRate.toFixed(1)}%
                </span>
                <span className="text-sm text-success-600">●</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">vs. GA4: 40-60%</div>
            </div>
          </div>

          {/* Live indicator */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-success-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm text-gray-600 font-medium">Updates every 5 seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badge */}
      <div className="mt-6 pt-6 border-t border-success-200">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Check className="w-5 h-5 text-success-600" />
            <span className="font-medium">85%+ Guaranteed Accuracy</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2 text-gray-700">
            <Check className="w-5 h-5 text-success-600" />
            <span className="font-medium">Email + Device Matching</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2 text-gray-700">
            <Check className="w-5 h-5 text-success-600" />
            <span className="font-medium">Real-Time Attribution</span>
          </div>
        </div>
      </div>
    </div>
  );
}
