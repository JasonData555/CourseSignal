import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getChannelColor } from '../../../lib/chartColors';
import { SourceData } from '../RevenueBySource';

interface HorizontalBarChartProps {
  data: SourceData[];
  onBarClick?: (source: string) => void;
  height?: number;
}

// Performance indicator color based on conversion rate - Refined professional palette
const getPerformanceColor = (conversionRate: number): string => {
  if (conversionRate >= 5) return '#16a34a'; // Green-600 (professional)
  if (conversionRate >= 3) return '#94a3b8'; // Slate-400 (neutral)
  return '#f97316'; // Orange-500 (warning, not danger)
};

export function HorizontalBarChart({ data, onBarClick, height = 280 }: HorizontalBarChartProps) {
  // Sort by revenue descending
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  // Prepare chart data
  const chartData = sortedData.map((source) => {
    const conversionRate = parseFloat(source.conversionRate);
    const totalRevenue = sortedData.reduce((sum, s) => sum + s.revenue, 0);
    const percentage = totalRevenue > 0 ? (source.revenue / totalRevenue) * 100 : 0;

    return {
      source: source.source.charAt(0).toUpperCase() + source.source.slice(1),
      sourceRaw: source.source,
      revenue: source.revenue,
      percentage: percentage.toFixed(0),
      conversionRate: conversionRate.toFixed(1),
      students: source.students,
      visitors: source.visitors,
      avgOrderValue: source.avgOrderValue,
      color: getChannelColor(source.source),
      performanceColor: getPerformanceColor(conversionRate),
    };
  });

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  const handleClick = (data: any) => {
    if (onBarClick && data) {
      onBarClick(data.sourceRaw);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.source}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-semibold">${data.revenue.toLocaleString()}</span> revenue
              <span className="text-gray-500 ml-1">({data.percentage}%)</span>
            </p>
            <p className="text-gray-600">{data.students} students from {data.visitors} visitors</p>
            <p className="text-gray-600">Conversion: {data.conversionRate}%</p>
            <p className="text-gray-600">Avg Order: ${data.avgOrderValue}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No revenue data available</p>
      </div>
    );
  }

  // Custom bar label that shows revenue + percentage inside the bar
  const renderBarLabel = (props: any) => {
    // Guard against undefined props during initial render
    if (!props || typeof props.x === 'undefined' || typeof props.width === 'undefined') {
      return null;
    }

    const { x, y, width, height, value, index } = props;
    const data = chartData[index];

    // Only show label if bar is wide enough (>80px for smaller layout)
    if (width < 80 || !data) return null;

    return (
      <text
        x={x + width - 12}
        y={y + height / 2}
        fill="white"
        textAnchor="end"
        dominantBaseline="middle"
        style={{
          fontSize: '14px',
          fontWeight: 500,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        ${value.toLocaleString()} ({data.percentage}%)
      </text>
    );
  };

  // Custom Y-axis tick that shows source name + conversion rate
  const renderYAxisTick = (props: any) => {
    // Guard against undefined props during initial render
    if (!props || typeof props.x === 'undefined' || !props.payload) {
      return null;
    }

    const { x, y, payload } = props;
    const dataItem = chartData.find((d) => d.source === payload.value);

    if (!dataItem) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        {/* Performance indicator dot */}
        <circle
          cx={-8}
          cy={-8}
          r={3}
          fill={dataItem.performanceColor}
        />

        {/* Source name */}
        <text
          x={-16}
          y={-6}
          textAnchor="end"
          style={{
            fontSize: '13px',
            fontWeight: 400,
            fill: '#475569',
          }}
        >
          {dataItem.source}
        </text>

        {/* Conversion rate */}
        <text
          x={-16}
          y={8}
          textAnchor="end"
          style={{
            fontSize: '11px',
            fontWeight: 400,
            fill: '#94a3b8',
          }}
        >
          {dataItem.conversionRate}% conv
        </text>
      </g>
    );
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis
            type="number"
            domain={[0, maxRevenue * 1.1]}
            hide
          />
          <YAxis
            type="category"
            dataKey="source"
            tick={renderYAxisTick as any}
            width={90}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar
            dataKey="revenue"
            radius={[0, 4, 4, 0]}
            onClick={handleClick}
            label={renderBarLabel as any}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient-${index})`}
                className="transition-opacity hover:opacity-90"
              />
            ))}
          </Bar>

          {/* Gradients for each bar */}
          <defs>
            {chartData.map((entry, index) => (
              <linearGradient
                key={`gradient-${index}`}
                id={`gradient-${index}`}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.85} />
              </linearGradient>
            ))}
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
