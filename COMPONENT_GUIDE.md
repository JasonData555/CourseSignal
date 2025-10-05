# CourseSignal Component Guide

## Component Hierarchy

```
App
├── Login
├── Signup
├── VerifyEmail
├── Onboarding
└── PrivateRoute
    ├── Dashboard
    │   └── DashboardLayout
    │       ├── Navigation
    │       └── Main Content
    │           ├── DateRangeSelector
    │           ├── Export Button
    │           ├── RevenueSummary
    │           │   └── 4x MetricCard
    │           ├── SmartRecommendations
    │           │   └── Card (with recommendations)
    │           ├── RevenueBySource
    │           │   └── Table
    │           └── RecentPurchases
    │               └── Card (with purchase list)
    ├── Settings
    │   └── DashboardLayout
    │       └── Settings Cards
    └── Account
        └── DashboardLayout
            └── Account Cards
```

## Design System Components

### Primitives

#### Card
```tsx
<Card padding="md" hover={false}>
  {children}
</Card>
```
**Props:**
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hover`: boolean - adds hover shadow effect
- `className`: additional Tailwind classes

#### Button
```tsx
<Button
  variant="primary"
  size="md"
  fullWidth={false}
  loading={false}
  onClick={handleClick}
>
  Click me
</Button>
```
**Variants:** primary, secondary, danger, success, ghost
**Sizes:** sm, md, lg

#### MetricCard
```tsx
<MetricCard
  label="Total Revenue"
  value={25000}
  format="currency"
  trend={15.3}
  trendLabel="vs last period"
  icon={<DollarSign />}
/>
```
**Formats:** number, currency, percentage

#### Table
```tsx
<Table
  columns={columns}
  data={data}
  sortKey="revenue"
  sortDirection="desc"
  onSort={handleSort}
  onRowClick={handleRowClick}
/>
```

#### EmptyState
```tsx
<EmptyState
  icon={<Database />}
  title="No data yet"
  description="Connect your platform to see data"
  action={{
    label: "Go to Settings",
    onClick: navigateToSettings
  }}
  progress={{
    current: 23,
    total: 47,
    label: "Syncing purchases"
  }}
/>
```

#### Skeleton Components
```tsx
<Skeleton variant="text" width="60%" />
<MetricCardSkeleton />
<TableSkeleton rows={5} />
```

#### Toast
```tsx
<Toast
  type="success"
  message="Connected successfully!"
  onClose={handleClose}
  autoClose={true}
  duration={3000}
/>
```
**Types:** success, error, warning, info

#### DateRangeSelector
```tsx
<DateRangeSelector
  value={dateRange}
  onChange={setDateRange}
/>
```
**Values:** '7d', '30d', '90d', 'all'

### Layouts

#### DashboardLayout
```tsx
<DashboardLayout>
  {/* Page content */}
</DashboardLayout>
```
Provides:
- Sticky navigation header
- Max-width container
- Consistent padding
- Background color

#### Navigation
Automatically included in `DashboardLayout`
- Logo and brand
- Active state indicators
- User menu
- Responsive design

## Dashboard-Specific Components

### RevenueSummary
```tsx
<RevenueSummary data={summaryData} />
```
**Data structure:**
```typescript
{
  totalRevenue: number;
  totalStudents: number;
  avgOrderValue: number;
  totalPurchases: number;
  trends: {
    revenue: number;
    students: number;
    avgOrderValue: number;
  };
}
```

### RevenueBySource
```tsx
<RevenueBySource
  data={sourceData}
  onDrillDown={(source) => console.log(source)}
/>
```
**Data structure:**
```typescript
{
  source: string;
  visitors: number;
  revenue: number;
  students: number;
  conversionRate: string;
  avgOrderValue: string;
  revenuePerVisitor: string;
}[]
```

### RecentPurchases
```tsx
<RecentPurchases purchases={purchases} />
```
**Data structure:**
```typescript
{
  id: string;
  amount: number;
  courseName: string;
  source: string;
  purchasedAt: string;
  email: string;
}[]
```

### SmartRecommendations
```tsx
<SmartRecommendations recommendations={recommendations} />
```
**Data structure:**
```typescript
{
  id: string;
  type: 'opportunity' | 'warning' | 'insight';
  title: string;
  description: string;
  metric?: string;
  action?: string;
}[]
```

## Usage Examples

### Creating a new dashboard-style page

```tsx
import { DashboardLayout } from '../components/layouts';
import { Card, Button, MetricCard } from '../components/design-system';

export default function MyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Page</h1>
          <Button variant="primary">Action</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Metric 1"
            value={1234}
            format="number"
          />
          {/* More metrics... */}
        </div>

        <Card>
          {/* Card content */}
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

### Adding a new metric to the dashboard

1. Update the API response in `backend/src/services/analyticsService.ts`
2. Update the `SummaryData` interface in `Dashboard.tsx`
3. Add a new `MetricCard` to the `RevenueSummary` component

```tsx
<MetricCard
  label="New Metric"
  value={data.newMetric}
  format="number"
  trend={data.trends.newMetric}
  icon={<YourIcon />}
/>
```

### Adding a new recommendation type

In `Dashboard.tsx`, update the `generateRecommendations` function:

```typescript
// Check for your condition
if (condition) {
  recs.push({
    id: 'unique-id',
    type: 'opportunity', // or 'warning' or 'insight'
    title: 'Your Title',
    description: 'Detailed explanation',
    metric: 'Optional metric display',
    action: 'Suggested next step',
  });
}
```

## Styling Guidelines

### Spacing
Use Tailwind's spacing scale with generous whitespace:
- `space-y-8`: Vertical sections
- `gap-6`: Grid gaps
- `mb-4`: Section headings
- `p-6`: Card padding (or use Card component's padding prop)

### Colors
Always use semantic colors from the design system:
- `text-gray-900`: Primary text
- `text-gray-600`: Secondary text
- `text-gray-500`: Tertiary text
- `text-primary-600`: Interactive elements
- `text-success-600`: Positive metrics
- `text-warning-600`: Warning states
- `text-danger-600`: Error states

### Typography
- `text-3xl font-bold`: Page titles (h1)
- `text-xl font-bold`: Section headings (h2)
- `text-base`: Body text
- `text-sm`: Secondary information
- `text-xs`: Tertiary information

### Responsive Design
Always use responsive variants:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 4 columns */}
</div>
```

## State Management

### UI State (Zustand)
For global UI state like auth:
```typescript
const { user, isAuthenticated, logout } = useAuthStore();
```

### Server State (React Query)
For API data (future enhancement):
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['summary', dateRange],
  queryFn: () => api.get(`/analytics/summary?range=${dateRange}`)
});
```

### Local State (useState)
For component-specific state:
```typescript
const [dateRange, setDateRange] = useState<DateRange>('30d');
```

## API Integration

All API calls use the centralized `api` instance:

```typescript
import api from '../lib/api';

// GET request
const response = await api.get('/analytics/summary?range=30d');

// POST request
await api.post('/kajabi/connect', { apiKey });

// File download
const response = await api.get('/analytics/export', {
  responseType: 'blob'
});
```

## Common Patterns

### Loading States
```tsx
if (loading) {
  return (
    <DashboardLayout>
      <MetricCardSkeleton />
      <TableSkeleton />
    </DashboardLayout>
  );
}
```

### Empty States
```tsx
if (data.length === 0) {
  return (
    <EmptyState
      title="No data"
      description="Helpful message"
      action={{ label: "Action", onClick: handler }}
    />
  );
}
```

### Error Handling
```tsx
{error && (
  <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
    <p className="text-sm text-danger-700">{error}</p>
  </div>
)}
```

### Success Messages
```tsx
{success && (
  <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
    <p className="text-sm text-success-700">{success}</p>
  </div>
)}
```

## Best Practices

1. **Always use design system components** - don't recreate primitives
2. **Keep components focused** - single responsibility
3. **Use TypeScript interfaces** - for all data structures
4. **Mobile-first responsive** - test on small screens
5. **Accessibility** - semantic HTML, ARIA labels
6. **Course creator language** - use domain-specific terms
7. **Helpful empty states** - never show blank screens
8. **Specific error messages** - be helpful, not generic
9. **Bold the numbers** - they're the hero
10. **Action-oriented** - every insight suggests next steps
