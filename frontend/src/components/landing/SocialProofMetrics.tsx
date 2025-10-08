import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

interface Metrics {
  totalRevenueAttributed: number;
  activeUsers: number;
  averageMatchRate: number;
  totalPurchasesTracked: number;
}

export function SocialProofMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchMetrics();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/public/social-proof-metrics');
      setMetrics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch social proof metrics:', error);
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="grid md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-card p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: DollarSign,
      label: 'Revenue Attributed',
      value: `$${(metrics.totalRevenueAttributed / 1000000).toFixed(1)}M`,
      description: 'Total revenue tracked',
      color: 'text-success-600',
      bg: 'bg-success-100',
    },
    {
      icon: Users,
      label: 'Course Creators',
      value: `${metrics.activeUsers}+`,
      description: 'Active users',
      color: 'text-primary-600',
      bg: 'bg-primary-100',
    },
    {
      icon: TrendingUp,
      label: 'Match Rate',
      value: `${metrics.averageMatchRate}%`,
      description: 'Avg attribution accuracy',
      color: 'text-chart-series6',
      bg: 'bg-chart-series6/10',
    },
    {
      icon: CheckCircle,
      label: 'Purchases Tracked',
      value: `${(metrics.totalPurchasesTracked / 1000).toFixed(1)}K`,
      description: 'Last 30 days',
      color: 'text-warning-600',
      bg: 'bg-warning-100',
    },
  ];

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-6 border border-gray-100"
        >
          <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
          <div className="text-sm font-medium text-gray-700 mb-1">{stat.label}</div>
          <div className="text-xs text-gray-500">{stat.description}</div>
        </div>
      ))}
    </div>
  );
}
