import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { clsx } from 'clsx';

interface RevenueTrendChartProps {
  data: { date: string; revenue: number }[];
  height?: number;
}

type DateRangeView = '7d' | '14d' | '30d';

export function RevenueTrendChart({ data, height = 400 }: RevenueTrendChartProps) {
  const [dateRange, setDateRange] = useState<DateRangeView>('30d');

  // Filter data based on selected range
  const getDaysToShow = () => {
    switch (dateRange) {
      case '7d':
        return 7;
      case '14d':
        return 14;
      case '30d':
      default:
        return 30;
    }
  };

  const filteredData = data.slice(-getDaysToShow());

  // Find peak day
  const peakDay = filteredData.reduce(
    (max, day) => (day.revenue > max.revenue ? day : max),
    filteredData[0] || { date: '', revenue: 0 }
  );

  // Calculate trend
  const firstValue = filteredData[0]?.revenue || 0;
  const lastValue = filteredData[filteredData.length - 1]?.revenue || 0;
  const isUpward = lastValue > firstValue;
  const isFlat = Math.abs(lastValue - firstValue) < firstValue * 0.05;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs text-gray-600 mb-1">
            {new Date(data.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <p className="text-sm font-bold text-gray-900">
            ${data.revenue.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No revenue trend data available</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      {/* Date range toggle */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {(['7d', '14d', '30d'] as DateRangeView[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-medium transition-all duration-normal',
                dateRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#009392" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#009392" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={11}
            tickFormatter={(value) =>
              new Date(value).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            }
          />
          <YAxis
            stroke="#6b7280"
            fontSize={11}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#009392"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          {/* Peak marker */}
          {peakDay && (
            <ReferenceDot
              x={peakDay.date}
              y={peakDay.revenue}
              r={4}
              fill="#009392"
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Trend indicator */}
      <div className="flex items-center justify-between mt-2 px-2">
        <div className="text-xs text-gray-600">
          Peak: <span className="font-semibold text-gray-900">${peakDay.revenue.toLocaleString()}</span>
        </div>
        <div
          className={clsx(
            'text-xs font-medium',
            isUpward && !isFlat && 'text-success-600',
            !isUpward && !isFlat && 'text-danger-600',
            isFlat && 'text-gray-600'
          )}
        >
          {isFlat ? 'Stable' : isUpward ? 'Trending Up' : 'Trending Down'}
        </div>
      </div>
    </div>
  );
}
