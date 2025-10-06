import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  // If there's only one item with an href, show as back link
  if (items.length === 1 && items[0].href) {
    return (
      <div className={clsx('mb-6', className)}>
        <Link
          to={items[0].href}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to {items[0].label}</span>
        </Link>
      </div>
    );
  }

  return (
    <nav className={clsx('mb-6', className)}>
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-gray-400">/</span>
              )}
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={clsx(
                  'font-medium',
                  isLast ? 'text-gray-900' : 'text-gray-600'
                )}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
