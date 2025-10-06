import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button } from '../components/design-system';
import { DollarSign, Users, TrendingUp, ExternalLink, Twitter, Linkedin, Facebook } from 'lucide-react';
import api from '../lib/api';

interface PublicLaunchData {
  launch: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
  };
  metrics: {
    revenue: number;
    students: number;
    purchases: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  topSources: Array<{
    source: string;
    revenue: number;
    students: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function PublicLaunchRecap() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<PublicLaunchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicData();
  }, [shareToken]);

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/public/launches/${shareToken}`);
      setData(response.data.metrics);
    } catch (err: any) {
      console.error('Failed to fetch public launch data:', err);
      setError(err.response?.data?.error || 'Launch not found');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const shareUrl = window.location.href;
  const shareText = data
    ? `Check out my ${data.launch.title} results: ${formatCurrency(data.metrics.revenue)} revenue, ${data.metrics.students} students, ${data.metrics.conversionRate.toFixed(1)}% conversion!`
    : '';

  const handleShare = (platform: 'twitter' | 'linkedin' | 'facebook') => {
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="grid grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center py-12">
        <Card className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Launch Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'This launch recap is not available or has been disabled.'}
          </p>
          <Button onClick={() => window.location.href = 'https://coursesignal.com'}>
            Learn More About CourseSignal
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{data.launch.title}</h1>
            {data.launch.description && (
              <p className="text-xl text-gray-600 mb-6">{data.launch.description}</p>
            )}
            <p className="text-sm text-gray-500">
              {formatDate(data.launch.startDate)} - {formatDate(data.launch.endDate)}
            </p>
          </div>

          {/* Hero Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center bg-white shadow-lg">
              <DollarSign className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(data.metrics.revenue)}
              </p>
            </Card>

            <Card className="text-center bg-white shadow-lg">
              <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">Students Enrolled</p>
              <p className="text-4xl font-bold text-gray-900">{data.metrics.students}</p>
            </Card>

            <Card className="text-center bg-white shadow-lg">
              <TrendingUp className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
              <p className="text-4xl font-bold text-gray-900">
                {data.metrics.conversionRate.toFixed(1)}%
              </p>
            </Card>
          </div>

          {/* Top Sources */}
          {data.topSources.length > 0 && (
            <Card className="bg-white shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Marketing Channels</h2>
              <div className="space-y-4">
                {data.topSources.map((source, index) => (
                  <div
                    key={source.source}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 capitalize">{source.source}</p>
                        <p className="text-sm text-gray-600">{source.students} students</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(source.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-2xl">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-4">
                Want to track your next launch like this?
              </h2>
              <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                CourseSignal helps course creators understand which marketing channels drive
                revenue, so you can make data-driven decisions for your next launch.
              </p>
              <Button
                variant="secondary"
                className="bg-white text-primary-700 hover:bg-gray-100 text-lg px-8 py-3"
                onClick={() => window.location.href = 'https://coursesignal.com'}
              >
                Analyze your next launch with CourseSignal
                <ExternalLink className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Share Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleShare('twitter')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Twitter className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Facebook className="w-4 h-4" />
              Share
            </button>
          </div>

          {/* Footer */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Made with</p>
            <a
              href="https://coursesignal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-2"
            >
              CourseSignal
              <ExternalLink className="w-5 h-5" />
            </a>
            <p className="text-xs text-gray-500 mt-2">
              Revenue attribution analytics for course creators
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
