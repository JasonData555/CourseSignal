import { clsx } from 'clsx';

export type DateRange = '7d' | '30d' | '90d' | 'all';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  return (
    <div className={clsx('inline-flex rounded-lg border border-gray-200 bg-white', className)}>
      {ranges.map((range, index) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors',
            index === 0 && 'rounded-l-lg',
            index === ranges.length - 1 && 'rounded-r-lg',
            index !== 0 && 'border-l border-gray-200',
            value === range.value
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-gray-50'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
