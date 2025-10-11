# Deployment Guide

Complete guide for deploying CourseSignal to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Tracking Script CDN](#tracking-script-cdn)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Services

- **PostgreSQL 14+** - Primary database
- **Redis 6+** - Background job queue (Bull) and caching
- **Node.js 18+** - Runtime environment
- **SendGrid Account** - Email delivery
- **CDN** - CloudFlare, AWS CloudFront, or similar (for tracking script)

### Optional Services

- **Sentry** - Error tracking and monitoring
- **LogDNA/Datadog** - Log aggregation
- **UptimeRobot** - Uptime monitoring

### External OAuth Apps Required

Before deployment, create OAuth applications:

**Kajabi OAuth App:**
1. Go to Kajabi Partner Portal
2. Create new OAuth application
3. Note Client ID and Client Secret
4. Set redirect URI: `https://yourdomain.com/api/kajabi/callback`

**Teachable OAuth App:**
1. Go to Teachable Developers Portal
2. Create new OAuth application
3. Note Client ID and Client Secret
4. Set redirect URI: `https://yourdomain.com/api/teachable/callback`

### Accounts & API Keys

- SendGrid API key (Email delivery)
- Stripe API keys (Billing, if implementing)
- CDN account for tracking script hosting

---

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# ============================================================================
# SERVER CONFIGURATION
# ============================================================================
PORT=3002
NODE_ENV=production

# ============================================================================
# DATABASE
# ============================================================================
# Connection string format: postgresql://username:password@host:port/database
DATABASE_URL=postgresql://user:password@db.example.com:5432/coursesignal

# Recommended: Enable SSL for production databases
# For Railway/Render: ?sslmode=require
# DATABASE_URL=postgresql://user:password@db.example.com:5432/coursesignal?sslmode=require

# ============================================================================
# REDIS
# ============================================================================
# Connection string format: redis://username:password@host:port
REDIS_URL=redis://default:password@redis.example.com:6379

# For Redis Cloud with TLS:
# REDIS_URL=rediss://default:password@redis.example.com:6379

# ============================================================================
# JWT AUTHENTICATION
# ============================================================================
# Generate secure secrets: openssl rand -base64 32
JWT_SECRET=your-super-secure-secret-minimum-32-chars
JWT_REFRESH_SECRET=another-super-secure-secret-minimum-32-chars

# Token expiration (adjust based on security requirements)
JWT_EXPIRES_IN=15m        # Access token: 15 minutes
JWT_REFRESH_EXPIRES_IN=7d # Refresh token: 7 days

# ============================================================================
# EMAIL (SendGrid)
# ============================================================================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key-here
FROM_EMAIL=noreply@yourdomain.com

# ============================================================================
# STRIPE BILLING (Optional)
# ============================================================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# ============================================================================
# KAJABI INTEGRATION
# ============================================================================
KAJABI_CLIENT_ID=your-kajabi-client-id
KAJABI_CLIENT_SECRET=your-kajabi-client-secret
KAJABI_REDIRECT_URI=https://yourdomain.com/api/kajabi/callback

# ============================================================================
# TEACHABLE INTEGRATION
# ============================================================================
TEACHABLE_CLIENT_ID=your-teachable-client-id
TEACHABLE_CLIENT_SECRET=your-teachable-client-secret
TEACHABLE_REDIRECT_URI=https://yourdomain.com/api/teachable/callback

# ============================================================================
# ENCRYPTION
# ============================================================================
# CRITICAL: Must be exactly 32 characters for AES-256
# Generate: openssl rand -base64 32 | cut -c1-32
ENCRYPTION_KEY=your-32-character-encryption-k

# ============================================================================
# APPLICATION
# ============================================================================
# Frontend URL (for CORS and email links)
APP_URL=https://app.yourdomain.com

# Tracking script CDN URL (set after CDN deployment)
TRACKING_SCRIPT_CDN=https://cdn.yourdomain.com/track.js
```

### Frontend Environment Variables

Create a `.env.production` file in the `frontend/` directory:

```bash
# API Base URL (backend)
VITE_API_URL=https://api.yourdomain.com/api

# Application URL (for tracking script generation)
VITE_APP_URL=https://app.yourdomain.com
```

### Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` for templates
2. **Use secret managers** in production:
   - Railway: Built-in environment variables
   - Render: Environment variable groups
   - AWS: AWS Secrets Manager
   - GCP: Secret Manager
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use strong encryption keys** (minimum 32 characters, random)
5. **Enable SSL/TLS** for all database and Redis connections

---

## Database Setup

### 1. Create Production Database

**PostgreSQL Cloud Options:**
- **Railway** - Easiest for small teams
- **Render** - Good free tier
- **AWS RDS** - Enterprise-grade
- **Supabase** - Postgres + extras
- **DigitalOcean Managed Databases** - Simple and reliable

**Example: Creating database on Railway**

```bash
# 1. Create PostgreSQL database in Railway dashboard
# 2. Copy connection string
# 3. Verify connection:
psql "postgresql://user:password@db.railway.internal:5432/railway"
```

### 2. Run Database Migrations

Connect to production database and run migrations:

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:password@db.example.com:5432/coursesignal"

# Navigate to backend directory
cd backend

# Run migrations
npm run migrate
```

**Migration Files Applied:**
- `001_initial_schema.sql` - Core tables (users, visitors, sessions, purchases)
- `002_platform_integrations.sql` - OAuth integrations
- `003_tracking_events.sql` - Raw tracking data
- `004_refresh_tokens.sql` - JWT refresh tokens
- `005_sync_jobs.sql` - Background job tracking
- `006_create_launches.sql` - Launch tracking feature
- `007_add_launch_id_to_purchases.sql` - Launch-purchase relationship
- `008_create_launch_views.sql` - Public recap analytics
- `009_backfill_launch_purchases.sql` - Historical launch data

### 3. Database Indexes

Verify critical indexes are created:

```sql
-- Performance-critical indexes
\di

-- Should include:
-- idx_visitors_user_id
-- idx_visitors_email
-- idx_sessions_visitor_id
-- idx_purchases_user_id
-- idx_purchases_email
-- idx_purchases_purchased_at
-- idx_launches_user_status
-- idx_launches_active
```

### 4. Database Backup Strategy

**Automated Backups:**
- Railway: Daily automatic backups (paid plans)
- Render: Point-in-time recovery available
- AWS RDS: Automated backups with configurable retention

**Manual Backup:**
```bash
# Dump entire database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20241008.sql
```

### 5. Database Connection Pooling

Production settings for `backend/src/db/connection.ts`:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if can't connect
});
```

---

## Backend Deployment

### Option 1: Railway (Recommended)

**Pros:** Easy setup, built-in PostgreSQL, automatic SSL, generous free tier
**Cons:** Limited control over infrastructure

**Steps:**

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize Railway Project:**
```bash
cd backend
railway init
```

3. **Create PostgreSQL Database:**
```bash
railway add
# Select PostgreSQL
```

4. **Set Environment Variables:**
```bash
# Set all required environment variables
railway variables set JWT_SECRET="your-secret"
railway variables set ENCRYPTION_KEY="your-32-char-key"
railway variables set KAJABI_CLIENT_ID="..."
# ... (set all variables from .env)
```

5. **Deploy:**
```bash
# Deploy backend
railway up

# View logs
railway logs
```

6. **Run Migrations:**
```bash
railway run npm run migrate
```

7. **Get Public URL:**
```bash
railway domain
# Example output: https://backend-production-a1b2.up.railway.app
```

### Option 2: Render

**Pros:** Simple, good free tier, automatic SSL
**Cons:** Cold starts on free tier

**Steps:**

1. **Create Render Account** at render.com

2. **Create PostgreSQL Database:**
   - Dashboard > New > PostgreSQL
   - Copy Internal Database URL

3. **Create Web Service:**
   - Dashboard > New > Web Service
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/index.js`

4. **Set Environment Variables:**
   - Settings > Environment
   - Add all variables from `.env`

5. **Deploy:**
   - Render auto-deploys on git push
   - View logs in dashboard

6. **Run Migrations:**
```bash
# SSH into Render shell
npm run migrate
```

### Option 3: Docker (Self-Hosted)

**Pros:** Full control, portable, consistent environments
**Cons:** More complex setup, requires Docker knowledge

**Create `backend/Dockerfile`:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3002

# Run migrations and start server
CMD npm run migrate && node dist/index.js
```

**Create `docker-compose.yml` (for local testing):**

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/coursesignal
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: coursesignal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

**Deploy:**
```bash
# Build image
docker build -t coursesignal-backend ./backend

# Run container
docker run -d \
  -p 3002:3002 \
  --env-file backend/.env \
  coursesignal-backend
```

### Health Check Endpoint

Verify backend is running:

```bash
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-10-08T..."}
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**Pros:** Optimized for Vite/React, instant deployments, automatic SSL, edge network
**Cons:** Limited backend capabilities (frontend only)

**Steps:**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
cd frontend

# First deployment (interactive)
vercel

# Follow prompts:
# - Set root directory: frontend
# - Build command: npm run build
# - Output directory: dist

# Production deployment
vercel --prod
```

3. **Configure Environment Variables:**
   - Dashboard > Project Settings > Environment Variables
   - Add `VITE_API_URL=https://api.yourdomain.com/api`

4. **Custom Domain:**
   - Dashboard > Domains
   - Add: `app.yourdomain.com`
   - Update DNS records as instructed

### Option 2: Netlify

**Pros:** Simple, generous free tier, automatic SSL
**Cons:** Slightly slower build times

**Steps:**

1. **Deploy via Git:**
   - Connect GitHub repository
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables:**
   - Site Settings > Build & Deploy > Environment
   - Add `VITE_API_URL`

3. **Custom Domain:**
   - Domain Settings > Add custom domain
   - Update DNS records

### Option 3: CloudFlare Pages

**Pros:** Fast global CDN, DDoS protection, free tier
**Cons:** More complex setup

**Steps:**

1. **Connect Repository:**
   - CloudFlare Dashboard > Pages
   - Connect GitHub repository

2. **Build Settings:**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`

3. **Environment Variables:**
   - Settings > Environment Variables
   - Add `VITE_API_URL`

### Build Optimization

**Production Build Checklist:**

```bash
cd frontend

# 1. Install dependencies
npm ci

# 2. Build for production
npm run build

# 3. Preview build locally
npm run preview

# 4. Verify build output
ls -lh dist/
# Should see index.html, assets/, etc.

# 5. Check bundle size
du -sh dist/assets/*.js
# Should be < 500KB per chunk
```

**Performance Tips:**

1. **Code Splitting:** Already configured in Vite
2. **Asset Optimization:** Images should be optimized (<200KB)
3. **Lazy Loading:** React.lazy() for routes
4. **CDN Caching:** Set Cache-Control headers

---

## Tracking Script CDN

The tracking script must be served from a fast, globally distributed CDN.

### Option 1: CloudFlare CDN (Recommended)

**Steps:**

1. **Build Tracking Script:**
```bash
cd tracking-script
npm run build

# Output: dist/track.js
```

2. **Upload to CloudFlare:**

```bash
# Install Wrangler (CloudFlare CLI)
npm install -g wrangler

# Login
wrangler login

# Create R2 bucket
wrangler r2 bucket create coursesignal-tracking

# Upload script
wrangler r2 object put coursesignal-tracking/track.js --file=dist/track.js

# Set public access
```

3. **Configure Custom Domain:**
   - CloudFlare Dashboard > R2 > Bucket
   - Connect custom domain: `cdn.yourdomain.com`

4. **Set Cache Headers:**
```javascript
// CloudFlare Worker (optional)
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)

  newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  newResponse.headers.set('Access-Control-Allow-Origin', '*')

  return newResponse
}
```

### Option 2: AWS CloudFront + S3

**Steps:**

1. **Create S3 Bucket:**
```bash
aws s3 mb s3://coursesignal-tracking

# Upload tracking script
aws s3 cp dist/track.js s3://coursesignal-tracking/track.js \
  --cache-control "public, max-age=31536000, immutable" \
  --content-type "application/javascript"
```

2. **Create CloudFront Distribution:**
```bash
# Origin: coursesignal-tracking.s3.amazonaws.com
# Cache policy: CachingOptimized
# CORS: Allow all origins
```

3. **Custom Domain:**
   - Add CNAME: `cdn.yourdomain.com`
   - Add SSL certificate (ACM)

### Tracking Script Versioning

**Strategy for updates without breaking existing installations:**

```bash
# Version with hash
cp dist/track.js dist/track.v1.2.3.js

# Latest always points to newest version
cp dist/track.js dist/track.latest.js

# Users embed:
<script src="https://cdn.yourdomain.com/track.latest.js"></script>
```

---

## Post-Deployment Verification

### Deployment Checklist

Use this checklist after every deployment:

#### Backend Verification

```bash
# 1. Health check
curl https://api.yourdomain.com/health
# Expected: {"status":"ok",...}

# 2. Database connection
curl https://api.yourdomain.com/health/db
# Expected: {"database":"connected",...}

# 3. Redis connection
curl https://api.yourdomain.com/health/redis
# Expected: {"redis":"connected",...}

# 4. Create test user
curl -X POST https://api.yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
# Expected: 201 Created

# 5. Login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
# Expected: {"token":"...", "refreshToken":"..."}

# 6. Test OAuth endpoints
curl -I https://api.yourdomain.com/api/kajabi/connect
# Expected: 302 Redirect

# 7. Test tracking endpoint
curl -X POST https://api.yourdomain.com/api/tracking/event \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "test-visitor-123",
    "sessionId": "test-session-456",
    "eventType": "visit",
    "eventData": {}
  }'
# Expected: 200 OK
```

#### Frontend Verification

```bash
# 1. Homepage loads
curl -I https://app.yourdomain.com
# Expected: 200 OK

# 2. Static assets load
curl -I https://app.yourdomain.com/assets/index-abc123.js
# Expected: 200 OK

# 3. API connectivity
# Open browser console on app.yourdomain.com
# Check for CORS errors (should be none)
```

#### Tracking Script Verification

```bash
# 1. Script loads
curl -I https://cdn.yourdomain.com/track.js
# Expected: 200 OK, Cache-Control header present

# 2. Script size
curl https://cdn.yourdomain.com/track.js | wc -c
# Expected: < 50KB

# 3. CORS headers
curl -I https://cdn.yourdomain.com/track.js \
  -H "Origin: https://example.com"
# Expected: Access-Control-Allow-Origin: *
```

#### Integration Tests

**Test Complete User Flow:**

1. Sign up new user
2. Connect Kajabi or Teachable
3. Trigger manual sync
4. View dashboard (verify data appears)
5. Generate tracking script
6. Install tracking script on test site
7. Create test launch
8. Verify launch appears in dashboard

### Monitoring Setup

**1. Sentry Error Tracking**

```bash
# Install Sentry SDK
npm install @sentry/node @sentry/tracing

# backend/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**2. Uptime Monitoring**

Configure UptimeRobot or similar:
- Monitor: `https://api.yourdomain.com/health`
- Interval: 5 minutes
- Alert via email/Slack on downtime

**3. Log Aggregation**

Railway automatically collects logs. For other platforms:

```bash
# View recent logs
railway logs --tail 100

# Filter by level
railway logs | grep ERROR
```

---

## Monitoring & Maintenance

### Key Metrics to Monitor

**Application Metrics:**
- Response time (p50, p95, p99)
- Error rate (< 1% target)
- Request throughput
- Database connection pool usage

**Business Metrics:**
- Active users
- Tracking events per day
- Purchases attributed per day
- Launch conversions

**Infrastructure Metrics:**
- CPU usage (< 70% average)
- Memory usage (< 80% average)
- Database disk space
- Redis memory usage

### Database Maintenance

**Weekly Tasks:**

```sql
-- 1. Check database size
SELECT pg_size_pretty(pg_database_size('coursesignal'));

-- 2. Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Vacuum (reclaim space)
VACUUM ANALYZE;

-- 4. Update statistics
ANALYZE;
```

**Monthly Tasks:**

```sql
-- 1. Archive old tracking events (> 90 days)
DELETE FROM tracking_events
WHERE timestamp < NOW() - INTERVAL '90 days';

-- 2. Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Redis Maintenance

```bash
# Check memory usage
redis-cli INFO memory

# Check key count
redis-cli DBSIZE

# Flush old cache (if needed)
redis-cli FLUSHDB
```

### SSL Certificate Renewal

Most platforms auto-renew SSL certificates. Verify:

```bash
# Check certificate expiration
echo | openssl s_client -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Should show:
# notBefore=...
# notAfter=... (should be > 30 days in future)
```

---

## Troubleshooting

### Common Issues

#### Backend Won't Start

**Symptom:** Application crashes on startup

**Checks:**
```bash
# 1. Check environment variables
printenv | grep DATABASE_URL
printenv | grep JWT_SECRET

# 2. Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# 3. Check logs
railway logs | tail -50

# 4. Verify migrations
psql $DATABASE_URL -c "SELECT * FROM pg_tables WHERE schemaname='public';"
```

**Common Causes:**
- Missing environment variables
- Invalid DATABASE_URL
- Database not accepting connections
- Missing migrations

#### Database Connection Errors

**Symptom:** `ECONNREFUSED` or `timeout` errors

**Solution:**
```bash
# 1. Verify database is running
pg_isready -h db.example.com -p 5432

# 2. Check connection string
echo $DATABASE_URL
# Format: postgresql://user:pass@host:port/dbname

# 3. Check SSL requirements
# Add ?sslmode=require to DATABASE_URL

# 4. Check firewall rules
# Ensure your deployment IP is whitelisted
```

#### OAuth Callback Errors

**Symptom:** "Invalid redirect URI" from Kajabi/Teachable

**Solution:**
1. Verify redirect URI in OAuth app settings
2. Must exactly match: `https://api.yourdomain.com/api/kajabi/callback`
3. No trailing slash
4. HTTPS required in production

#### Tracking Script Not Loading

**Symptom:** 404 on tracking script URL

**Checks:**
```bash
# 1. Verify CDN URL
curl -I https://cdn.yourdomain.com/track.js

# 2. Check CORS headers
curl -I https://cdn.yourdomain.com/track.js \
  -H "Origin: https://customer-site.com"

# 3. Verify content type
curl -I https://cdn.yourdomain.com/track.js | grep content-type
# Should be: application/javascript
```

#### High Memory Usage

**Symptom:** Backend using > 512MB RAM

**Investigation:**
```bash
# 1. Check Node.js heap
# Add to backend startup:
node --max-old-space-size=512 dist/index.js

# 2. Check database connection pool
# Reduce pool size in connection.ts:
max: 10 // Instead of 20

# 3. Check for memory leaks
# Use Node.js --inspect flag and Chrome DevTools
```

#### Slow Database Queries

**Symptom:** Requests timing out

**Solution:**
```sql
-- 1. Find slow queries
SELECT
  query,
  mean_time,
  calls
FROM pg_stat_statements
WHERE mean_time > 1000 -- > 1 second
ORDER BY mean_time DESC;

-- 2. Check missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY n_distinct DESC;

-- 3. Add missing indexes
CREATE INDEX idx_custom ON table_name(column_name);
```

### Emergency Contacts

**Platform Support:**
- Railway: https://help.railway.app
- Render: support@render.com
- Vercel: https://vercel.com/support

**Database Issues:**
- PostgreSQL Community: #postgresql on IRC
- Stack Overflow: [postgresql] tag

---

## Rollback Procedures

### Backend Rollback

**Railway:**
```bash
# 1. View deployment history
railway deployments

# 2. Rollback to previous deployment
railway rollback <deployment-id>

# 3. Verify rollback
railway logs
curl https://api.yourdomain.com/health
```

**Render:**
- Dashboard > Service > Events
- Click "Rollback" on previous successful deployment

**Docker:**
```bash
# 1. Pull previous image tag
docker pull coursesignal-backend:v1.2.3

# 2. Stop current container
docker stop backend-container

# 3. Start previous version
docker run -d \
  --name backend-container \
  --env-file .env \
  -p 3002:3002 \
  coursesignal-backend:v1.2.3
```

### Database Rollback

**CRITICAL: Test on staging first!**

```bash
# 1. Create backup before rollback
pg_dump $DATABASE_URL > pre_rollback_backup.sql

# 2. Rollback migrations (manual)
psql $DATABASE_URL

# Example: Remove launch feature
DROP TABLE IF EXISTS launch_views;
DROP TABLE IF EXISTS launches;
ALTER TABLE purchases DROP COLUMN IF EXISTS launch_id;

# 3. Restore from backup (if needed)
psql $DATABASE_URL < backup_20241007.sql
```

### Frontend Rollback

**Vercel:**
```bash
# View deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

**Netlify:**
- Dashboard > Deploys
- Click "Publish deploy" on previous successful build

### Rollback Verification

After rollback, verify:

```bash
# 1. Health check passes
curl https://api.yourdomain.com/health

# 2. Login works
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# 3. Dashboard loads
curl -I https://app.yourdomain.com

# 4. Check error logs
railway logs | grep ERROR | tail -20
```

---

## Production Checklist

Final checklist before going live:

### Security
- [ ] All secrets stored in environment variables (not code)
- [ ] ENCRYPTION_KEY is exactly 32 characters
- [ ] JWT secrets are strong (32+ chars random)
- [ ] SSL/TLS enabled for database connections
- [ ] CORS configured correctly (not `*` in production)
- [ ] Rate limiting enabled on auth endpoints
- [ ] Helmet.js security headers configured
- [ ] OAuth redirect URIs use HTTPS

### Database
- [ ] Migrations run successfully
- [ ] Indexes created on all foreign keys
- [ ] Connection pooling configured
- [ ] Automated backups enabled
- [ ] Backup restoration tested

### Backend
- [ ] Health check endpoint returns 200
- [ ] All environment variables set
- [ ] Email delivery working (SendGrid)
- [ ] OAuth flows tested (Kajabi, Teachable)
- [ ] Webhook endpoints accessible
- [ ] Background jobs running (launch status updater)
- [ ] Error tracking configured (Sentry)

### Frontend
- [ ] Production build succeeds
- [ ] Environment variables set
- [ ] API calls work (no CORS errors)
- [ ] Custom domain configured
- [ ] SSL certificate valid

### Tracking Script
- [ ] CDN deployment successful
- [ ] Script < 50KB gzipped
- [ ] CORS headers present
- [ ] Cache headers set (1 year)
- [ ] Test installation verified

### Monitoring
- [ ] Uptime monitoring configured
- [ ] Error tracking configured
- [ ] Log aggregation working
- [ ] Alerts configured (email/Slack)

### Documentation
- [ ] Environment variables documented
- [ ] Runbook created for common issues
- [ ] Rollback procedures tested
- [ ] Emergency contacts documented

---

## Support & Resources

**Documentation:**
- CourseSignal: See `CLAUDE.md`, `README.md`, `TESTING.md`, `SECURITY.md`
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs

**Community:**
- GitHub Issues: Report bugs and feature requests
- Discord: Join our community server

**Emergency Support:**
- Critical production issues: support@coursesignal.com
- Security vulnerabilities: security@coursesignal.com

---

*Last updated: October 2024*
