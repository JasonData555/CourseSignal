import { useState } from 'react';
import { Calculator, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '../design-system';

interface CalculatorInputs {
  monthlyRevenue: number;
  channelCount: number;
  currentTool: string;
}

export function ROICalculator({ onGetStarted }: { onGetStarted?: (inputs: CalculatorInputs) => void }) {
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [channelCount, setChannelCount] = useState(5);
  const [currentTool, setCurrentTool] = useState('google-analytics');

  // Calculate estimates
  const calculateWaste = () => {
    // Assume 30% waste if using GA (60% match rate means 40% guessing)
    // Assume 50% waste if using platform analytics only
    // Assume 70% waste if using nothing
    let wastePercentage = 0;
    switch (currentTool) {
      case 'google-analytics':
        wastePercentage = 0.3;
        break;
      case 'platform-only':
        wastePercentage = 0.5;
        break;
      case 'none':
        wastePercentage = 0.7;
        break;
      default:
        wastePercentage = 0.3;
    }

    // Marketing spend typically 20-30% of revenue for course creators
    const marketingSpend = monthlyRevenue * 0.25;
    const wastedSpend = marketingSpend * wastePercentage;
    const annualWaste = wastedSpend * 12;

    // Potential recovery is 50-70% of waste (conservative)
    const recoveryRate = 0.6;
    const monthlyRecovery = wastedSpend * recoveryRate;
    const annualRecovery = monthlyRecovery * 12;

    return {
      marketingSpend,
      wastedSpend,
      annualWaste,
      monthlyRecovery,
      annualRecovery,
      blindSpots: Math.ceil(channelCount * wastePercentage),
    };
  };

  const results = calculateWaste();

  return (
    <div className="bg-white rounded-xl shadow-elevated p-8 border border-gray-200">
      <div className="flex items-start gap-4 mb-8">
        <div className="flex-shrink-0 w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-6 h-6 text-warning-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">See What You're Losing Right Now</h3>
          <p className="text-gray-600">
            Calculate how much revenue you could recover with accurate attribution
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-6 mb-8">
        {/* Monthly Revenue Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Course Revenue
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10000"
              max="500000"
              step="10000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="w-32 px-4 py-2 bg-gray-100 rounded-lg text-right font-mono font-semibold text-gray-900">
              ${(monthlyRevenue / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$10K</span>
            <span>$500K</span>
          </div>
        </div>

        {/* Channel Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Marketing Channels
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={channelCount}
              onChange={(e) => setChannelCount(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="w-32 px-4 py-2 bg-gray-100 rounded-lg text-right font-mono font-semibold text-gray-900">
              {channelCount} channels
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>2</span>
            <span>10</span>
          </div>
        </div>

        {/* Current Tool */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Analytics Tool
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'google-analytics', label: 'Google Analytics', waste: '~30% waste' },
              { value: 'platform-only', label: 'Platform Only', waste: '~50% waste' },
              { value: 'none', label: 'None', waste: '~70% waste' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setCurrentTool(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentTool === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm mb-1">{option.label}</div>
                <div className="text-xs text-gray-500">{option.waste}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-gradient-to-br from-warning-50 to-danger-50 rounded-lg p-6 border-2 border-warning-200 mb-6">
        <div className="flex items-center gap-2 text-warning-800 mb-4">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-semibold">Your Attribution Blind Spot</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Estimated Wasted Spend</div>
            <div className="text-3xl font-bold text-danger-600">
              ${Math.round(results.wastedSpend).toLocaleString()}
              <span className="text-lg">/mo</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Attribution Blind Spots</div>
            <div className="text-3xl font-bold text-warning-600">
              {results.blindSpots}
              <span className="text-lg"> channels</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-2 text-success-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Potential Revenue Recovery</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-success-600">
              ${Math.round(results.annualRecovery).toLocaleString()}
            </span>
            <span className="text-lg text-gray-600">/year</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            ${Math.round(results.monthlyRecovery).toLocaleString()}/month with accurate attribution
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-50 rounded-lg p-6 border border-primary-200">
        <div className="text-center mb-4">
          <div className="text-sm text-gray-600 mb-2">
            CourseSignal can help you recover this lost revenue
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ROI: {Math.round(results.annualRecovery / (99 * 12))}x
          </div>
          <div className="text-xs text-gray-500">
            Based on $99/month subscription vs potential recovery
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => {
            if (onGetStarted) {
              onGetStarted({ monthlyRevenue, channelCount, currentTool });
            }
          }}
        >
          Get Real Attribution Data
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        <p className="text-center text-xs text-gray-500 mt-3">
          Free 14-day trial • No credit card required
        </p>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        * Estimates based on industry averages for course creators. Your actual results may vary.
      </p>
    </div>
  );
}
