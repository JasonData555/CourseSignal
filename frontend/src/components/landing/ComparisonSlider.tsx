import { useState } from 'react';
import { X, Check, HelpCircle } from 'lucide-react';

export function ComparisonSlider() {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Comparison Container */}
      <div className="relative h-[500px]">
        {/* LEFT SIDE - Google Analytics (BEFORE) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <div className="p-8 h-full flex flex-col">
            {/* Label */}
            <div className="flex items-center justify-end mb-6">
              <HelpCircle className="w-5 h-5 text-gray-500" />
            </div>

            {/* Confused metrics */}
            <div className="space-y-4 flex-1">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Traffic Sources</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>google / organic</span>
                    <span>1,248 sessions</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>direct / none</span>
                    <span>892 sessions</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>(not set)</span>
                    <span>634 sessions</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Purchases</div>
                <div className="text-2xl font-bold text-gray-300">29 orders</div>
                <div className="text-xs text-gray-500 mt-1">$16,669 revenue</div>
              </div>

              {/* Problems */}
              <div className="space-y-2 pt-4">
                <div className="flex items-start gap-2 text-sm text-danger-400">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Can't connect purchases to specific traffic sources</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-danger-400">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>40-60% attribution accuracy (cookie-based)</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-danger-400">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>No integration with Kajabi/Teachable</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-danger-400">
                  <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>"(not set)" and "(direct)" everywhere</span>
                </div>
              </div>
            </div>

            {/* Bottom indicator */}
            <div className="mt-6 text-center">
              <div className="text-xl font-bold text-danger-400">You're guessing</div>
              <div className="text-sm text-gray-500">Which marketing actually made money?</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - CourseSignal (AFTER) */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary-900 to-chart-series6"
          style={{
            clipPath: `inset(0 0 0 ${sliderPosition}%)`,
          }}
        >
          <div className="p-8 h-full flex flex-col">
            {/* Label */}
            <div className="flex items-center justify-between mb-6">
              <div className="px-3 py-1 bg-success-900 text-success-300 rounded text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                CourseSignal
              </div>
              <div className="text-success-400 text-sm font-medium">87% match rate</div>
            </div>

            {/* Clear attribution */}
            <div className="space-y-4 flex-1">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-primary-200 text-sm mb-2">Revenue by Source</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-chart-series1"></div>
                      <span>YouTube</span>
                    </div>
                    <span className="font-bold">$8,247</span>
                  </div>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-chart-series2"></div>
                      <span>Email</span>
                    </div>
                    <span className="font-bold">$5,120</span>
                  </div>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-chart-series3"></div>
                      <span>Google Ads</span>
                    </div>
                    <span className="font-bold">$2,890</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4 border border-white/20 backdrop-blur-sm">
                <div className="text-primary-200 text-sm mb-2">Total Attributed</div>
                <div className="text-2xl font-bold text-white">29 students</div>
                <div className="text-xs text-primary-200 mt-1">$16,669 revenue • 87% matched</div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 pt-4">
                <div className="flex items-start gap-2 text-sm text-success-300">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Every purchase matched to marketing source</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-success-300">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>85%+ attribution accuracy (email + device match)</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-success-300">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Direct Kajabi/Teachable integration</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-success-300">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Full customer journey tracking</span>
                </div>
              </div>
            </div>

            {/* Bottom indicator */}
            <div className="mt-6 text-center">
              <div className="text-xl font-bold text-success-300">You know exactly</div>
              <div className="text-sm text-primary-200">Which channels drive revenue</div>
            </div>
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-1 h-6 bg-gray-400 rounded"></div>
              <div className="w-1 h-6 bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Slider Input */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
      />

      {/* Labels at top */}
      <div className="absolute top-0 left-0 right-0 flex justify-between p-4 pointer-events-none">
        <div className="bg-danger-900/90 backdrop-blur-sm text-danger-300 px-3 py-1 rounded text-sm font-medium">
          With Google Analytics
        </div>
        <div className="bg-success-900/90 backdrop-blur-sm text-success-300 px-3 py-1 rounded text-sm font-medium">
          With CourseSignal
        </div>
      </div>

      {/* Instruction Footer with Labels */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm text-white py-4 px-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="text-danger-300 text-base font-medium">
            Google Analytics
          </div>
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="text-2xl">👈</span>
            <span>Drag slider to compare</span>
            <span className="text-2xl">👉</span>
          </div>
          <div className="text-success-300 text-base font-medium">
            CourseSignal
          </div>
        </div>
      </div>
    </div>
  );
}
