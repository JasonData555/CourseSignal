import { ReactNode } from 'react';

interface AnnotationCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color: 'success' | 'chart-series1' | 'chart-series2' | 'chart-series4';
  position: 'top-right' | 'middle-right' | 'bottom-right' | 'bottom-left';
}

const colorClasses = {
  success: 'border-success-500 bg-success-50',
  'chart-series1': 'border-chart-series1 bg-chart-series1/5',
  'chart-series2': 'border-chart-series2 bg-chart-series2/5',
  'chart-series4': 'border-chart-series4 bg-chart-series4/5',
};

const positionClasses = {
  'top-right': 'absolute top-20 -right-60 hidden xl:block',
  'middle-right': 'absolute top-1/2 -right-60 hidden xl:block',
  'bottom-right': 'absolute bottom-32 -right-60 hidden xl:block',
  'bottom-left': 'absolute bottom-4 -left-60 hidden xl:block',
};

export function AnnotationCard({ icon, title, description, color, position }: AnnotationCardProps) {
  return (
    <div className={`${positionClasses[position]} w-52 animate-fade-in z-10`}>
      <div
        className={`${colorClasses[color]} border-2 rounded-lg p-3 shadow-card-hover backdrop-blur-md bg-white/95`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">{icon}</div>
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-1">{title}</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
