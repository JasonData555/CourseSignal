import { useState } from 'react';
import { Table, Column } from '../design-system';
import { clsx } from 'clsx';
import { LayoutGrid, List } from 'lucide-react';
import { AttributionCard } from './AttributionCard';

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

type ViewMode = 'cards' | 'table';
type SortKey = 'revenue' | 'conversionRate' | 'visitors' | 'avgOrderValue' | 'revenuePerVisitor';

export function RevenueBySource({ data, onDrillDown }: RevenueBySourceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key as SortKey);
      setSortDirection('desc');
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortKey(e.target.value as SortKey);
    setSortDirection('desc');
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
  const avgAOV = data.reduce((sum, d) => sum + parseFloat(d.avgOrderValue), 0) / data.length;

  // Calculate performance badges
  const getCardProps = (source: SourceData) => {
    const conversionNum = parseFloat(source.conversionRate);
    const aovNum = parseFloat(source.avgOrderValue);
    const topConversionSource = sortedData.reduce((prev, current) =>
      parseFloat(current.conversionRate) > parseFloat(prev.conversionRate) ? current : prev
    );

    return {
      isTopPerformer: source.source === topConversionSource.source && conversionNum >= 5,
      needsAttention: conversionNum < 1 && source.visitors > 100,
      hasHighAOV: aovNum > avgAOV * 1.3,
    };
  };

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

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-card p-12 text-center">
        <p className="text-gray-500">
          No revenue data yet. Once purchases start coming in, you'll see them here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with controls */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Revenue by Source</h2>
            <p className="text-sm text-gray-600 mt-1">
              See which traffic sources generate the most revenue
            </p>
          </div>

          {/* View toggle + Sort controls */}
          <div className="flex items-center gap-3">
            {/* Sort dropdown (cards view only) */}
            {viewMode === 'cards' && (
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                  Sort:
                </label>
                <select
                  id="sort-select"
                  value={sortKey}
                  onChange={handleSortChange}
                  className="text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="revenue">Revenue</option>
                  <option value="conversionRate">Conversion</option>
                  <option value="visitors">Visitors</option>
                  <option value="avgOrderValue">AOV</option>
                  <option value="revenuePerVisitor">Rev/Visitor</option>
                </select>
              </div>
            )}

            {/* View toggle buttons */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('cards')}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-normal',
                  'flex items-center gap-1.5',
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-normal',
                  'flex items-center gap-1.5',
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards view */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedData.map((source) => {
            const cardProps = getCardProps(source);
            return (
              <AttributionCard
                key={source.source}
                source={source.source}
                revenue={source.revenue}
                visitors={source.visitors}
                students={source.students}
                conversionRate={source.conversionRate}
                avgOrderValue={source.avgOrderValue}
                revenuePerVisitor={source.revenuePerVisitor}
                maxRevenue={maxRevenue}
                isTopPerformer={cardProps.isTopPerformer}
                needsAttention={cardProps.needsAttention}
                hasHighAOV={cardProps.hasHighAOV}
                onClick={onDrillDown ? () => onDrillDown(source.source) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <Table
          columns={columns}
          data={sortedData}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={onDrillDown ? (row) => onDrillDown(row.source) : undefined}
          emptyMessage="No revenue data yet. Once purchases start coming in, you'll see them here."
        />
      )}
    </div>
  );
}
