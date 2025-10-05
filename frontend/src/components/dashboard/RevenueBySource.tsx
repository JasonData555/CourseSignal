import { useState } from 'react';
import { Table, Column } from '../design-system';
import { clsx } from 'clsx';

export interface SourceData {
  source: string;
  visitors: number;
  revenue: number;
  students: number;
  conversionRate: string;
  avgOrderValue: string;
  revenuePerVisitor: string;
}

interface RevenueBySourceProps {
  data: SourceData[];
  onDrillDown?: (source: string) => void;
}

export function RevenueBySource({ data, onDrillDown }: RevenueBySourceProps) {
  const [sortKey, setSortKey] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey as keyof SourceData];
    const bVal = b[sortKey as keyof SourceData];

    // Handle string comparisons
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    // Handle number comparisons
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const columns: Column<SourceData>[] = [
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (row) => (
        <div className="font-medium text-gray-900 capitalize">{row.source}</div>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-gray-900 mb-1">
            ${row.revenue.toLocaleString()}
          </div>
          {/* Horizontal bar for visual comparison */}
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'visitors',
      header: 'Visitors',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">{row.visitors.toLocaleString()}</span>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">{row.students.toLocaleString()}</span>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Conversion',
      sortable: true,
      align: 'right',
      render: (row) => {
        const rate = parseFloat(row.conversionRate);
        return (
          <span
            className={clsx(
              'font-medium',
              rate >= 5
                ? 'text-success-600'
                : rate >= 2
                ? 'text-gray-700'
                : 'text-warning-600'
            )}
          >
            {row.conversionRate}%
          </span>
        );
      },
    },
    {
      key: 'avgOrderValue',
      header: 'AOV',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">${row.avgOrderValue}</span>
      ),
    },
    {
      key: 'revenuePerVisitor',
      header: 'Rev/Visitor',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-gray-700">${row.revenuePerVisitor}</span>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue by Source</h2>
      <Table
        columns={columns}
        data={sortedData}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={onDrillDown ? (row) => onDrillDown(row.source) : undefined}
        emptyMessage="No revenue data yet. Once purchases start coming in, you'll see them here."
      />
    </div>
  );
}
