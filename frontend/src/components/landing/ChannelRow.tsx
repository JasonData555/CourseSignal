interface ChannelRowProps {
  name: string;
  revenue: number;
  percentage: number;
  color: string;
}

export function ChannelRow({ name, revenue, percentage, color }: ChannelRowProps) {
  const formattedRevenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(revenue);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">{name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{formattedRevenue}</span>
            <span className="text-xs text-gray-500">({percentage}%)</span>
          </div>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
