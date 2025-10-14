# Render Deployment Setup - Summary

## What Was Done

CourseSignal has been prepared for deployment to Render.com with a one-click Blueprint setup.

## Files Created/Modified

### 1. **render.yaml** - Automated Deployment Configuration
- Defines 3 services: backend API, frontend static site, PostgreSQL database
- Pre-configures environment variables with sensible defaults
- Auto-runs migrations on backend startup
- Builds tracking script during deployment

### 2. **RENDER_DEPLOYMENT.md** - Step-by-Step Deployment Guide
- Complete walkthrough for deploying to Render (30-45 minutes)
- Includes secret generation, environment configuration, and verification steps
- Covers OAuth setup, custom domains, and troubleshooting

### 3. **DEPLOYMENT_CHECKLIST.md** - Quick Reference Checklist
- Checkbox-style guide for deployment process
- Pre-deployment, deployment, and post-deployment sections
- Troubleshooting quick reference

### 4. **backend/.env.example** - Updated Environment Template
- All required and optional variables documented
- Generation instructions included
- Production-ready examples

### 5. **backend/package.json** - Added Production Scripts
- `build:production` - Builds backend + tracking script
- `start:production` - Runs migrations then starts server
- Ensures tracking script is copied to dist/public/

### 6. **backend/src/index.ts** - Tracking Script Serving
- Added static file serving for `/track.js`
- Serves compiled tracking script from `dist/public/`
- Fixed port default to 3002

### 7. **backend/src/db/connection.ts** - Fixed TypeScript Import
- Changed `import dotenv from 'dotenv'` to `import * as dotenv from 'dotenv'`
- Fixes compilation error for production builds

### 8. **.gitignore** - Updated for Production
- Added `.env.production` to prevent accidental commits
- Added `backend/.env` and `frontend/.env.production`

### 9. **README.md** - Updated Deployment Section
- Links to RENDER_DEPLOYMENT.md for quick start
- Links to DEPLOYMENT.md for alternative platforms

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Render.com                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (Static Site)                              │  │
│  │  - React + Vite build                                │  │
│  │  - URL: coursesignal-frontend.onrender.com           │  │
│  │  - Auto-deploys on git push                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ API Requests                     │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Backend API (Web Service)                           │  │
│  │  - Node.js + Express + TypeScript                    │  │
│  │  - URL: coursesignal-backend.onrender.com            │  │
│  │  - Serves tracking script at /track.js               │  │
│  │  - Runs migrations on startup                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           │ SQL Queries                      │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                 │  │
│  │  - coursesignal-postgres                             │  │
│  │  - 1GB free tier                                     │  │
│  │  - Automatic backups (paid plans)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Tracking Script
                              │ (loaded by customer sites)
                              ▼
                    ┌─────────────────────┐
                    │  Customer's Course  │
                    │  Site (Kajabi, etc) │
                    └─────────────────────┘
```

## How Deployment Works

### 1. Blueprint Deployment
When you deploy via Render Blueprint (`render.yaml`):
- Render reads `render.yaml`
- Creates PostgreSQL database
- Creates backend web service
- Creates frontend static site
- Links DATABASE_URL automatically
- Deploys all services concurrently

### 2. Build Process

**Backend:**
```bash
# Build command (from render.yaml)
cd backend && npm ci && npm run build && \
cd ../tracking-script && npm ci && npm run build && \
mkdir -p ../backend/dist/public && \
cp dist/track.js ../backend/dist/public/
```
- Installs backend dependencies
- Compiles TypeScript to `backend/dist/`
- Builds tracking script separately
- Copies tracking script to backend dist folder
- Result: Backend serves tracking script at `/track.js`

**Frontend:**
```bash
# Build command (from render.yaml)
cd frontend && npm ci && npm run build
```
- Installs frontend dependencies
- Builds React app to `frontend/dist/`
- Render serves static files from dist folder

### 3. Startup Process

**Backend startup:**
```bash
cd backend && npm run migrate && npm start
```
1. Runs database migrations (creates/updates tables)
2. Starts Express server on port 3002
3. Background jobs start (launch status updater)

## Environment Variables Required

### Critical (Must Set Before First Use)
- `JWT_SECRET` - For authentication tokens (generate with crypto)
- `ENCRYPTION_KEY` - For OAuth tokens (must be exactly 32 chars)

### Auto-Configured by Render
- `DATABASE_URL` - PostgreSQL connection string (from database service)
- `PORT` - Server port (Render sets automatically)
- `NODE_ENV` - Set to "production" in render.yaml

### Optional (Add When Needed)
- `KAJABI_CLIENT_ID`, `KAJABI_CLIENT_SECRET`, `KAJABI_WEBHOOK_SECRET`
- `TEACHABLE_CLIENT_ID`, `TEACHABLE_CLIENT_SECRET`, `TEACHABLE_WEBHOOK_SECRET`
- `SKOOL_WEBHOOK_SECRET`
- `OPENAI_API_KEY` (for AI recommendations)
- `SENDGRID_API_KEY` (for email features)

## Testing Your Deployment

### Quick Health Check
```bash
# Backend health
curl https://coursesignal-backend.onrender.com/health
# Should return: {"status":"ok","timestamp":"..."}

# Tracking script
curl https://coursesignal-backend.onrender.com/track.js
# Should return: JavaScript code

# Frontend
curl -I https://coursesignal-frontend.onrender.com
# Should return: 200 OK
```

### Complete Flow Test
1. Visit frontend URL
2. Sign up for account
3. Login
4. Navigate to Settings
5. Copy tracking script (should have production URLs)
6. Test script loads from backend

## Updating After Deployment

### Code Changes
- Push to GitHub `main` branch
- Render auto-deploys both frontend and backend
- Migrations run automatically on backend restart

### Environment Variable Changes
- Update in Render dashboard: Service → Environment
- Click "Save Changes" → triggers redeploy

### Database Migrations
- New migrations run automatically on backend startup
- Manual run: Dashboard → Backend → Shell → `npm run migrate`

## Cost Breakdown (Free Tier)

**What's Included Free:**
- Backend: 750 hours/month (enough for 24/7 with cold starts)
- Frontend: Unlimited bandwidth and builds
- PostgreSQL: 1GB storage, 100 connections
- SSL certificates: Automatic and free
- Custom domains: Unlimited

**Limitations on Free Tier:**
- Backend "spins down" after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 1GB database storage limit

**Upgrade to Paid ($7/month per service):**
- No cold starts (always-on)
- Faster performance
- More database storage (10GB on Standard)
- Priority support

## Next Steps

1. **Deploy to Render:**
   - Follow [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
   - Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) to track progress

2. **Configure OAuth:**
   - Create Kajabi/Teachable OAuth apps
   - Update redirect URIs with production URLs
   - Add credentials to environment variables

3. **Install Tracking Script:**
   - Get script from Settings page (production URL)
   - Install on Kajabi: Settings → Custom Code → Head Tracking Code
   - Test visitor tracking works

4. **Monitor & Optimize:**
   - Set up uptime monitoring (UptimeRobot)
   - Configure error tracking (Sentry)
   - Consider upgrading to paid tier to eliminate cold starts

## Rollback Procedure

If deployment fails:

1. **Via Render Dashboard:**
   - Navigate to: Service → Events
   - Click "Rollback" on previous successful deployment

2. **Via Git:**
   ```bash
   git revert HEAD
   git push origin main
   # Render auto-deploys previous version
   ```

3. **Database Rollback:**
   - CRITICAL: Test on staging first
   - Backup database before rollback
   - Manually reverse migrations if needed

## Support Resources

- **Render Deployment Guide:** [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- **General Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Architecture Guide:** [CLAUDE.md](./CLAUDE.md)

- **Render Documentation:** https://render.com/docs
- **Render Support:** https://dashboard.render.com/support

## Summary

CourseSignal is now **ready for one-click deployment to Render.com**. The entire setup takes 30-45 minutes following the deployment guide. After deployment, you'll have:

✅ Production-ready CourseSignal instance
✅ Tracking script accessible from your backend URL
✅ Auto-running database migrations
✅ Automatic SSL certificates
✅ Auto-deployment on git push
✅ Free tier with option to upgrade

**Your tracking script will work with Kajabi, Teachable, or any website** once you install it in the site's `<head>` section.
