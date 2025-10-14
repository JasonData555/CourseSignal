import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getChannelColor } from '../../../lib/chartColors';
import { SourceData } from '../RevenueBySource';

interface StudentsByChannelDonutProps {
  data: SourceData[];
  onSegmentClick?: (source: string) => void;
  height?: number;
}

export function StudentsByChannelDonut({
  data,
  onSegmentClick,
  height = 170,
}: StudentsByChannelDonutProps) {
  // Prepare chart data: sort by student count descending
  const sortedData = [...data].sort((a, b) => b.students - a.students);

  const chartData = sortedData.map((source) => ({
    name: source.source.charAt(0).toUpperCase() + source.source.slice(1),
    sourceRaw: source.source,
    value: source.students,
    percentage: 0, // Will be calculated below
    color: getChannelColor(source.source),
  }));

  // Calculate percentages
  const totalStudents = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach((item) => {
    item.percentage = totalStudents > 0 ? (item.value / totalStudents) * 100 : 0;
  });

  const handleClick = (data: any) => {
    if (onSegmentClick && data) {
      onSegmentClick(data.sourceRaw);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-1">{data.name}</p>
          <p className="text-sm text-gray-700">
            <span className="font-bold">{data.value.toLocaleString()}</span> students
            <span className="text-gray-500 ml-1">({data.percentage.toFixed(1)}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom center label showing total students
  const CenterLabel = ({ viewBox }: any) => {
    // Guard against undefined viewBox (can happen during initial render or resize)
    if (!viewBox || !viewBox.cx || !viewBox.cy) {
      return null;
    }

    const { cx, cy } = viewBox;
    return (
      <g>
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-gray-900"
        >
          {totalStudents.toLocaleString()}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-600"
        >
          Students
        </text>
      </g>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-gray-500">No student data available</p>
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
            cy="45%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            onClick={handleClick}
            style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
            label={CenterLabel as any}
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
        </PieChart>
      </ResponsiveContainer>

      {/* Legend below chart */}
      <div className="flex flex-col gap-1 mt-4 max-h-[90px] overflow-y-auto">
        {chartData.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded transition-colors"
            onClick={() => onSegmentClick?.(entry.sourceRaw)}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 flex-1 truncate">{entry.name}</span>
            <span className="text-gray-900 font-semibold flex-shrink-0">
              {entry.value}
            </span>
            <span className="text-gray-500 flex-shrink-0">
              ({entry.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
