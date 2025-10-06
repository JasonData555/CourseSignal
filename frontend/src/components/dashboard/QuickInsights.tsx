import { TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';
import { Card } from '../design-system';

export interface SourceData {
  source: string;
  revenue: string;
  visitors: number;
  students: number;
  conversionRate: string;
  avgOrderValue: string;
  revenuePerVisitor: string;
}

interface QuickInsightsProps {
  sources: SourceData[];
  totalRevenue: number;
  revenueTrend?: number;
}

export function QuickInsights({ sources, totalRevenue, revenueTrend }: QuickInsightsProps) {
  if (sources.length === 0) return null;

  // Find best and worst performing sources by conversion rate
  const sortedByConversion = [...sources].sort(
    (a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate)
  );
  const topSource = sortedByConversion[0];
  const worstSource = sortedByConversion[sortedByConversion.length - 1];

  // Find highest revenue source
  const topRevenueSource = [...sources].sort(
    (a, b) => parseFloat(b.revenue) - parseFloat(a.revenue)
  )[0];

  // Generate insight message
  let insightMessage = '';
  let insightType: 'success' | 'warning' | 'info' = 'info';
  let Icon = Target;

  // Prioritize insights
  if (revenueTrend !== undefined && revenueTrend < -10) {
    // Revenue decline - highest priority
    insightMessage = `Revenue is down ${Math.abs(revenueTrend).toFixed(1)}% from last period. Review recent changes to your marketing strategy.`;
    insightType = 'warning';
    Icon = TrendingDown;
  } else if (parseFloat(worstSource.conversionRate) < 1 && worstSource.visitors > 100) {
    // Underperforming channel with significant traffic
    insightMessage = `${worstSource.source} has ${worstSource.visitors} visitors but only ${worstSource.conversionRate}% conversion. Consider reviewing your ${worstSource.source} strategy or landing pages.`;
    insightType = 'warning';
    Icon = AlertCircle;
  } else if (parseFloat(topSource.conversionRate) > 5) {
    // High-performing channel
    const topRevenue = parseFloat(topSource.revenue.replace(/[$,]/g, ''));
    insightMessage = `${topSource.source} is your top performer with ${topSource.conversionRate}% conversion rate and $${topRevenue.toLocaleString()} in revenue. Consider investing more in this channel.`;
    insightType = 'success';
    Icon = TrendingUp;
  } else if (revenueTrend !== undefined && revenueTrend > 20) {
    // Strong growth
    insightMessage = `Revenue is up ${revenueTrend.toFixed(1)}% compared to last period. Keep doing what you're doing!`;
    insightType = 'success';
    Icon = TrendingUp;
  } else {
    // Default insight - highest revenue source
    const topRevenue = parseFloat(topRevenueSource.revenue.replace(/[$,]/g, ''));
    insightMessage = `${topRevenueSource.source} is your top revenue channel with $${topRevenue.toLocaleString()} in sales. This represents ${((topRevenue / totalRevenue) * 100).toFixed(1)}% of your total revenue.`;
    insightType = 'info';
    Icon = Target;
  }

  const bgColorClass = {
    success: 'bg-success-50 border-success-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-blue-50 border-blue-200',
  }[insightType];

  const iconColorClass = {
    success: 'text-success-600',
    warning: 'text-warning-600',
    info: 'text-blue-600',
  }[insightType];

  const textColorClass = {
    success: 'text-success-900',
    warning: 'text-warning-900',
    info: 'text-blue-900',
  }[insightType];

  return (
    <div className={`border-l-4 ${bgColorClass} p-4 rounded-md`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${textColorClass} mb-1`}>
            Quick Insight
          </h3>
          <p className={`text-sm ${textColorClass}`}>
            {insightMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
