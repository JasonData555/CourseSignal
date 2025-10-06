import { clsx } from 'clsx';

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={clsx('relative my-8', className)}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs font-medium text-gray-500 bg-white uppercase tracking-wider">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return <hr className={clsx('border-t border-gray-200 my-6', className)} />;
}
