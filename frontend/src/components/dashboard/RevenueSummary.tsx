import { MetricCard } from '../design-system';
import { DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-react';

interface SummaryData {
  totalRevenue: number;
  totalStudents: number;
  avgOrderValue: number;
  totalPurchases: number;
  trends: {
    revenue: number;
    students: number;
    avgOrderValue: number;
  };
}

interface RevenueSummaryProps {
  data: SummaryData;
}

export function RevenueSummary({ data }: RevenueSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        label="Total Revenue"
        value={data.totalRevenue}
        format="currency"
        trend={data.trends.revenue}
        trendLabel="vs last period"
        icon={<DollarSign className="w-6 h-6 text-primary-600" />}
      />
      <MetricCard
        label="Students"
        value={data.totalStudents}
        format="number"
        trend={data.trends.students}
        trendLabel="vs last period"
        icon={<Users className="w-6 h-6 text-primary-600" />}
      />
      <MetricCard
        label="Avg Order Value"
        value={data.avgOrderValue}
        format="currency"
        trend={data.trends.avgOrderValue}
        trendLabel="vs last period"
        icon={<TrendingUp className="w-6 h-6 text-primary-600" />}
      />
      <MetricCard
        label="Total Purchases"
        value={data.totalPurchases}
        format="number"
        icon={<ShoppingCart className="w-6 h-6 text-primary-600" />}
      />
    </div>
  );
}
