import { ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-md shadow-card p-12 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-3 text-left',
                    'text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    'bg-gray-50',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 transition-colors duration-normal select-none',
                    getAlignClass(column.align)
                  )}
                  onClick={() => handleSort(column.key, column.sortable)}
                >
                  <div
                    className={clsx(
                      'flex items-center gap-1',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="inline-flex flex-col">
                        <ChevronUp
                          className={clsx(
                            'w-3 h-3 -mb-1',
                            sortKey === column.key && sortDirection === 'asc'
                              ? 'text-primary-600'
                              : 'text-gray-400'
                          )}
                        />
                        <ChevronDown
                          className={clsx(
                            'w-3 h-3 -mt-1',
                            sortKey === column.key && sortDirection === 'desc'
                              ? 'text-primary-600'
                              : 'text-gray-400'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={clsx(
                  'border-b border-gray-100 transition-colors duration-normal',
                  onRowClick && 'cursor-pointer hover:bg-gray-50'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx(
                      'px-6 py-4 text-sm text-gray-900',
                      getAlignClass(column.align)
                    )}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
