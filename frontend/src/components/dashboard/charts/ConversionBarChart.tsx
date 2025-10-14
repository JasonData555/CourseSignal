import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SourceData } from '../RevenueBySource';

interface ConversionBarChartProps {
  data: SourceData[];
  onBarClick?: (source: string) => void;
  height?: number;
}

export function ConversionBarChart({ data, onBarClick, height = 400 }: ConversionBarChartProps) {
  // Sort by conversion rate descending
  const sortedData = [...data].sort(
    (a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate)
  );

  const chartData = sortedData.map((source) => ({
    source: source.source.charAt(0).toUpperCase() + source.source.slice(1),
    conversion: parseFloat(source.conversionRate),
    students: source.students,
    visitors: source.visitors,
  }));

  const getBarColor = (conversion: number) => {
    if (conversion >= 5) return '#22c55e'; // Success green
    if (conversion >= 2) return '#009392'; // Teal (chart primary)
    return '#f59e0b'; // Warning amber
  };

  const handleClick = (data: any) => {
    if (onBarClick) {
      onBarClick(data.source.toLowerCase());
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
              <span className="font-semibold">{data.conversion.toFixed(2)}%</span> conversion
            </p>
            <p className="text-gray-600">
              {data.students} of {data.visitors} visitors
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No conversion data available</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
          <XAxis type="number" stroke="#6b7280" fontSize={12} />
          <YAxis
            type="category"
            dataKey="source"
            stroke="#6b7280"
            fontSize={12}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
          <Bar
            dataKey="conversion"
            radius={[0, 4, 4, 0]}
            onClick={handleClick}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.conversion)}
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
