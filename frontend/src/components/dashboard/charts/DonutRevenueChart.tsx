import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SourceData } from '../RevenueBySource';

interface DonutRevenueChartProps {
  data: SourceData[];
  onSegmentClick?: (source: string) => void;
  height?: number;
}

const COLORS = ['#009392', '#72aaa1', '#b1c7b3', '#f1eac8', '#e5b9ad', '#d98994', '#d0587e'];

export function DonutRevenueChart({ data, onSegmentClick, height = 400 }: DonutRevenueChartProps) {
  const chartData = data.map((source, index) => ({
    name: source.source.charAt(0).toUpperCase() + source.source.slice(1),
    value: source.revenue,
    percentage: 0, // Will be calculated
    color: COLORS[index % COLORS.length],
  }));

  // Calculate percentages
  const totalRevenue = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach((item) => {
    item.percentage = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
  });

  const handleClick = (data: any) => {
    if (onSegmentClick) {
      onSegmentClick(data.name.toLowerCase());
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-700">
            <span className="font-bold">${data.value.toLocaleString()}</span>
            {' '}({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 flex-1">{entry.value}</span>
            <span className="text-gray-900 font-semibold">
              {entry.payload.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            onClick={handleClick}
            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
