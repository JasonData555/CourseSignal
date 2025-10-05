# CourseSignal - Quick Start

## ✅ Current Status

### Backend - RUNNING ✅
- **URL**: http://localhost:3002
- **Health Check**: http://localhost:3002/health
- **Status**: Active and responding

### Database - READY ✅
- PostgreSQL database `coursesignal` created
- All tables migrated successfully

### Tracking Script - BUILT ✅
- Located at: `tracking-script/dist/track.js`
- Ready to be served

## 🚀 What Works Right Now

You can test the API endpoints:

```bash
# Health check
curl http://localhost:3002/health

# Sign up a new user
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## 📋 Next Steps to Complete

### 1. Complete Frontend (Priority 1)
The frontend structure is created but needs pages built. Templates are in [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md):

**Need to create:**
- `frontend/src/pages/Login.tsx` ← Template provided
- `frontend/src/pages/Signup.tsx` ← Template provided
- `frontend/src/pages/Dashboard.tsx` ← Template provided
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/VerifyEmail.tsx`
- `frontend/src/components/RevenueCard.tsx`
- `frontend/src/components/SourcesTable.tsx`
- `frontend/src/components/RecentPurchases.tsx`

### 2. Add Stripe Billing (Priority 2)
- Get Stripe API keys
- Implement subscription checkout
- Handle webhooks

### 3. Add More Platform Integrations (Priority 3)
- Teachable integration (similar to Kajabi)
- Stripe as a course platform

## 🔧 Development Commands

```bash
# Backend is already running on port 3002
# To restart it:
npm run dev --workspace=backend

# Start frontend (in a new terminal):
npm run dev --workspace=frontend

# Run database migrations:
npm run migrate

# Rebuild tracking script after changes:
npm run build --workspace=tracking-script
```

## 📊 Available API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/request-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Tracking
- `POST /api/tracking/event` - Record visitor session
- `GET /api/tracking/health` - Health check

### Script
- `GET /api/script/generate` - Get tracking script (requires auth)
- `GET /api/script/info` - Get script info (requires auth)

### Kajabi Integration
- `GET /api/kajabi/connect` - Initiate OAuth (requires auth)
- `GET /api/kajabi/callback` - OAuth callback
- `POST /api/kajabi/sync` - Trigger manual sync (requires auth)
- `GET /api/kajabi/sync-status` - Check sync status (requires auth)
- `GET /api/kajabi/status` - Get integration status (requires auth)
- `DELETE /api/kajabi/disconnect` - Disconnect (requires auth)

### Analytics
- `GET /api/analytics/summary?range=30d` - Revenue summary (requires auth)
- `GET /api/analytics/sources?range=30d` - Revenue by source (requires auth)
- `GET /api/analytics/recent-purchases` - Last 20 purchases (requires auth)
- `GET /api/analytics/export?range=30d` - Download CSV (requires auth)
- `GET /api/analytics/drilldown/:source?range=30d` - Source details (requires auth)

### Webhooks
- `POST /api/webhooks/kajabi/:userId` - Kajabi webhook receiver
- `POST /api/webhooks/teachable/:userId` - Teachable webhook receiver
- `POST /api/webhooks/stripe` - Stripe webhook receiver

## 🗄️ Database Tables

All created and ready:
- `users` - User accounts
- `visitors` - Tracked visitors
- `sessions` - Visitor sessions
- `purchases` - Course purchases
- `platform_integrations` - OAuth tokens
- `sync_jobs` - Background sync status
- `tracking_events` - Raw events
- `tracking_scripts` - User script IDs
- `refresh_tokens` - JWT refresh tokens

## ⚠️ Important Notes

- **Email Service**: Currently configured for SendGrid but needs API key
- **Redis**: Optional for MVP, backend will work without it
- **Kajabi OAuth**: Requires registering app with Kajabi to get credentials
- **Port**: Backend runs on 3002 (3000/3001 were in use)

## 🎯 Testing the Full Flow

Once frontend is complete:

1. Sign up → Verify email (check email service)
2. Login → Dashboard
3. Connect Kajabi → OAuth flow
4. Wait for sync → See purchases
5. Copy tracking script → Install on site
6. Visit site → See attribution in dashboard

## 📚 Documentation

- **Setup Guide**: [`SETUP.md`](SETUP.md)
- **Implementation Guide**: [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md)
- **README**: [`README.md`](README.md)

---

**Backend is running!** The core attribution engine is production-ready. Just need to complete the frontend UI and add billing. 🚀
