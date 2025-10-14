# Render Deployment Guide

Complete guide for deploying CourseSignal to Render.com

## Overview

This guide will walk you through deploying CourseSignal using Render's Blueprint feature, which automatically provisions all services from the `render.yaml` file.

**Services Created:**
- Backend API (Node.js web service)
- Frontend (Static site)
- PostgreSQL database

**Estimated Time:** 30-45 minutes

---

## Prerequisites

1. **GitHub Account** with your CourseSignal repository
2. **Render Account** (sign up at https://render.com)
3. **OAuth Credentials** (optional, can be added later):
   - Kajabi Client ID and Secret
   - Teachable Client ID and Secret
4. **SendGrid API Key** (optional, for email features)
5. **OpenAI API Key** (optional, for AI recommendations)

---

## Step 1: Prepare Your Repository

Ensure your repository is pushed to GitHub:

```bash
# From your CourseSignal directory
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

**Verify these files exist:**
- `render.yaml` (deployment configuration)
- `backend/.env.example` (environment variable template)
- `frontend/.env` (frontend configuration)

---

## Step 2: Create Render Account & Connect GitHub

1. **Sign up at https://render.com**
2. **Connect GitHub:**
   - Dashboard → Account Settings → Connect Accounts
   - Authorize Render to access your repositories
   - Select your CourseSignal repository

---

## Step 3: Deploy via Blueprint

1. **Navigate to:** https://dashboard.render.com/blueprints
2. **Click "New Blueprint"**
3. **Select your CourseSignal repository**
4. **Render will automatically detect `render.yaml`**
5. **Click "Apply"** - Render will begin provisioning:
   - PostgreSQL database (coursesignal-postgres)
   - Backend API (coursesignal-backend)
   - Frontend static site (coursesignal-frontend)

**This will take 5-10 minutes.** ⏱️

---

## Step 4: Generate Security Secrets

While services are provisioning, generate required secrets:

```bash
# Generate JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output (128 characters)

# Generate ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Copy output (32 characters)
```

**Save these values** - you'll need them in the next step.

---

## Step 5: Configure Environment Variables

Once services are created:

### Backend Environment Variables

1. **Go to:** Dashboard → coursesignal-backend → Environment
2. **Add/Update these variables:**

**Required (Core Functionality):**
```bash
JWT_SECRET=<paste-generated-secret-from-step-4>
ENCRYPTION_KEY=<paste-32-char-key-from-step-4>
```

**Optional (Platform Integrations):**
```bash
# Kajabi Integration
KAJABI_CLIENT_ID=your-kajabi-client-id
KAJABI_CLIENT_SECRET=your-kajabi-client-secret
KAJABI_WEBHOOK_SECRET=your-kajabi-webhook-secret

# Teachable Integration
TEACHABLE_CLIENT_ID=your-teachable-client-id
TEACHABLE_CLIENT_SECRET=your-teachable-client-secret
TEACHABLE_WEBHOOK_SECRET=your-teachable-webhook-secret

# Skool Integration
SKOOL_WEBHOOK_SECRET=your-skool-webhook-secret

# AI Recommendations
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Email (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key
```

**Update APP_URL:**
```bash
APP_URL=https://coursesignal-frontend.onrender.com
```
*(Or your custom domain once configured)*

3. **Click "Save Changes"**
4. **Backend will automatically redeploy** (takes 2-3 minutes)

### Frontend Environment Variables

1. **Go to:** Dashboard → coursesignal-frontend → Environment
2. **Update:**
```bash
VITE_API_URL=https://coursesignal-backend.onrender.com/api
```
*(Or your custom backend domain)*

3. **Click "Save Changes"**
4. **Frontend will rebuild** (takes 1-2 minutes)

---

## Step 6: Run Database Migrations

After backend deployment completes:

1. **Go to:** Dashboard → coursesignal-backend
2. **Click "Shell" tab** (opens web terminal)
3. **Run migrations:**
```bash
npm run migrate
```

**Expected output:**
```
Running migrations...
✅ 001_initial_schema.sql
✅ 002_platform_integrations.sql
✅ 003_tracking_events.sql
✅ 004_refresh_tokens.sql
✅ 005_sync_jobs.sql
✅ 006_create_launches.sql
✅ 007_add_launch_id_to_purchases.sql
✅ 008_create_launch_views.sql
✅ 009_backfill_launch_purchases.sql
✅ 010_add_ai_recommendations_preference.sql
All migrations completed!
```

4. **Close shell**

---

## Step 7: Verify Deployment

### Backend Health Check

```bash
curl https://coursesignal-backend.onrender.com/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2024-10-08T..."}
```

### Frontend Access

Open your browser: `https://coursesignal-frontend.onrender.com`

**You should see:** CourseSignal landing page

### Test Complete Flow

1. **Sign up:** Create a new account
2. **Login:** Verify authentication works
3. **Dashboard:** Should display (empty state)
4. **Settings:** Navigate to Settings page
5. **Tracking Script:** Verify script generation works

---

## Step 8: Get Your Tracking Script

1. **Login to CourseSignal** (your deployed instance)
2. **Navigate to Settings**
3. **Scroll to "Installation" section**
4. **Copy the tracking script**

**The script will reference your production URL:**
```html
<script>
(function() {
  var scriptId = 'your-unique-script-id';
  var apiUrl = 'https://coursesignal-backend.onrender.com/api/tracking/event';
  ...
</script>
```

5. **Install on Kajabi:**
   - Kajabi Settings → Custom Code → Head Tracking Code
   - Paste script
   - Save

---

## Step 9: Configure Custom Domains (Optional)

### Backend Custom Domain

1. **Go to:** Dashboard → coursesignal-backend → Settings
2. **Click "Add Custom Domain"**
3. **Enter:** `api.yourdomain.com`
4. **Add DNS records** (provided by Render):
   ```
   Type: CNAME
   Name: api
   Value: coursesignal-backend.onrender.com
   ```
5. **Wait for SSL provisioning** (5-10 minutes)
6. **Update environment variables:**
   - Backend: `APP_URL=https://api.yourdomain.com`
   - Frontend: `VITE_API_URL=https://api.yourdomain.com/api`

### Frontend Custom Domain

1. **Go to:** Dashboard → coursesignal-frontend → Settings
2. **Click "Add Custom Domain"**
3. **Enter:** `app.yourdomain.com`
4. **Add DNS records:**
   ```
   Type: CNAME
   Name: app
   Value: coursesignal-frontend.onrender.com
   ```
5. **Wait for SSL provisioning**

---

## Step 10: Configure OAuth Redirect URIs

Once you have your production URL (Render domain or custom):

### Update Kajabi OAuth App

1. **Go to:** Kajabi Partner Portal
2. **Edit your OAuth app**
3. **Set Redirect URI:**
   ```
   https://coursesignal-backend.onrender.com/api/kajabi/callback
   ```
   *(Or `https://api.yourdomain.com/api/kajabi/callback` if using custom domain)*
4. **Save**

### Update Teachable OAuth App

1. **Go to:** Teachable Developers Portal
2. **Edit your OAuth app**
3. **Set Redirect URI:**
   ```
   https://coursesignal-backend.onrender.com/api/teachable/callback
   ```
4. **Save**

---

## Troubleshooting

### Backend Won't Start

**Check Logs:**
1. Dashboard → coursesignal-backend → Logs
2. Look for errors related to:
   - Missing environment variables
   - Database connection failures
   - TypeScript compilation errors

**Common Issues:**
- **Missing JWT_SECRET:** Add in Environment variables
- **Missing ENCRYPTION_KEY:** Must be exactly 32 characters
- **Database connection timeout:** Verify coursesignal-postgres is running

### Frontend Shows Blank Page

**Check Browser Console:**
1. Open DevTools (F12)
2. Look for:
   - CORS errors → Check `VITE_API_URL` is correct
   - Network errors → Verify backend is running
   - 404 errors → Check routing configuration

**Common Issues:**
- **CORS errors:** Update backend `APP_URL` to match frontend URL
- **API calls failing:** Verify `VITE_API_URL` points to backend

### Database Migrations Failed

**Re-run migrations:**
1. Dashboard → coursesignal-backend → Shell
2. Run:
```bash
psql $DATABASE_URL
\dt  # List tables
\q   # Exit

# Re-run migrations
npm run migrate
```

### Tracking Script 404

**Check these:**
1. Verify tracking script was built during deployment
2. Backend logs should show: `Tracking script served from /track.js`
3. Test URL: `https://coursesignal-backend.onrender.com/track.js`

**If missing:**
1. Trigger manual redeploy: Dashboard → coursesignal-backend → Manual Deploy
2. Check build logs for errors

---

## Cost Estimate (Render Free Tier)

**Free Tier Includes:**
- **Backend:** 750 hours/month (free tier)
  - Limitation: Spins down after 15 minutes of inactivity
  - Cold start: 30-60 seconds on first request
- **Frontend:** Unlimited bandwidth (free tier)
- **PostgreSQL:** 1GB storage, 100 connections (free tier)

**Upgrade to Paid ($7/month per service):**
- No cold starts
- Always-on instances
- Better performance
- More database storage

**Total Monthly Cost:**
- Free tier: $0 (with cold starts)
- Starter tier: $14/month ($7 backend + $7 database)
- Frontend: Always free

---

## Next Steps

1. **Test the complete flow:**
   - Create account
   - Connect Kajabi or Teachable
   - Install tracking script on your course site
   - Verify visitor tracking appears in dashboard

2. **Configure platform integrations:**
   - Add OAuth credentials for Kajabi/Teachable
   - Test OAuth connections
   - Trigger initial sync

3. **Set up monitoring:**
   - Add uptime monitoring (UptimeRobot, Pingdom)
   - Configure error alerts (Sentry)
   - Monitor logs regularly

4. **Security hardening:**
   - Rotate secrets every 90 days
   - Enable 2FA on Render account
   - Review access logs monthly

---

## Support

**Render Issues:**
- Documentation: https://render.com/docs
- Support: https://dashboard.render.com/support

**CourseSignal Issues:**
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [CLAUDE.md](./CLAUDE.md) for architecture details
- File GitHub issue

---

## Quick Reference: Important URLs

After deployment, bookmark these:

- **Frontend:** `https://coursesignal-frontend.onrender.com`
- **Backend:** `https://coursesignal-backend.onrender.com`
- **Health Check:** `https://coursesignal-backend.onrender.com/health`
- **Tracking Script:** `https://coursesignal-backend.onrender.com/track.js`
- **Render Dashboard:** `https://dashboard.render.com`

---

**Deployment complete!** 🎉

Your CourseSignal instance is now live and ready to track your course marketing attribution.
