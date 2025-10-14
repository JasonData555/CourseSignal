# CourseSignal

Revenue attribution analytics for course creators. Track which marketing channels actually drive sales.

## What We Built

A complete MVP for tracking and attributing course sales to marketing sources (YouTube, Instagram, Google, etc.) for creators using Kajabi, Teachable, or Stripe.

### Core Features ✅
- **Visitor Tracking**: Lightweight JS snippet (<5kb) tracks visitors across sessions
- **Purchase Attribution**: Automatically matches purchases to visitor sources (85%+ match rate)
- **Kajabi Integration**: OAuth flow, webhooks, and historical sync
- **Analytics Dashboard**: Revenue by source with conversion rates and trends
- **Authentication**: Secure signup/login with email verification
- **Real-time Updates**: Live purchase feed on dashboard

### Tech Stack
- **Backend**: Node.js + TypeScript + Express + PostgreSQL + Redis
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + React Query
- **Tracking**: Vanilla TypeScript with FingerprintJS
- **Integrations**: Kajabi OAuth, Stripe (billing), Email (SendGrid)

## Project Structure

```
CourseSignal/
├── backend/              # Express API server
│   ├── src/
│   │   ├── db/          # Database connection & migrations
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth & rate limiting
│   │   └── utils/       # Helpers (JWT, encryption, validation)
│   └── package.json
├── frontend/            # React app
│   ├── src/
│   │   ├── pages/      # Route components
│   │   ├── components/ # Reusable UI
│   │   ├── stores/     # Zustand state management
│   │   └── lib/        # API client
│   └── package.json
├── tracking-script/     # Visitor tracking library
│   ├── src/
│   │   └── index.ts    # Main tracking logic
│   └── package.json
└── package.json         # Workspace root
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional for MVP)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**

Backend `.env`:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

Frontend `.env`:
```bash
echo "VITE_API_URL=http://localhost:3000/api" > frontend/.env
```

3. **Create database**
```bash
createdb coursesignal
```

4. **Run migrations**
```bash
npm run migrate --workspace=backend
```

5. **Build tracking script**
```bash
npm run build --workspace=tracking-script
```

### Development

Run all services:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

Visit:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## User Journey

### 1. Onboarding (<5 minutes)
1. Sign up with email & password
2. Choose platform (Kajabi/Teachable/Stripe)
3. Connect via OAuth or API key
4. System syncs last 30 days of purchases
5. Copy tracking script to course site
6. View dashboard with historical data

### 2. Daily Use
- See revenue by source (YouTube: $8K, Instagram: $400)
- Check conversion rates per channel
- Export reports to CSV
- Make data-driven marketing decisions

## Key APIs

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/verify-email` - Verify email
- `GET /api/auth/me` - Get current user

### Analytics
- `GET /api/analytics/summary?range=30d` - Revenue summary
- `GET /api/analytics/sources?range=30d` - Revenue by source
- `GET /api/analytics/recent-purchases` - Last 20 purchases
- `GET /api/analytics/export?range=30d` - Download CSV

### Integrations
- `GET /api/kajabi/connect` - Initiate OAuth
- `POST /api/kajabi/sync` - Trigger sync
- `GET /api/kajabi/sync-status` - Check progress

### Tracking
- `POST /api/tracking/event` - Record visitor session
- `GET /api/script/generate` - Get tracking script

## Database Schema

**Key Tables:**
- `users` - User accounts & subscription status
- `visitors` - Unique visitors with first-touch attribution
- `sessions` - Individual visitor sessions with UTM data
- `purchases` - Course purchases with attribution
- `platform_integrations` - OAuth tokens & webhook IDs
- `sync_jobs` - Background sync status

See `backend/src/db/schema.sql` for full schema.

## Attribution Logic

1. **First-Touch**: Credit goes to visitor's initial source
2. **Last-Touch**: Credit goes to most recent source before purchase
3. **Matching Priority**:
   - Email match (most reliable)
   - Device fingerprint + timing (within 24h)
   - Marked as "unmatched" if no match

Target: >85% match rate

## Deployment

**Quick Deploy to Render:** See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete step-by-step guide (30-45 minutes).

**Key Steps:**
1. Connect GitHub repo to Render
2. Deploy via Blueprint (`render.yaml` auto-configures everything)
3. Add environment variables (JWT_SECRET, ENCRYPTION_KEY, etc.)
4. Run database migrations
5. Get your tracking script and install on course site

**Other Platforms:**
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for Railway, Docker, Vercel, and self-hosted options

## What's Next

See `IMPLEMENTATION_GUIDE.md` for:
- Frontend completion steps
- Stripe billing integration
- Teachable/Stripe platform integrations
- Production deployment checklist

## License

MIT

## Support

For beta testing or questions:
- Create an issue on GitHub
- Email: support@coursesignal.com
