import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DateRangeSelector,
  DateRange,
  Button,
} from '../components/design-system';
import {
  RevenueSummary,
  RevenueBySource,
  RecentPurchases,
  SmartRecommendations,
  QuickInsights,
  SourceData,
  Purchase,
  Recommendation,
} from '../components/dashboard';
import { ArrowLeft, Lock } from 'lucide-react';

// Mock data for demo
const mockSummaryData = {
  totalRevenue: 12450,
  totalStudents: 38,
  avgOrderValue: 327.63,
  totalPurchases: 38,
  trends: {
    revenue: 18.5,
    students: 22.3,
    avgOrderValue: -3.2,
  },
};

const mockSourceData: SourceData[] = [
  {
    source: 'YouTube',
    visitors: 245,
    revenue: 4890,
    students: 14,
    conversionRate: '5.7%',
    avgOrderValue: '349.29',
    revenuePerVisitor: '19.96',
  },
  {
    source: 'Email',
    visitors: 189,
    revenue: 3520,
    students: 11,
    conversionRate: '5.8%',
    avgOrderValue: '320.00',
    revenuePerVisitor: '18.62',
  },
  {
    source: 'Google Ads',
    visitors: 156,
    revenue: 2640,
    students: 8,
    conversionRate: '5.1%',
    avgOrderValue: '330.00',
    revenuePerVisitor: '16.92',
  },
  {
    source: 'Instagram',
    visitors: 98,
    revenue: 990,
    students: 3,
    conversionRate: '3.1%',
    avgOrderValue: '330.00',
    revenuePerVisitor: '10.10',
  },
  {
    source: 'Direct',
    visitors: 67,
    revenue: 410,
    students: 2,
    conversionRate: '3.0%',
    avgOrderValue: '205.00',
    revenuePerVisitor: '6.12',
  },
];

const mockPurchases: Purchase[] = [
  {
    id: '1',
    email: 'sarah.jones@example.com',
    amount: 297,
    courseName: 'Advanced Marketing Masterclass',
    source: 'YouTube',
    purchasedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    email: 'mike.chen@example.com',
    amount: 497,
    courseName: 'Complete Course Creator Bundle',
    source: 'Email',
    purchasedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    email: 'lisa.williams@example.com',
    amount: 197,
    courseName: 'Beginner Course Launch',
    source: 'Google Ads',
    purchasedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    email: 'john.smith@example.com',
    amount: 297,
    courseName: 'Advanced Marketing Masterclass',
    source: 'YouTube',
    purchasedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    email: 'emily.davis@example.com',
    amount: 97,
    courseName: 'Quick Start Guide',
    source: 'Instagram',
    purchasedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
];

const mockRecommendations: Recommendation[] = [
  {
    id: 'best-source',
    type: 'opportunity',
    title: 'Email is your top performer',
    description: 'This channel converts at 5.8%, significantly better than other sources.',
    action: 'Consider increasing investment in Email',
  },
  {
    id: 'revenue-growth',
    type: 'opportunity',
    title: 'Strong revenue growth',
    description: 'Your revenue is up 18.5% compared to the previous period.',
    metric: '+$2,303',
    action: 'Keep doing what you\'re doing!',
  },
  {
    id: 'low-conversion',
    type: 'warning',
    title: 'Instagram has low conversion',
    description: 'With 98 visitors but only 3.1% conversion, there\'s room for improvement.',
    action: 'Review your Instagram strategy or landing pages',
  },
];

export default function DemoDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-chart-series6 text-white py-3 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5" />
            <span className="font-medium">Demo Mode - Viewing sample data</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/signup')}
              className="bg-white text-primary-900 hover:bg-gray-100"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header with controls */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-base text-gray-600 mt-1">
                See exactly where your revenue comes from
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
              <DateRangeSelector value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          {/* Quick Insights - Hero section with actionable summary */}
          <QuickInsights
            sources={mockSourceData}
            totalRevenue={mockSummaryData.totalRevenue}
            revenueTrend={mockSummaryData.trends.revenue}
          />

          {/* Hero Metrics Section */}
          <RevenueSummary data={mockSummaryData} />

          {/* Revenue by Source Table - Most important for attribution */}
          <RevenueBySource data={mockSourceData} />

          {/* Smart Recommendations - Contextual, supporting insights */}
          <SmartRecommendations recommendations={mockRecommendations} />

          {/* Recent Purchases Feed - Supporting detail */}
          <RecentPurchases purchases={mockPurchases} />
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Ready to track your own revenue?
          </h2>
          <p className="text-gray-600 mb-6">
            Start your 14-day free trial and see exactly where your sales come from.
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Start Free Trial
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 2-minute setup
          </p>
        </div>
      </div>
    </div>
  );
}
