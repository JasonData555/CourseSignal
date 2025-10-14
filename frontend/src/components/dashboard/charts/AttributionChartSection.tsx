import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SourceData } from '../RevenueBySource';
import { DonutRevenueChart } from './DonutRevenueChart';
import { ConversionBarChart } from './ConversionBarChart';
import { RevenueTrendChart } from './RevenueTrendChart';
import { Table, Column } from '../../design-system';
import { clsx } from 'clsx';

interface AttributionChartSectionProps {
  sourceData: SourceData[];
  dailyRevenueData: { date: string; revenue: number }[];
  onSourceClick?: (source: string) => void;
}

export function AttributionChartSection({
  sourceData,
  dailyRevenueData,
  onSourceClick,
}: AttributionChartSectionProps) {
  const [showDetailedTable, setShowDetailedTable] = useState(false);

  const maxRevenue = Math.max(...sourceData.map((d) => d.revenue), 1);

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
    <div className="bg-white rounded-lg shadow-card border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Revenue Attribution</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visual breakdown of where your revenue comes from
          </p>
        </div>
      </div>

      {/* Three charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Donut Chart */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Revenue Distribution</h3>
          <DonutRevenueChart data={sourceData} onSegmentClick={onSourceClick} height={350} />
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversion Rate</h3>
          <ConversionBarChart data={sourceData} onBarClick={onSourceClick} height={350} />
        </div>

        {/* Trend Line */}
        <div className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Revenue Trend</h3>
          <RevenueTrendChart data={dailyRevenueData} height={350} />
        </div>
      </div>

      {/* Collapsible detailed table */}
      <div className="border-t border-gray-200 pt-4">
        <button
          onClick={() => setShowDetailedTable(!showDetailedTable)}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {showDetailedTable ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Detailed Table
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View Detailed Table
            </>
          )}
        </button>

        {showDetailedTable && (
          <div className="mt-4 animate-slideDown">
            <Table
              columns={columns}
              data={sourceData}
              sortKey="revenue"
              sortDirection="desc"
              onRowClick={onSourceClick ? (row) => onSourceClick(row.source) : undefined}
              emptyMessage="No revenue data yet. Once purchases start coming in, you'll see them here."
            />
          </div>
        )}
      </div>
    </div>
  );
}
