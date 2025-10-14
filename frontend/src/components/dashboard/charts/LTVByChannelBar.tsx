import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getChannelColor } from '../../../lib/chartColors';
import { SourceData } from '../RevenueBySource';

interface LTVByChannelBarProps {
  data: SourceData[];
  onBarClick?: (source: string) => void;
  height?: number;
}

export function LTVByChannelBar({
  data,
  onBarClick,
  height = 170,
}: LTVByChannelBarProps) {
  // Calculate LTV (Lifetime Value) = revenue / students for each channel
  const chartData = data
    .map((source) => {
      const ltv = source.students > 0 ? source.revenue / source.students : 0;
      return {
        name: source.source.charAt(0).toUpperCase() + source.source.slice(1),
        sourceRaw: source.source,
        ltv: ltv,
        revenue: source.revenue,
        students: source.students,
        color: getChannelColor(source.source),
      };
    })
    .sort((a, b) => b.ltv - a.ltv); // Sort by LTV descending

  const maxLTV = Math.max(...chartData.map((d) => d.ltv), 1);

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
          <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-semibold">Avg LTV:</span> ${data.ltv.toFixed(2)}
            </p>
            <p className="text-gray-600">
              Total Revenue: ${data.revenue.toLocaleString()}
            </p>
            <p className="text-gray-600">Students: {data.students.toLocaleString()}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom bar label showing LTV value on top
  const renderBarLabel = (props: any) => {
    // Guard against undefined props during initial render
    if (!props || typeof props.x === 'undefined' || typeof props.width === 'undefined') {
      return null;
    }

    const { x, y, width, value } = props;

    // Only show label if bar is tall enough (value > 10% of max)
    if (value < maxLTV * 0.1) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#374151"
        textAnchor="middle"
        style={{
          fontSize: '12px',
          fontWeight: 600,
        }}
      >
        ${value.toFixed(0)}
      </text>
    );
  };

  // Custom X-axis tick with truncation for long names
  const renderXAxisTick = (props: any) => {
    // Guard against undefined props during initial render
    if (!props || typeof props.x === 'undefined' || !props.payload) {
      return null;
    }

    const { x, y, payload } = props;
    const maxLength = 8;
    const text = payload.value.length > maxLength
      ? `${payload.value.substring(0, maxLength)}...`
      : payload.value;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={12}
          textAnchor="middle"
          fill="#64748b"
          style={{
            fontSize: '11px',
            fontWeight: 400,
          }}
        >
          {text}
        </text>
      </g>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-gray-500">No LTV data available</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
        >
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={renderXAxisTick as any}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickFormatter={(value) => `$${value}`}
            domain={[0, maxLTV * 1.15]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar
            dataKey="ltv"
            radius={[4, 4, 0, 0]}
            onClick={handleClick}
            label={renderBarLabel as any}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="transition-opacity hover:opacity-90"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
