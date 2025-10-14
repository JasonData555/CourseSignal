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

**Organized Directory Structure:**
The backend follows a modular, domain-driven structure for improved maintainability:

**Service Layer Pattern:**
- `services/` - Business logic isolated from routes
  - **Core Services:**
    - `attributionService.ts` - Core purchase attribution logic (matches purchases to visitors by email → device fingerprint)
    - `trackingService.ts` - Visitor/session tracking and storage
    - `analyticsService.ts` - Dashboard metrics and revenue calculations
    - `authService.ts` - User authentication, JWT token generation
    - `emailService.ts` - Email verification, password reset (SendGrid)
    - `recommendationService.ts` - AI-powered and rule-based recommendations
  - **`integrations/`** - Platform integration services
    - `kajabiService.ts` - Kajabi OAuth, webhooks, purchase sync
    - `teachableService.ts` - Teachable OAuth, webhooks, purchase sync
  - **`launches/`** - Launch tracking and analytics
    - `launchService.ts` - Launch CRUD, sharing, status management
    - `launchAnalyticsService.ts` - Launch metrics and comparison

**Routes Layer:**
- `routes/` - Express route handlers (thin layer that calls services)
  - **Core Routes:** `auth.ts`, `tracking.ts`, `script.ts`, `analytics.ts`, `recommendations.ts`
  - **`integrations/`** - Platform integration endpoints
    - `kajabi.ts` - Kajabi OAuth and sync endpoints
    - `teachable.ts` - Teachable OAuth and sync endpoints
    - `webhooks.ts` - Webhook receivers for all platforms
  - **`launches/`** - Launch-related endpoints
    - `launches.ts` - Launch CRUD and analytics endpoints
    - `public.ts` - Public endpoints (match rate stats, launch leaderboard, social proof)

**Shared Types:**
- `types/` - TypeScript interfaces and type definitions
  - `common.ts` - Shared interfaces (User, Visitor, Purchase, Launch, etc.)
  - `index.ts` - Central export for all types

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

### Kajabi & Teachable Flow (OAuth-based)
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

### Skool Flow (API Key + Webhook-based)
1. User enters API key from SkoolAPI.com or Skool settings
2. System validates API key and saves encrypted to `platform_integrations`
3. Webhook URL generated: `/api/webhooks/skool/:userId`
4. User copies webhook URL and configures in Skool/Zapier
5. Purchases tracked via webhook notifications (primary method)
6. Manual sync available as fallback (limited by Skool API capabilities)

**Integration Type:** API Key authentication (not OAuth)
**Purchase Tracking:** Webhook-driven (real-time) + Manual sync (fallback)
**Webhook Sources:** Skool's Zapier plugin, external payment processors (Stripe, CopeCart, SamCart)

**API Endpoints:**
- `POST /api/skool/connect` - Connect with API key
- `GET /api/skool/status` - Get connection status + webhook URL
- `POST /api/skool/sync` - Manual sync trigger
- `DELETE /api/skool/disconnect` - Disconnect integration
- `GET /api/skool/webhook-url` - Get webhook URL for configuration

**Webhook Endpoint:**
- `POST /api/webhooks/skool/:userId` - Receives purchase notifications

**Webhook Payload Format (flexible):**
```json
{
  "event_type": "purchase.completed | member.joined | payment.succeeded",
  "data": {
    "email": "user@example.com",
    "amount": 99.00,
    "currency": "USD",
    "community_name": "My Skool Community",
    "member_id": "12345",
    "purchased_at": "2025-01-15T12:00:00Z"
  }
}
```

**Configuration Notes:**
- Skool integration uses third-party SkoolAPI for programmatic access
- Webhook verification is optional (flexible for multiple sources)
- Custom tracking script requires Skool Pro plan (Plugins access)
- Alternative: Install tracking script on external landing pages/funnels

### Sync Jobs
Background purchase syncs tracked in `sync_jobs` table with status: pending → running → completed/failed.

## Environment Variables

**Backend (`.env`):**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/coursesignal
JWT_SECRET=your-secret
ENCRYPTION_KEY=32-character-key   # For encrypting OAuth tokens and API keys
KAJABI_CLIENT_ID=...
KAJABI_CLIENT_SECRET=...
KAJABI_WEBHOOK_SECRET=...
TEACHABLE_CLIENT_ID=...
TEACHABLE_CLIENT_SECRET=...
TEACHABLE_WEBHOOK_SECRET=...
SKOOL_API_BASE=https://api.skoolapi.com  # Optional, defaults to SkoolAPI
SKOOL_WEBHOOK_SECRET=...  # Optional, for webhook signature verification
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

When modifying platform integrations, maintain this structure:

### OAuth-based Platforms (Kajabi, Teachable)

1. **Service file** (`services/integrations/teachableService.ts`):
   - `getOAuthUrl(state)` - Generate OAuth authorization URL
   - `exchangeCodeForToken(code)` - Exchange auth code for tokens
   - `saveIntegration(userId, accessToken, refreshToken)` - Encrypt and store
   - `getIntegration(userId)` - Retrieve and decrypt tokens
   - `syncPurchases(userId)` - Fetch purchases from platform API
   - `handleWebhook(userId, event)` - Process webhook events
   - `verifyWebhookSignature(payload, signature)` - Verify webhook authenticity

2. **Route file** (`routes/integrations/teachable.ts`):
   - `GET /connect` - Initiate OAuth
   - `GET /callback` - Handle OAuth callback
   - `POST /sync` - Manual sync trigger
   - `GET /status` - Connection status
   - `DELETE /disconnect` - Disconnect integration

3. **Register route** in `backend/src/index.ts`:
   ```typescript
   app.use('/api/teachable', teachableRoutes);
   ```

4. **Update webhook handler** in `routes/integrations/webhooks.ts`

### API Key-based Platforms (Skool)

1. **Service file** (`services/integrations/skoolService.ts`):
   - `saveIntegration(userId, apiKey, communityId)` - Encrypt and store API key
   - `getIntegration(userId)` - Retrieve and decrypt API key
   - `getWebhookUrl(userId)` - Generate webhook URL for user to configure
   - `syncPurchases(userId)` - Manual sync (limited by API capabilities)
   - `handleWebhook(userId, event)` - Process webhook events (flexible format)
   - `verifyWebhookSignature(payload, signature)` - Optional verification
   - `testApiKey(apiKey)` - Validate API key before saving

2. **Route file** (`routes/integrations/skool.ts`):
   - `POST /connect` - Connect with API key (validates before saving)
   - `GET /webhook-url` - Get webhook URL for Skool/Zapier configuration
   - `POST /sync` - Manual sync trigger (fallback method)
   - `GET /status` - Connection status + webhook URL
   - `DELETE /disconnect` - Disconnect integration
   - `POST /test-api-key` - Test API key validity

3. **Register route** in `backend/src/index.ts`:
   ```typescript
   app.use('/api/skool', skoolRoutes);
   ```

4. **Update webhook handler** in `routes/integrations/webhooks.ts`:
   ```typescript
   router.post('/skool/:userId', async (req, res) => {
     // Flexible webhook handling for multiple sources
   });
   ```

## Key Files

- `backend/src/services/attributionService.ts` - Core attribution algorithm
- `backend/src/db/schema.sql` - Complete database schema
- `frontend/src/pages/Settings.tsx` - Platform integration UI with toggle between Kajabi/Teachable/Skool
- `tracking-script/src/index.ts` - Tracking script entry point
- `backend/src/db/seed.ts` - Database seeding script
- `backend/src/services/integrations/skoolService.ts` - Skool API key + webhook integration
- `backend/src/routes/integrations/skool.ts` - Skool API endpoints
- `IMPLEMENTATION_SUMMARY.md` - Recently completed Teachable integration details

## Current Status

**✅ Complete:**
- Backend API with auth, tracking, analytics
- Kajabi integration (OAuth, webhooks, sync)
- Teachable integration (OAuth, webhooks, sync)
- Skool integration (API key, webhooks, sync) - **NEW**
- Settings page with 3-platform toggle and detailed setup instructions
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
- **UUID v4 share tokens**: Secure, unguassable, 128-bit entropy
- **Public page no auth**: Enables viral sharing without friction

---

## AI-Powered Recommendations Feature

### Overview

CourseSignal features an intelligent recommendation engine that provides actionable insights based on revenue data. The system uses a hybrid approach: OpenAI GPT-4o-mini for contextual AI recommendations (when enabled), with automatic fallback to rule-based recommendations.

### Architecture

**Backend Components:**

1. **`backend/src/services/recommendationService.ts`** - Core recommendation engine
   - `getRecommendations()` - Main entry point with caching
   - `generateAIRecommendations()` - OpenAI-powered insights using GPT-4o-mini
   - `generateRuleBasedRecommendations()` - Fallback logic with hardcoded thresholds
   - `getUserAIPreference()` / `updateUserAIPreference()` - User preference management
   - In-memory cache with 1-hour TTL for AI recommendations, 15-minute TTL for rule-based

2. **`backend/src/routes/recommendations.ts`** - API endpoints
   ```
   POST   /api/recommendations/generate     - Generate recommendations with analytics data
   GET    /api/recommendations/preference   - Get user's AI preference
   PUT    /api/recommendations/preference   - Update AI preference (enable/disable)
   POST   /api/recommendations/clear-cache  - Clear recommendation cache
   ```

3. **Database Migration:** `010_add_ai_recommendations_preference.sql`
   - Adds `ai_recommendations_enabled` BOOLEAN column to `users` table (default: true)

**Frontend Components:**

1. **Settings Page** ([Settings.tsx](frontend/src/pages/Settings.tsx))
   - Toggle switch for AI recommendations
   - Visual indicator when API key not configured
   - Real-time preference updates with cache clearing

2. **Dashboard** ([Dashboard.tsx](frontend/src/pages/Dashboard.tsx))
   - Fetches recommendations via API
   - Shows "✨ AI-Powered" badge when using OpenAI
   - Loading state during recommendation generation
   - Automatic fallback to rule-based on API failure

### How It Works

**AI-Powered Mode (OpenAI):**
1. Frontend sends analytics data (summary + sources) to `/api/recommendations/generate`
2. Backend checks user's `ai_recommendations_enabled` preference
3. If enabled + API key present:
   - Constructs structured prompt with metrics, trends, and source breakdown
   - Calls GPT-4o-mini with `response_format: { type: 'json_object' }`
   - Validates and sanitizes AI response
   - Returns 3-5 prioritized recommendations
4. Response cached for 1 hour per user

**Rule-Based Fallback:**
- Triggered when: API key missing, user preference disabled, or OpenAI API fails
- Logic: Hardcoded thresholds for revenue trends, conversion rates, AOV changes
- Examples:
  - Revenue decline >10% → Warning
  - Conversion rate >5% → Opportunity
  - High traffic + low conversion → Improve landing page
- Cached for 15 minutes

**Recommendation Schema:**
```typescript
{
  id: string;
  type: 'opportunity' | 'warning' | 'insight';
  title: string;          // Max 60 chars
  description: string;    // Max 150 chars
  metric?: string;        // Optional highlight (e.g., "+$5,000")
  action?: string;        // Specific action step (max 100 chars)
  priority: 1-5;          // AI assigns priority, sorted by highest
}
```

### Setup & Configuration

**1. Install OpenAI Package:**
```bash
npm install openai --workspace=backend
```

**2. Add API Key to `.env`:**
```bash
OPENAI_API_KEY=sk-proj-...
```

**3. Run Database Migration:**
```bash
psql -d coursesignal -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_recommendations_enabled BOOLEAN DEFAULT true;"
```

**4. Restart Backend:**
```bash
npm run dev:backend
```

### Cost Optimization

**Model Choice:** GPT-4o-mini ($0.15 input / $0.60 output per 1M tokens)
- Average request: ~1,500 input tokens, ~500 output tokens
- Cost per recommendation: ~$0.0005 (5 cents per 100 requests)
- Expected monthly cost: $5-$20 for typical user base

**Caching Strategy:**
- 1-hour cache for AI recommendations (prevents repeated API calls)
- Cache invalidated when:
  - User changes date range
  - User changes source filter
  - User toggles AI preference
  - Manual cache clear via `/clear-cache`

**Fallback Benefits:**
- Zero cost when API unavailable
- Instant response (no API latency)
- Privacy-conscious users can disable AI entirely

### Testing AI Recommendations

**1. Test with seed data:**
```bash
npm run seed
# Navigate to http://localhost:5173/dashboard
# Recommendations will appear below revenue table
```

**2. Test API directly:**
```bash
# Get AI preference
curl http://localhost:3002/api/recommendations/preference \
  -H "Authorization: Bearer YOUR_TOKEN"

# Generate recommendations
curl -X POST http://localhost:3002/api/recommendations/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "summary": {
      "totalRevenue": 10000,
      "totalStudents": 50,
      "avgOrderValue": 200,
      "totalPurchases": 50,
      "trends": { "revenue": 15, "students": 10, "avgOrderValue": 5 }
    },
    "sources": [
      {
        "source": "google",
        "revenue": 5000,
        "visitors": 500,
        "students": 25,
        "conversionRate": "5.0",
        "avgOrderValue": "200.00",
        "revenuePerVisitor": "10.00"
      }
    ]
  }'

# Toggle AI preference
curl -X PUT http://localhost:3002/api/recommendations/preference \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

**3. Test without API key:**
- Remove `OPENAI_API_KEY` from `.env`
- Restart backend
- Dashboard will show rule-based recommendations (no "AI-Powered" badge)
- Settings page will show "Requires API Key" warning

### Example Prompt Sent to OpenAI

```
You are an expert revenue analytics advisor for course creators. Analyze the following data and provide 3-5 actionable recommendations.

METRICS SUMMARY:
- Total Revenue: $10,500.00
- Total Students: 45
- Average Order Value: $233.33
- Total Purchases: 45

TRENDS (vs previous period):
- Revenue: +18.5%
- Students: +12.0%
- AOV: +5.8%

TRAFFIC SOURCES:
- google:
  * Visitors: 320
  * Revenue: $6,200.00
  * Students: 28
  * Conversion Rate: 8.75%
  * Avg Order Value: $221.43
  * Revenue per Visitor: $19.38

- facebook:
  * Visitors: 180
  * Revenue: $3,100.00
  * Students: 12
  * Conversion Rate: 6.67%
  * Avg Order Value: $258.33
  * Revenue per Visitor: $17.22

[...]

Please provide 3-5 recommendations as JSON with priority, type (opportunity/warning/insight), title, description, optional metric, and action.
```

### Files Modified/Created

**Backend (5 files):**
- Created: `backend/src/services/recommendationService.ts` (350+ lines)
- Created: `backend/src/routes/recommendations.ts`
- Created: `backend/src/db/migrations/010_add_ai_recommendations_preference.sql`
- Modified: `backend/src/index.ts` (registered route)
- Modified: `backend/package.json` (added openai dependency)

**Frontend (2 files):**
- Modified: `frontend/src/pages/Dashboard.tsx` (AI integration + badge)
- Modified: `frontend/src/pages/Settings.tsx` (AI toggle UI)

### Future Enhancements

**Potential Improvements:**
- Batch recommendation generation for multiple users (reduce API costs)
- Personalized recommendations based on user history
- A/B testing: AI vs rule-based effectiveness
- Integration with launch tracking (launch-specific recommendations)
- Email digests with weekly AI insights
- Custom recommendation rules (user-defined thresholds)

**Advanced AI Features:**
- Multi-turn conversations ("Tell me more about Google Ads strategy")
- Predictive analytics ("You're on track to hit $50K this quarter")
- Anomaly detection ("Facebook conversion dropped 40% this week")
- Competitor benchmarking (via external data sources)
