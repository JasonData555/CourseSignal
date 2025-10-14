import { Zap, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { ChannelRow } from './ChannelRow';
import { AnnotationCard } from './AnnotationCard';

export function LaunchDashboardShowcase() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 xl:px-20">
      <div className="grid lg:grid-cols-10 gap-8 items-center">
      {/* Left: "Before" state (30%) */}
      <div className="lg:col-span-3 hidden lg:block">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-danger-500/10 to-danger-600/5 rounded-lg"></div>
          <div
            className="relative bg-white rounded-lg shadow-card p-6 border border-gray-200 opacity-70 blur-[1px]"
            style={{ filter: 'grayscale(30%)' }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-500">REVENUE_TRACKING.xlsx</span>
                <span className="text-xs text-gray-400">Modified 2 hours ago</span>
              </div>

              {/* Simulated spreadsheet tabs */}
              <div className="flex gap-2 border-b border-gray-200">
                <div className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded-t">
                  Q1 Sales
                </div>
                <div className="px-3 py-1 text-xs text-gray-500">Q2 Sales</div>
                <div className="px-3 py-1 text-xs text-gray-500">Marketing</div>
              </div>

              {/* Simulated messy data */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="font-medium text-gray-600">Source</div>
                  <div className="font-medium text-gray-600">Revenue?</div>
                  <div className="font-medium text-gray-600">Notes</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                  <div>Google???</div>
                  <div>$12,340</div>
                  <div className="text-danger-600">Check this</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                  <div>Social</div>
                  <div className="text-danger-600">???</div>
                  <div>Missing data</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                  <div>Email?</div>
                  <div>$8,200</div>
                  <div className="text-warning-600">Estimate</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                  <div>YouTube</div>
                  <div>TBD</div>
                  <div className="text-gray-400">Update later</div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-danger-600">
                  <span className="font-medium">Total:</span>
                  <span className="line-through">$24,500</span>
                  <span className="text-warning-600">Wait, that's wrong...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Label */}
          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-gray-700">Before: Spreadsheet Chaos</p>
            <p className="text-xs text-gray-500 mt-1">Guessing which channels work</p>
          </div>
        </div>
      </div>

      {/* Center: Arrow divider */}
      <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-card border-2 border-primary-200">
            <span className="text-primary-600 text-xl font-bold">→</span>
          </div>
        </div>
      </div>

      {/* Right: "After" dashboard mockup (60%) */}
      <div className="lg:col-span-6 relative">
        <div className="relative bg-white rounded-xl shadow-elevated p-6 border border-gray-200">
          {/* Demo data badge */}
          <div className="absolute top-4 right-4 px-2 py-1 bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider rounded">
            Demo Data
          </div>

          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Black Friday 2024</h3>
              <p className="text-sm text-gray-500">Nov 24 - Nov 27 • Day 2 of 4</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-success-100 text-success-700 rounded-full">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <MetricCard label="Revenue" value="$47,820" trend="+$18K today" trendUp={true} />
            <MetricCard label="Students" value="89" trend="+32 today" trendUp={true} />
            <MetricCard label="Avg Order" value="$537" trend="↑ +12%" trendUp={true} />
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Goal Progress</span>
              <span className="font-semibold text-gray-900">$47,820 / $50,000</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-success-500 rounded-full transition-all" style={{ width: '95%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">95% of goal • $2,180 to go</p>
          </div>

          {/* Revenue by Channel */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Revenue by Channel</h4>
            <div className="space-y-3">
              <ChannelRow name="YouTube" revenue={28340} percentage={59} color="bg-chart-series1" />
              <ChannelRow name="Email" revenue={12890} percentage={27} color="bg-chart-series2" />
              <ChannelRow name="Instagram" revenue={4120} percentage={9} color="bg-chart-series3" />
              <ChannelRow name="Google Ads" revenue={2470} percentage={5} color="bg-chart-series4" />
            </div>
          </div>

          {/* LTV Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Lifetime Value</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">YouTube subscribers</span>
                <span className="font-bold text-gray-900">$892/customer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email list</span>
                <span className="font-bold text-gray-900">$687/customer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid traffic</span>
                <span className="font-bold text-gray-900">$421/customer</span>
              </div>
            </div>
          </div>

          {/* Floating Annotation Cards */}
          <AnnotationCard
            position="top-right"
            icon={<Zap className="w-5 h-5 text-success-600" />}
            title="Real-time tracking"
            description="Updates every 30 seconds during active launches"
            color="success"
          />

          <AnnotationCard
            position="middle-right"
            icon={<TrendingUp className="w-5 h-5 text-chart-series1" />}
            title="Know which channels convert"
            description="YouTube drove 59% of revenue, Instagram only 9%"
            color="chart-series1"
          />

          <AnnotationCard
            position="bottom-right"
            icon={<DollarSign className="w-5 h-5 text-chart-series4" />}
            title="True customer LTV"
            description="YouTube subscribers worth 2x paid traffic"
            color="chart-series4"
          />

          <AnnotationCard
            position="bottom-left"
            icon={<BarChart3 className="w-5 h-5 text-chart-series2" />}
            title="Compare launches"
            description="Black Friday vs. Summer Sale—see what works"
            color="chart-series2"
          />
        </div>

        {/* Label */}
        <div className="mt-4 text-center lg:text-left">
          <p className="text-sm font-semibold text-gray-900">After: Clear Attribution Data</p>
          <p className="text-xs text-gray-500 mt-1">Know exactly which channels drive revenue</p>
        </div>
      </div>
      </div>
    </div>
  );
}
