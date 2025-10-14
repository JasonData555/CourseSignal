interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

export function MetricCard({ label, value, trend, trendUp }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <p className="text-xs uppercase text-gray-600 mb-1 tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className={`text-sm font-medium ${trendUp ? 'text-success-600' : 'text-danger-600'}`}>
        {trend}
      </p>
    </div>
  );
}
