# Deployment Checklist

Quick reference checklist for deploying CourseSignal to production.

## Pre-Deployment

- [ ] Code pushed to GitHub repository
- [ ] All tests passing locally (`npm test`)
- [ ] Environment variables template updated (`.env.example`)
- [ ] Database migrations tested locally
- [ ] Tracking script builds successfully (`npm run build:tracking`)

## Generate Secrets

Run these commands and save outputs:

```bash
# JWT Secret (128 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

- [ ] JWT_SECRET generated
- [ ] ENCRYPTION_KEY generated (exactly 32 chars)

## Render Deployment

### 1. Connect Repository
- [ ] GitHub account connected to Render
- [ ] Repository access granted to Render

### 2. Deploy Blueprint
- [ ] Navigate to https://dashboard.render.com/blueprints
- [ ] Select "New Blueprint"
- [ ] Choose CourseSignal repository
- [ ] Click "Apply" (provisions 3 services)
- [ ] Wait for initial deployment (5-10 minutes)

### 3. Configure Backend Environment Variables

Navigate to: Dashboard → coursesignal-backend → Environment

**Required:**
- [ ] `JWT_SECRET` - Paste generated secret
- [ ] `ENCRYPTION_KEY` - Paste 32-char key
- [ ] `APP_URL` - Set to frontend URL (e.g., `https://coursesignal-frontend.onrender.com`)

**Optional (Add as needed):**
- [ ] `KAJABI_CLIENT_ID`
- [ ] `KAJABI_CLIENT_SECRET`
- [ ] `KAJABI_WEBHOOK_SECRET`
- [ ] `TEACHABLE_CLIENT_ID`
- [ ] `TEACHABLE_CLIENT_SECRET`
- [ ] `TEACHABLE_WEBHOOK_SECRET`
- [ ] `SKOOL_WEBHOOK_SECRET`
- [ ] `OPENAI_API_KEY`
- [ ] `SENDGRID_API_KEY`

**After adding variables:**
- [ ] Click "Save Changes"
- [ ] Wait for automatic redeploy

### 4. Configure Frontend Environment Variables

Navigate to: Dashboard → coursesignal-frontend → Environment

- [ ] `VITE_API_URL` - Set to backend URL + /api
  - Example: `https://coursesignal-backend.onrender.com/api`
- [ ] Click "Save Changes"
- [ ] Wait for rebuild

### 5. Run Database Migrations

- [ ] Navigate to: Dashboard → coursesignal-backend
- [ ] Click "Shell" tab
- [ ] Run: `npm run migrate`
- [ ] Verify all migrations succeeded (see green checkmarks)
- [ ] Close shell

## Verification

### Backend Health Check
```bash
curl https://coursesignal-backend.onrender.com/health
```
- [ ] Returns: `{"status":"ok","timestamp":"..."}`

### Frontend Loading
- [ ] Visit: `https://coursesignal-frontend.onrender.com`
- [ ] Landing page displays
- [ ] No console errors in browser DevTools

### Authentication Flow
- [ ] Sign up with test account
- [ ] Receive verification email (if SendGrid configured)
- [ ] Login successfully
- [ ] Dashboard loads (empty state)

### Tracking Script
- [ ] Navigate to Settings
- [ ] Tracking script displays with correct production URL
- [ ] Copy script
- [ ] Test script loads: `curl https://coursesignal-backend.onrender.com/track.js`
- [ ] Returns JavaScript code (not 404)

## Platform Integration Setup

### Kajabi OAuth (If using Kajabi)
- [ ] Create OAuth app in Kajabi Partner Portal
- [ ] Set redirect URI: `https://coursesignal-backend.onrender.com/api/kajabi/callback`
- [ ] Add Client ID/Secret to backend environment variables
- [ ] Test OAuth flow: Settings → Connect Kajabi
- [ ] Verify redirect and connection success

### Teachable OAuth (If using Teachable)
- [ ] Create OAuth app in Teachable Developer Portal
- [ ] Set redirect URI: `https://coursesignal-backend.onrender.com/api/teachable/callback`
- [ ] Add Client ID/Secret to backend environment variables
- [ ] Test OAuth flow: Settings → Connect Teachable
- [ ] Verify connection success

### Skool Integration (If using Skool)
- [ ] Obtain API key from SkoolAPI.com
- [ ] Add API key in Settings → Connect Skool
- [ ] Copy webhook URL
- [ ] Configure webhook in Skool/Zapier
- [ ] Test with sample purchase

## Install Tracking Script

### On Kajabi
- [ ] Login to Kajabi admin
- [ ] Navigate to: Settings → Custom Code → Head Tracking Code
- [ ] Paste tracking script
- [ ] Save
- [ ] Visit any Kajabi page (in incognito mode)
- [ ] Check CourseSignal dashboard for new visitor

### On Teachable
- [ ] Login to Teachable admin
- [ ] Navigate to: Settings → Code Snippets → Head Code
- [ ] Paste tracking script
- [ ] Save
- [ ] Visit any Teachable page
- [ ] Verify visitor appears in dashboard

### On Custom Site
- [ ] Add script to `<head>` section of website
- [ ] Deploy website
- [ ] Visit site
- [ ] Verify tracking works

## Post-Deployment Monitoring

### Day 1
- [ ] Check backend logs for errors: Dashboard → coursesignal-backend → Logs
- [ ] Monitor visitor tracking (should see test visitors)
- [ ] Test purchase attribution (if test purchases available)
- [ ] Verify email delivery (if SendGrid configured)

### Week 1
- [ ] Check database size: Dashboard → coursesignal-postgres
- [ ] Monitor response times
- [ ] Review error logs
- [ ] Verify background jobs running (launch status updater)

### Optional: Custom Domains

#### Backend Custom Domain
- [ ] Dashboard → coursesignal-backend → Settings → Add Custom Domain
- [ ] Enter: `api.yourdomain.com`
- [ ] Add CNAME record to DNS:
  ```
  Type: CNAME
  Name: api
  Value: coursesignal-backend.onrender.com
  ```
- [ ] Wait for SSL provisioning (5-10 min)
- [ ] Update environment variables:
  - Backend: `APP_URL=https://api.yourdomain.com`
  - Frontend: `VITE_API_URL=https://api.yourdomain.com/api`
- [ ] Update OAuth redirect URIs (Kajabi, Teachable)

#### Frontend Custom Domain
- [ ] Dashboard → coursesignal-frontend → Settings → Add Custom Domain
- [ ] Enter: `app.yourdomain.com`
- [ ] Add CNAME record to DNS:
  ```
  Type: CNAME
  Name: app
  Value: coursesignal-frontend.onrender.com
  ```
- [ ] Wait for SSL provisioning

## Security Review

- [ ] All secrets in environment variables (not code)
- [ ] `.env` files in `.gitignore`
- [ ] CORS configured correctly (not `*` in production)
- [ ] SSL enabled (https:// URLs)
- [ ] OAuth redirect URIs use HTTPS
- [ ] Database connection uses SSL
- [ ] Rate limiting enabled

## Documentation

- [ ] Production URLs documented
- [ ] Environment variables backed up securely
- [ ] OAuth credentials stored in password manager
- [ ] Emergency rollback procedure understood
- [ ] Team has access to Render dashboard

## Support Setup

- [ ] Uptime monitoring configured (UptimeRobot, Pingdom)
- [ ] Error tracking configured (Sentry)
- [ ] Log alerts configured
- [ ] Support email configured
- [ ] Backup strategy documented

---

## Troubleshooting Quick Reference

**Backend won't start:**
1. Check logs: Dashboard → coursesignal-backend → Logs
2. Verify DATABASE_URL is set
3. Verify JWT_SECRET and ENCRYPTION_KEY are set

**Frontend blank page:**
1. Check browser console for errors
2. Verify VITE_API_URL is correct
3. Check CORS settings (backend APP_URL)

**Tracking script 404:**
1. Verify backend deployed successfully
2. Check: `https://your-backend.onrender.com/track.js`
3. Review build logs for tracking script compilation

**Database connection errors:**
1. Verify coursesignal-postgres is running
2. Check DATABASE_URL format
3. Ensure migrations ran successfully

**OAuth redirect errors:**
1. Verify redirect URI matches exactly (no trailing slash)
2. Must use HTTPS in production
3. Check OAuth app settings in platform portal

---

## Deployment Complete! 🎉

Your CourseSignal instance is live. Next steps:
1. Install tracking script on your course site
2. Connect your course platform (Kajabi/Teachable/Skool)
3. Monitor dashboard for incoming visitor data
4. Start making data-driven marketing decisions

For detailed troubleshooting: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)
