import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { LaunchStatus } from './LaunchStatusBadge';

interface LaunchTimelineProps {
  status: LaunchStatus;
  startDate: string;
  endDate: string;
}

export function LaunchTimeline({ status, startDate, endDate }: LaunchTimelineProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);

      let targetDate: Date;
      let prefix: string;

      if (status === 'upcoming') {
        targetDate = start;
        prefix = 'Starts in';
      } else if (status === 'active') {
        targetDate = end;
        prefix = 'Ends in';
      } else {
        setTimeRemaining('');
        return;
      }

      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${prefix} ${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`${prefix} ${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${prefix} ${minutes}m`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [status, startDate, endDate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateProgress = () => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return (elapsed / total) * 100;
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm font-medium text-gray-700">Launch Period</p>
            <p className="text-xs text-gray-500">
              {formatDate(startDate)} - {formatDate(endDate)}
            </p>
          </div>
        </div>

        {timeRemaining && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
            <Clock className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">{timeRemaining}</span>
          </div>
        )}
      </div>

      {status === 'active' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-medium text-gray-600">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
