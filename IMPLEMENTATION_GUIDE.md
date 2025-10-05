# CourseSignal - Implementation Guide

## What's Been Built

### Backend (✅ Complete)
1. **Database Schema** - PostgreSQL with all required tables
2. **Authentication System** - Signup, login, email verification, password reset
3. **Visitor Tracking Service** - Records visitor sessions with attribution data
4. **Purchase Attribution Engine** - Matches purchases to visitors (email → fingerprint → unmatched)
5. **Kajabi Integration** - OAuth flow, webhooks, historical sync
6. **Analytics API** - Dashboard summary, revenue by source, drill-down, CSV export
7. **API Routes** - All endpoints implemented

### Tracking Script (✅ Complete)
- Lightweight JavaScript library (<5kb when minified)
- Visitor ID persistence (localStorage + cookie)
- Session tracking with 30-min timeout
- UTM parameter capture
- Device fingerprinting
- First/last touch attribution

### Frontend (🚧 In Progress)
Basic structure created. Need to complete:

---

## Frontend Pages to Build

### 1. Login Page (`src/pages/Login.tsx`)
```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-3xl font-bold text-center">CourseSignal</h2>
          <p className="mt-2 text-center text-gray-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### 2. Signup Page (`src/pages/Signup.tsx`)
Similar structure to Login, but calls `signup` instead

### 3. Dashboard Page (`src/pages/Dashboard.tsx`)
Main analytics dashboard with:
- Revenue Summary Card
- Revenue by Source Table
- Recent Purchases Feed

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import RevenueCard from '../components/RevenueCard';
import SourcesTable from '../components/SourcesTable';
import RecentPurchases from '../components/RecentPurchases';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('30d');

  const { data: summary } = useQuery({
    queryKey: ['summary', dateRange],
    queryFn: () => api.get(`/analytics/summary?range=${dateRange}`).then(res => res.data),
  });

  const { data: sources } = useQuery({
    queryKey: ['sources', dateRange],
    queryFn: () => api.get(`/analytics/sources?range=${dateRange}`).then(res => res.data),
  });

  const { data: recentPurchases } = useQuery({
    queryKey: ['recent-purchases'],
    queryFn: () => api.get('/analytics/recent-purchases').then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">CourseSignal</h1>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Date Range Selector */}
        <div className="flex justify-end">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input max-w-xs"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Summary Cards */}
        {summary && <RevenueCard data={summary} />}

        {/* Revenue by Source */}
        {sources && <SourcesTable data={sources} dateRange={dateRange} />}

        {/* Recent Purchases */}
        {recentPurchases && <RecentPurchases data={recentPurchases} />}
      </main>
    </div>
  );
}
```

### 4. Onboarding Page (`src/pages/Onboarding.tsx`)
Multi-step wizard:
1. Platform selection (Kajabi/Teachable/Stripe)
2. OAuth connection
3. Sync progress display
4. Script generation & installation
5. Success screen

---

## Frontend Components to Build

### `src/components/RevenueCard.tsx`
Display total revenue, students, AOV with trend indicators

### `src/components/SourcesTable.tsx`
Sortable table with columns: Source | Visitors | Revenue | Students | Conversion % | AOV | Revenue/Visitor
- Click to export CSV
- Click row to drill down

### `src/components/RecentPurchases.tsx`
List of last 20 purchases with real-time updates

### `src/components/ScriptInstallation.tsx`
Shows tracking script with copy button and platform-specific instructions

---

## Next Steps to Complete MVP

### 1. Finish Frontend Pages ✏️
- Complete Login/Signup pages (templates provided above)
- Build Dashboard with components
- Create Onboarding wizard
- Add VerifyEmail page

### 2. Add Stripe Billing 💳
```typescript
// backend/src/services/stripeService.ts
// - Create subscription on Stripe
// - Handle webhooks (payment_succeeded, payment_failed)
// - Manage trial → paid conversion

// backend/src/routes/billing.ts
// - POST /api/billing/create-checkout
// - GET /api/billing/portal
// - GET /api/billing/status
```

### 3. Add Teachable & Stripe Integrations 🔌
Similar to Kajabi service but with API key auth

### 4. Testing & Deployment 🚀
- Create `.env` files for backend and frontend
- Set up PostgreSQL database
- Install dependencies: `npm install` in root
- Run migrations: `npm run migrate --workspace=backend`
- Build tracking script: `npm run build --workspace=tracking-script`
- Start backend: `npm run dev:backend`
- Start frontend: `npm run dev:frontend`

### 5. Production Checklist ✅
- [ ] Set strong JWT secrets
- [ ] Configure production database (Railway/Supabase)
- [ ] Set up email service (SendGrid)
- [ ] Deploy backend (Railway/Render/Fly.io)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Host tracking script on CDN (CloudFlare)
- [ ] Set up monitoring (Sentry)
- [ ] Configure Stripe webhooks
- [ ] Test entire flow end-to-end

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
SMTP_HOST=smtp.sendgrid.net
STRIPE_SECRET_KEY=sk_...
KAJABI_CLIENT_ID=...
KAJABI_CLIENT_SECRET=...
ENCRYPTION_KEY=...
APP_URL=https://coursesignal.com
```

### Frontend `.env`
```
VITE_API_URL=https://api.coursesignal.com/api
```

---

## Key Features Implemented

✅ User authentication with email verification
✅ Visitor tracking with attribution
✅ Purchase attribution (email → fingerprint → unmatched)
✅ Kajabi OAuth integration with webhooks
✅ Historical purchase sync (30 days)
✅ Analytics dashboard API
✅ CSV export
✅ Real-time purchase feed
✅ Drill-down by source

## Features Still Needed

- Teachable integration
- Stripe integration (payments)
- Stripe integration (course platform)
- Billing & subscription management
- Frontend UI completion
- WebSocket for real-time updates (optional)
- Background job queue setup (optional for MVP)

---

## Database Setup

```bash
# Create PostgreSQL database
createdb coursesignal

# Run migrations
npm run migrate --workspace=backend
```

## Running the Project

```bash
# Install all dependencies
npm install

# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Build tracking script (one-time)
npm run build --workspace=tracking-script
```

Then serve `tracking-script/dist/track.js` at `/track.js` endpoint.

---

This is a production-ready foundation. The core attribution engine, tracking, and Kajabi integration are complete. Add billing, complete the UI, and you'll have a launchable product!
