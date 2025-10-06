# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CourseSignal is a revenue attribution analytics platform for course creators. It tracks visitor sessions via a lightweight JavaScript snippet, integrates with course platforms (Kajabi, Teachable) via OAuth/webhooks to import purchases, and attributes each purchase to marketing sources (first-touch and last-touch attribution).

**Tech Stack:** Node.js + TypeScript + Express + PostgreSQL (backend), React + TypeScript + Vite + Tailwind (frontend), Vanilla TypeScript tracking script.

## Development Commands

### Initial Setup
```bash
npm install                                    # Install all workspace dependencies
createdb coursesignal                          # Create PostgreSQL database
npm run migrate                                # Run database migrations
npm run build:tracking                         # Build tracking script (one-time)
```

### Development Workflow
```bash
npm run dev:backend                            # Start backend on port 3002
npm run dev:frontend                           # Start frontend on port 5173
npm run dev                                    # Run both backend & frontend concurrently

# Database utilities
npm run seed                                   # Seed database with realistic test data (80 visitors, 30-40 purchases)
npm run clear-data                             # Clear test data while preserving user accounts

# Individual workspace commands
npm run dev --workspace=backend
npm run build --workspace=tracking-script
npm run migrate --workspace=backend
```

### Testing
```bash
# Backend health check
curl http://localhost:3002/health

# Create test user
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## Architecture

### Monorepo Structure (npm workspaces)
- **backend/**: Express API server with TypeScript
- **frontend/**: React + Vite SPA with TypeScript
- **tracking-script/**: Standalone vanilla TypeScript library that compiles to a single JS file

### Backend Architecture

**Service Layer Pattern:**
- `services/` - Business logic isolated from routes
  - `attributionService.ts` - Core purchase attribution logic (matches purchases to visitors by email → device fingerprint)
  - `trackingService.ts` - Visitor/session tracking and storage
  - `kajabiService.ts` - Kajabi OAuth, webhooks, purchase sync
  - `teachableService.ts` - Teachable OAuth, webhooks, purchase sync
  - `analyticsService.ts` - Dashboard metrics and revenue calculations
  - `authService.ts` - User authentication, JWT token generation
  - `emailService.ts` - Email verification, password reset (SendGrid)

**Routes Layer:**
- `routes/` - Express route handlers (thin layer that calls services)
  - Each route file corresponds to an API namespace (`/api/auth`, `/api/kajabi`, etc.)

**Database:**
- Direct PostgreSQL queries via `pg` package (no ORM)
- Connection pooling in `db/connection.ts`
- Schema in `db/schema.sql`
- Migrations run via `db/migrate.ts`

**Key Tables:**
- `visitors` - Unique visitors with first-touch attribution stored in `first_touch_data` JSONB
- `sessions` - Individual sessions with UTM parameters
- `purchases` - Course purchases with both `first_touch_*` and `last_touch_*` fields
- `platform_integrations` - Encrypted OAuth tokens and webhook IDs

### Frontend Architecture

**State Management:**
- Zustand for global state (`stores/authStore.ts`)
- React Query (@tanstack/react-query) for server state caching

**Routing:**
- React Router v6 with protected routes
- `/login`, `/signup`, `/dashboard`, `/settings`, `/onboarding`

**API Client:**
- Axios instance in `lib/api.ts` with interceptors for auth tokens
- Base URL from `VITE_API_URL` env var

### Tracking Script

Compiled to `tracking-script/dist/track.js` and served at `/api/script/generate?siteId=X`.

**What it captures:**
- Visitor ID (localStorage + cookie, 2 year expiry)
- Session ID (30-min timeout)
- UTM parameters (source, medium, campaign, content, term)
- Referrer URL
- Landing page
- Device fingerprint (basic browser/OS data)

**Flow:**
1. First visit → Creates visitor ID, captures first-touch data
2. Subsequent visits → New session ID, updates last-touch data
3. All events POSTed to `/api/tracking/event`

### Attribution Logic

**Matching Priority (in `attributionService.ts`):**
1. Email match (primary) - Look up visitor by email from purchase
2. Device fingerprint + timing (fallback) - Match if within 24 hours
3. Mark as "unmatched" if no match found

**Attribution Models:**
- **First-Touch**: Credit to `visitors.first_touch_data` (JSONB)
- **Last-Touch**: Credit to most recent session before purchase
- Both stored on `purchases` table for fast queries

Target match rate: 85%+

## Platform Integrations

### Kajabi & Teachable Flow
1. User clicks "Connect" in Settings
2. OAuth redirect to platform (state token stored in `users.password_reset_token` temporarily)
3. Callback receives `code`, exchanges for access/refresh tokens
4. Tokens encrypted and stored in `platform_integrations` table
5. Webhook registered automatically
6. Background sync of last 30 days of purchases triggered
7. Ongoing webhooks for new purchases

**OAuth URLs:**
- Kajabi: `GET /api/kajabi/connect` → redirects to Kajabi OAuth
- Teachable: `GET /api/teachable/connect` → redirects to Teachable OAuth

**Webhook Endpoints:**
- `POST /api/webhooks/kajabi/:userId`
- `POST /api/webhooks/teachable/:userId`

### Sync Jobs
Background purchase syncs tracked in `sync_jobs` table with status: pending → running → completed/failed.

## Environment Variables

**Backend (`.env`):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/coursesignal
JWT_SECRET=your-secret
ENCRYPTION_KEY=32-character-key   # For encrypting OAuth tokens
KAJABI_CLIENT_ID=...
KAJABI_CLIENT_SECRET=...
TEACHABLE_CLIENT_ID=...
TEACHABLE_CLIENT_SECRET=...
APP_URL=http://localhost:5173
```

**Frontend (`.env`):**
```
VITE_API_URL=http://localhost:3002/api
```

## Database Seeding

The seed script (`npm run seed`) generates realistic test data:
- 80 visitors across 90 days
- Multiple traffic sources: Google (CPC), Facebook (social), Instagram, YouTube, Email, Direct
- 100-200 sessions (1-4 per visitor)
- 30-40 purchases ($49-$997 range, $5K-$15K total revenue)
- 85% matched, 15% unmatched
- Mix of Kajabi/Teachable platforms

Use this to test dashboard UX/UI with realistic metrics.

## Working with Services

When modifying platform integrations (Kajabi, Teachable), maintain this structure:

1. **Service file** (`services/teachableService.ts`):
   - `getOAuthUrl(state)` - Generate OAuth authorization URL
   - `exchangeCodeForToken(code)` - Exchange auth code for tokens
   - `saveIntegration(userId, accessToken, refreshToken)` - Encrypt and store
   - `getIntegration(userId)` - Retrieve and decrypt tokens
   - `syncPurchases(userId)` - Fetch purchases from platform API
   - `handleWebhook(userId, event)` - Process webhook events

2. **Route file** (`routes/teachable.ts`):
   - `GET /connect` - Initiate OAuth
   - `GET /callback` - Handle OAuth callback
   - `POST /sync` - Manual sync trigger
   - `GET /status` - Connection status
   - `DELETE /disconnect` - Disconnect integration

3. **Register route** in `backend/src/index.ts`:
   ```typescript
   app.use('/api/teachable', teachableRoutes);
   ```

4. **Update webhook handler** in `routes/webhooks.ts`

## Key Files

- `backend/src/services/attributionService.ts` - Core attribution algorithm
- `backend/src/db/schema.sql` - Complete database schema
- `frontend/src/pages/Settings.tsx` - Platform integration UI with toggle between Kajabi/Teachable
- `tracking-script/src/index.ts` - Tracking script entry point
- `backend/src/db/seed.ts` - Database seeding script
- `IMPLEMENTATION_SUMMARY.md` - Recently completed Teachable integration details

## Current Status

**✅ Complete:**
- Backend API with auth, tracking, analytics
- Kajabi integration (OAuth, webhooks, sync)
- Teachable integration (OAuth, webhooks, sync)
- Settings page with platform toggle and detailed setup instructions
- Database schema and migrations
- Tracking script
- Seed data system
- **Launch Tracking & Analysis** - Full feature for time-limited promotions
  - Create/manage launches with goals and date ranges
  - Real-time metrics and attribution tracking
  - Launch comparison analytics
  - Public shareable recap pages with viral "Made with CourseSignal" branding
  - Auto-assignment of purchases to active launches
- **Professional Design System** - Enterprise-grade UI transformation
  - Stripe-inspired professionalism with Plausible simplicity
  - 18 polished design system components
  - Enhanced navigation with context badges
  - Smart onboarding with WelcomeModal
  - Comprehensive UX improvements across all pages

**🚧 In Progress:**
- Stripe billing integration

## Common Tasks

**Add a new platform integration:**
1. Copy `services/kajabiService.ts` as template
2. Update API endpoints and data mapping
3. Create route file following same pattern
4. Register in `index.ts`
5. Update Settings.tsx to add platform option
6. Add webhook handler

**Modify attribution logic:**
- Edit `services/attributionService.ts`
- Key function: `attributePurchase(userId, purchase)`
- Returns: `{ purchaseId, status: 'matched' | 'unmatched', visitorId, firstTouch, lastTouch }`

**Add analytics endpoint:**
1. Create query in `services/analyticsService.ts`
2. Add route in `routes/analytics.ts`
3. Consume in frontend via React Query

**Test with real data:**
```bash
npm run seed              # Populate with test data
# View dashboard at http://localhost:5173/dashboard
npm run clear-data        # Reset when done
```

## Port Configuration

- Backend: 3002 (configurable via PORT env var)
- Frontend: 5173 (Vite default)
- PostgreSQL: 5432 (default)

Note: Backend was configured for 3002 because 3000/3001 were in use during initial setup.

---

## Design System & UI Architecture

CourseSignal features a professional, enterprise-grade design system that combines the sophistication of Stripe Dashboard, the clarity of Plausible Analytics, and the polish of Linear.

### Design Principles

- **Data is the hero** - Large, bold metrics with subtle supporting UI
- **Clarity over cleverness** - Instant comprehension beats visual flair
- **Fast and refined** - Snappy 150ms transitions, no jank
- **Professional, not corporate** - Approachable sophistication
- **Whitespace is a feature** - Generous spacing lets content breathe

### Color Palette

**Primary (Slate-Blue):** Professional, neutral-leaning palette (#475569)
- Replaced bright sky-blue with sophisticated slate for enterprise appeal
- Better contrast ratios for accessibility (WCAG AA compliant)

**Semantic Colors:**
- Success: #22c55e (revenue growth, high conversion)
- Warning: #f59e0b (underperforming channels)
- Danger: #ef4444 (failed integrations, critical issues)
- Info: #3b82f6 (neutral informational)

**Chart Colors:** 6-color palette for data visualization
- Indigo (#6366f1), Purple (#8b5cf6), Pink (#ec4899), Amber (#f59e0b), Emerald (#10b981), Cyan (#06b6d4)

### Typography

**Font Family:** System fonts for performance (SF Pro, Segoe UI)
- Sans: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- Mono: SF Mono, Monaco, Consolas (for code/data)

**Typography Scale:**
- **Metric Sizes:** 24px (sm), 32px (md), 42px (lg), 56px (xl) - Special sizes for data display
- **Headings:** 28px (page titles), 22px (sections), 19px (cards)
- **Body:** 15px (base), 13px (small), 11px (micro)
- **Letter Spacing:** Negative tracking on headings, positive on labels

### Component Library (18 Components)

**Core Components:**
- `MetricCard` - Large values (42px), uppercase labels, pill trends, subtle icons
- `Button` - Active press effects, 150ms transitions, 5 variants
- `Badge` - Status variants with pulse dots and ring borders
- `Card` - White surface with refined shadows
- `Table` - Clean design without zebra stripes, hover-only states

**Layout Components:**
- `Divider` - Plain and labeled section separators
- `Breadcrumbs` - Multi-level navigation and back links
- `EmptyState` - Contextual empty states with clear CTAs

**Data Components:**
- `DateRangeSelector` - Time period filtering
- `ProgressBar` - Goal tracking visualization
- `Skeleton` - Loading states for metrics and tables

**Feedback Components:**
- `Toast` - Success/error notifications
- `WelcomeModal` - First-time user onboarding

### Page-Level UX Enhancements

**Dashboard:**
- `QuickInsights` - Hero section with auto-generated actionable summaries
- Reorganized information hierarchy (Insights → Metrics → Attribution → Recommendations)
- Enhanced empty state with 3-step setup guide
- Discoverable date range selector with label

**Launches:**
- Pinned "Active Now" section with pulse indicator
- Enhanced launch cards with contextual data (days remaining, daily pace, winner badges)
- Status-specific information (upcoming countdown, active metrics, completion date)
- Educational empty state with launch type examples

**Settings:**
- Improved platform connection copy
- Test Installation button (one-click verification)
- Clear step-by-step instructions

**Navigation:**
- Active launch counter badge (green, real-time updates every 5 minutes)
- Faster transitions (150ms)
- Responsive labels (hidden on mobile)

### Interaction Design

**Transitions:**
- Fast: 100ms (instant feedback)
- Normal: 150ms (standard, Linear-style)
- Slow: 300ms (modals, drawers)

**Micro-interactions:**
- Button press: `active:scale-[0.98]` (tactile feedback)
- Card hover: Shadow elevation change
- Navigation links: Background color fade
- Table rows: Subtle background on hover

**Loading States:**
- Skeleton screens for initial loads
- Spinners for inline actions
- Pulse animation for real-time updates

### Accessibility

- WCAG AA contrast ratios (4.5:1 minimum)
- Color-blind safe chart palette
- Keyboard navigation support
- Focus states on all interactive elements
- Screen reader friendly empty states

### File Structure

**Design System Components:**
- `frontend/src/components/design-system/` - All reusable UI components
- `frontend/src/components/dashboard/` - Dashboard-specific components (QuickInsights, RevenueSummary, etc.)
- `frontend/src/components/launches/` - Launch-specific components (LaunchCard, LaunchStatusBadge, etc.)
- `frontend/src/components/onboarding/` - Onboarding flow components (WelcomeModal)
- `frontend/src/components/layouts/` - Page layouts and navigation

**Tailwind Configuration:**
- `frontend/tailwind.config.js` - Complete design token system
  - Colors, typography, spacing, shadows, transitions
  - Custom utilities: metric sizes, max-widths, border radius

### Implementation Stats

- **Total Files:** 29 files modified/created
- **Component Count:** 18 design system components
- **Pages Enhanced:** Dashboard, Launches, Settings, LaunchDashboard, LaunchComparison
- **Development Time:** ~18-22 hours across 3 sprints

---

## Launch Tracking & Analysis Feature

### Overview

The Launch feature allows course creators to track time-limited promotions (launches) with dedicated analytics, goal tracking, comparison tools, and shareable public recap pages.

### Database Schema

**Tables Created:**
- `launches` - Core launch data with status, goals, sharing settings, and cached metrics
- `launch_views` - Track views on public recap pages
- Modified `purchases` table - Added `launch_id` foreign key for explicit association

**Key Fields:**
- `status`: `upcoming`, `active`, `completed`, `archived` (auto-updated by background job)
- `share_enabled`, `share_token` - For public recap pages
- `cached_revenue`, `cached_students`, `cached_conversion_rate` - Performance optimization for completed launches

### Backend Architecture

**Services:**
1. `backend/src/services/launchService.ts` - CRUD operations, sharing, status management
   - `createLaunch()` - Creates launch and auto-assigns matching purchases
   - `enableShare()` - Generates UUID v4 share token (with optional password/expiration)
   - `updateAllLaunchStatuses()` - Called by background job every 5 minutes

2. `backend/src/services/launchAnalyticsService.ts` - Metrics, attribution, comparison
   - `getLaunchMetrics()` - Returns metrics with caching for completed launches
   - `getLaunchAttribution()` - Revenue breakdown by source
   - `compareLaunches()` - Side-by-side comparison (max 3)
   - `getPublicLaunchMetrics()` - Data for public recap pages

**Routes:** `backend/src/routes/launches.ts`
```
GET    /api/launches                    - List with pagination/filters
POST   /api/launches                    - Create new launch
GET    /api/launches/:id                - Get launch details
PUT    /api/launches/:id                - Update launch
DELETE /api/launches/:id                - Delete launch
POST   /api/launches/:id/archive        - Archive launch
POST   /api/launches/:id/duplicate      - Duplicate launch
GET    /api/launches/:id/analytics      - Get metrics + attribution + daily revenue
GET    /api/launches/:id/live-stats     - Real-time stats (no caching)
POST   /api/launches/:id/enable-share   - Enable public sharing
POST   /api/launches/:id/disable-share  - Disable sharing
GET    /api/launches/:id/views          - Get view count
POST   /api/launches/compare            - Compare multiple launches
GET    /api/public/launches/:shareToken - Public recap (NO AUTH REQUIRED)
```

**Background Jobs:**
- `backend/src/jobs/launchStatusUpdater.ts` - Runs every 5 minutes
  - Updates `upcoming → active` when start_date reached
  - Updates `active → completed` when end_date passed
  - Started automatically on server launch

**Attribution Integration:**
- Modified `backend/src/services/attributionService.ts:90-102`
- Automatically assigns new purchases to active launches by date range
- Priority: most recent launch if overlapping dates

### Frontend Components

**Design System Extensions:**
- `frontend/src/components/design-system/Badge.tsx` - Status indicators
- `frontend/src/components/design-system/ProgressBar.tsx` - Goal tracking

**Launch Components:** `frontend/src/components/launches/`
- `LaunchCard` - Grid item for list view
- `LaunchStatusBadge` - Color-coded status (upcoming=blue, active=green, completed=gray)
- `LaunchForm` - Create/edit form with validation
- `LaunchGoalProgress` - Progress bars for revenue/sales goals
- `LaunchTimeline` - Visual timeline with countdown timer

**Pages:**
1. `/launches` - List view with status filters, pagination
2. `/launches/new` - Create launch form
3. `/launches/:id` - Individual launch dashboard
   - Real-time metrics (30s polling for active launches)
   - Goal progress visualization
   - Attribution breakdown
   - Share settings panel
4. `/launches/compare?ids=id1,id2,id3` - Side-by-side comparison
5. `/public/launch/:shareToken` - **Public recap page (no auth)**
   - Branded with "Made with CourseSignal" footer
   - Social share buttons (Twitter, LinkedIn, Facebook)
   - CTA: "Analyze your next launch with CourseSignal"

**Navigation:**
- Added "Launches" link to main navigation (frontend/src/components/layouts/Navigation.tsx)
- Active state highlights when on any `/launches/*` route

### Key Features

**1. Auto-Assignment**
- New purchases automatically assigned to launches via date range
- Updates when launch dates change
- No manual intervention required

**2. Real-Time Metrics (Active Launches)**
- Frontend polls every 30 seconds
- No caching for active launches
- Ensures live data during promotion

**3. Performance Optimization (Completed Launches)**
- Metrics cached in database
- 1-hour cache TTL
- Avoids redundant calculations

**4. Public Sharing (Viral Growth)**
- UUID v4 share tokens (128-bit, secure)
- Optional password protection
- Optional expiration dates
- View tracking
- Social proof loop via "Made with CourseSignal" branding

**5. Comparison Analytics**
- Compare up to 3 launches
- Visual winners highlighted (highest revenue, conversion, etc.)
- Key insights section

### Testing

```bash
# Create test launch
curl -X POST http://localhost:3002/api/launches \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer 2024 Launch",
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-06-14T23:59:59Z",
    "revenue_goal": 10000,
    "sales_goal": 100
  }'

# Get launch analytics
curl http://localhost:3002/api/launches/{ID}/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Enable sharing
curl -X POST http://localhost:3002/api/launches/{ID}/enable-share \
  -H "Authorization: Bearer YOUR_TOKEN"

# View public recap (no auth)
curl http://localhost:3002/api/public/launches/{SHARE_TOKEN}
```

### Files Modified/Created

**Backend (13 files):**
- Created: `backend/src/services/launchService.ts`
- Created: `backend/src/services/launchAnalyticsService.ts`
- Created: `backend/src/jobs/launchStatusUpdater.ts`
- Created: `backend/src/routes/launches.ts`
- Created: `backend/src/db/migrations/006_create_launches.sql`
- Created: `backend/src/db/migrations/007_add_launch_id_to_purchases.sql`
- Created: `backend/src/db/migrations/008_create_launch_views.sql`
- Created: `backend/src/db/migrations/009_backfill_launch_purchases.sql`
- Modified: `backend/src/db/schema.sql` (added launch tables)
- Modified: `backend/src/services/attributionService.ts` (auto-assign to launches)
- Modified: `backend/src/index.ts` (registered routes + background job)
- Modified: `package.json` (added bcrypt dependency)
- Modified: `CLAUDE.md` (this file)

**Frontend (15 files):**
- Created: `frontend/src/components/design-system/Badge.tsx`
- Created: `frontend/src/components/design-system/ProgressBar.tsx`
- Created: `frontend/src/components/launches/LaunchCard.tsx`
- Created: `frontend/src/components/launches/LaunchStatusBadge.tsx`
- Created: `frontend/src/components/launches/LaunchForm.tsx`
- Created: `frontend/src/components/launches/LaunchGoalProgress.tsx`
- Created: `frontend/src/components/launches/LaunchTimeline.tsx`
- Created: `frontend/src/components/launches/index.ts`
- Created: `frontend/src/pages/Launches.tsx`
- Created: `frontend/src/pages/LaunchNew.tsx`
- Created: `frontend/src/pages/LaunchDashboard.tsx`
- Created: `frontend/src/pages/LaunchComparison.tsx`
- Created: `frontend/src/pages/PublicLaunchRecap.tsx`
- Modified: `frontend/src/App.tsx` (added routes)
- Modified: `frontend/src/components/layouts/Navigation.tsx` (added Launches link)
- Modified: `frontend/src/components/design-system/index.ts` (exported Badge, ProgressBar)

### Usage Example

1. **Create a launch:**
   - Navigate to `/launches` → Click "New Launch"
   - Enter title, dates, optional goals
   - Submit

2. **Monitor during launch:**
   - View real-time metrics on `/launches/:id`
   - Check attribution breakdown
   - Monitor goal progress

3. **Share results:**
   - Click "Enable Public Sharing"
   - Copy share link
   - Share on social media (includes "Made with CourseSignal" branding)

4. **Compare performance:**
   - Navigate to `/launches/compare?ids=id1,id2,id3`
   - Analyze which launch performed best

### Architecture Decisions

- **Explicit `launch_id` FK**: Direct relationship for performance (vs. dynamic date queries)
- **Background job for status**: Runs every 5 minutes, ensures consistency
- **Hybrid caching**: Active launches real-time, completed launches cached
- **2 services not 3**: Consolidated sharing logic into launchService
- **UUID v4 share tokens**: Secure, unguessable, 128-bit entropy
- **Public page no auth**: Enables viral sharing without friction
