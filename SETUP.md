# CourseSignal Setup Guide

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed
- [ ] PostgreSQL running locally

## Quick Setup Steps

### 1. Create Environment Files

**Backend `.env`:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with these values:
```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/coursesignal

REDIS_URL=redis://localhost:6379

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
FROM_EMAIL=noreply@coursesignal.com

STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_price_id

KAJABI_CLIENT_ID=your-kajabi-client-id
KAJABI_CLIENT_SECRET=your-kajabi-client-secret
KAJABI_REDIRECT_URI=http://localhost:3000/api/auth/kajabi/callback

ENCRYPTION_KEY=your-32-character-encryption-key-here

APP_URL=http://localhost:5173
```

**Frontend `.env`:**
```bash
cd ../frontend
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

### 2. Create PostgreSQL Database

```bash
# Create database
createdb coursesignal

# Or using psql
psql postgres
CREATE DATABASE coursesignal;
\q
```

### 3. Run Database Migrations

```bash
# From project root
npm run migrate
```

### 4. Build Tracking Script

```bash
npm run build:tracking
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

Expected output:
```
🚀 Server running on port 3000
📊 Environment: development
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
**Fix:** Make sure PostgreSQL is running:
```bash
# macOS (if installed via Homebrew)
brew services start postgresql

# Or check status
brew services list
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Fix:** Kill the process using the port:
```bash
lsof -ti:3000 | xargs kill -9
```

### Migration Errors
```
Error: relation "users" already exists
```
**Fix:** Drop and recreate database:
```bash
dropdb coursesignal
createdb coursesignal
npm run migrate
```

### Missing Environment Variables
```
Error: JWT_SECRET is not defined
```
**Fix:** Make sure `backend/.env` exists and has all required variables

## Testing the Setup

### 1. Test Backend Health
```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 2. Create Test User
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

### 3. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## Next Steps

1. **Complete Frontend Pages** - See `IMPLEMENTATION_GUIDE.md`
2. **Set up Email** - Get SendGrid API key
3. **Add Stripe** - Create Stripe account and get API keys
4. **Kajabi OAuth** - Register app at Kajabi Developer Portal

## Development Workflow

```bash
# Install new dependency (backend)
npm install axios --workspace=backend

# Install new dependency (frontend)
npm install react-icons --workspace=frontend

# Run migrations after schema changes
npm run migrate

# Build tracking script after changes
npm run build:tracking

# Check all workspaces
npm run build
```

## Database Access

```bash
# Connect to database
psql coursesignal

# Useful commands
\dt                    # List all tables
\d users              # Describe users table
SELECT * FROM users;  # Query users
\q                    # Quit
```

## Success! 🎉

If both servers are running without errors, you're ready to develop!

Visit http://localhost:5173 to see the app.
