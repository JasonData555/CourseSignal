import { Card } from '../design-system';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingBag } from 'lucide-react';

export interface Purchase {
  id: string;
  amount: number;
  courseName: string;
  source: string;
  purchasedAt: string;
  email: string;
}

interface RecentPurchasesProps {
  purchases: Purchase[];
}

export function RecentPurchases({ purchases }: RecentPurchasesProps) {
  if (purchases.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Purchases</h2>
        <Card className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No purchases yet. When students buy your courses, they'll appear here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Purchases</h2>
      <Card padding="none">
        <div className="divide-y divide-gray-100">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-gray-900">
                      ${purchase.amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600 truncate">
                      {purchase.email}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {purchase.courseName}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="capitalize bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                      {purchase.source}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(purchase.purchasedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
