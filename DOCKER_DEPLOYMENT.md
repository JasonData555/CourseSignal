# CourseSignal - Docker Deployment Guide

Complete guide for deploying CourseSignal using Docker and Docker Compose.

## Quick Start

```bash
# 1. Copy environment files
cp backend/.env.production.example backend/.env
cp frontend/.env.production.example frontend/.env.production

# 2. Edit backend/.env with your production values
nano backend/.env

# 3. Build and start all services
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend npm run migrate

# 5. Check logs
docker-compose logs -f

# 6. Access the application
# Frontend: http://localhost (port 80)
# Backend API: http://localhost:3002
```

## Architecture Overview

The Docker setup consists of 4 services:

1. **PostgreSQL** - Database (port 5432)
2. **Redis** - Job queue and caching (port 6379)
3. **Backend** - Node.js API (port 3002)
4. **Frontend** - React app served by Nginx (port 80)

### Image Specifications

| Service | Base Image | Final Size | Build Time |
|---------|-----------|------------|------------|
| Backend | node:18-alpine | ~150MB | 2-3 min |
| Frontend | nginx:1.25-alpine | ~25MB | 1-2 min |
| PostgreSQL | postgres:15-alpine | ~200MB | Pull only |
| Redis | redis:7-alpine | ~30MB | Pull only |

**Total Stack Size**: ~405MB

## Prerequisites

### System Requirements

- **Docker**: v20.10+ ([Install](https://docs.docker.com/get-docker/))
- **Docker Compose**: v2.0+ (included with Docker Desktop)
- **Memory**: 2GB minimum, 4GB recommended
- **Disk Space**: 2GB for images + database storage

### Verify Installation

```bash
docker --version
# Docker version 24.0.0+

docker-compose --version
# Docker Compose version v2.0.0+
```

## File Structure

```
CourseSignal/
├── docker-compose.yml           # Orchestration config
├── backend/
│   ├── Dockerfile              # Backend production image
│   ├── .dockerignore           # Exclude files from image
│   └── .env                    # Backend environment variables
├── frontend/
│   ├── Dockerfile              # Frontend production image
│   ├── .dockerignore           # Exclude files from image
│   ├── nginx.conf              # Nginx web server config
│   └── .env.production         # Frontend build-time variables
└── railway.json                # Railway deployment config
└── render.yaml                 # Render deployment config
```

## Backend Dockerfile Explained

The backend uses a **multi-stage build** to minimize image size:

### Stage 1: Builder (Build TypeScript)

```dockerfile
FROM node:18-alpine AS builder

# Install build dependencies (for native modules)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install ALL dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Build TypeScript
COPY . .
RUN npm run build
```

### Stage 2: Production (Minimal Runtime)

```dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install ONLY production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built code from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/migrations ./src/db/migrations

# Switch to non-root user
USER nodejs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

**Key Security Features:**
- Non-root user (UID 1001)
- Minimal Alpine Linux base
- No dev dependencies in final image
- Proper signal handling with dumb-init
- Health check for container orchestration

## Frontend Dockerfile Explained

The frontend also uses a **multi-stage build**:

### Stage 1: Build React App

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Creates optimized static files
```

### Stage 2: Serve with Nginx

```dockerfile
FROM nginx:1.25-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN adduser -S nginx -u 1001 -G nginx

# Set ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Key Features:**
- Nginx serves static files (faster than Node.js)
- Gzip compression enabled
- SPA routing support (all routes → index.html)
- Security headers (X-Frame-Options, CSP, etc.)
- Non-root user

## Docker Compose Configuration

The `docker-compose.yml` orchestrates all services:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: coursesignal
      POSTGRES_USER: coursesignal
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coursesignal"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  backend:
    build: ./backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://coursesignal:${DB_PASSWORD}@postgres:5432/coursesignal
      REDIS_URL: redis://redis:6379
      # ... (see .env file for full list)
    healthcheck:
      test: ["CMD", "node", "-e", "..."]
      interval: 30s

  frontend:
    build: ./frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "80:80"

volumes:
  postgres_data:
  redis_data:
```

**Key Features:**
- Automatic service dependencies with health checks
- Persistent data volumes
- Environment variable substitution
- Restart policies for reliability

## Environment Configuration

### Backend Environment Variables

Copy `backend/.env.production.example` to `backend/.env` and configure:

**Required Variables:**

```bash
# Security (CRITICAL - generate unique values)
JWT_SECRET=<64-char-random-string>
ENCRYPTION_KEY=<32-char-hex-string>

# Database (auto-configured by Docker Compose)
DATABASE_URL=postgresql://coursesignal:${DB_PASSWORD}@postgres:5432/coursesignal

# Redis (auto-configured by Docker Compose)
REDIS_URL=redis://redis:6379

# OAuth - Kajabi
KAJABI_CLIENT_ID=your_kajabi_client_id
KAJABI_CLIENT_SECRET=your_kajabi_client_secret

# OAuth - Teachable
TEACHABLE_CLIENT_ID=your_teachable_client_id
TEACHABLE_CLIENT_SECRET=your_teachable_client_secret

# Email
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Stripe (optional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
APP_URL=https://yourdomain.com
NODE_ENV=production
PORT=3002
```

**Generate Secrets:**

```bash
# JWT Secret (64 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend Environment Variables

Copy `frontend/.env.production.example` to `frontend/.env.production`:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3002/api
```

**Note**: For production deployment on a server, change to your actual backend URL.

## Building Images

### Build Individual Images

```bash
# Backend
docker build -t coursesignal-backend:latest ./backend

# Frontend
docker build -t coursesignal-frontend:latest ./frontend
```

### Build All Images

```bash
docker-compose build
```

### Build with No Cache (Clean Build)

```bash
docker-compose build --no-cache
```

## Running the Application

### Start All Services

```bash
# Start in background
docker-compose up -d

# Start with logs visible
docker-compose up
```

### Run Database Migrations

**IMPORTANT**: Run this after first startup:

```bash
docker-compose exec backend npm run migrate
```

### Verify Services are Running

```bash
docker-compose ps

# Expected output:
# NAME                        STATUS
# coursesignal-postgres      Up (healthy)
# coursesignal-redis         Up (healthy)
# coursesignal-backend       Up (healthy)
# coursesignal-frontend      Up (healthy)
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:3002/health
# Expected: {"status":"ok","timestamp":"..."}

# Frontend health
curl -I http://localhost
# Expected: 200 OK

# Database health
docker-compose exec postgres pg_isready -U coursesignal
# Expected: accepting connections

# Redis health
docker-compose exec redis redis-cli ping
# Expected: PONG
```

## Managing Services

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Remove Services (Keep Data)

```bash
docker-compose down
```

### Remove Services and Data (DESTRUCTIVE)

```bash
# WARNING: This deletes all database data
docker-compose down -v
```

### View Resource Usage

```bash
docker stats
```

## Database Operations

### Access PostgreSQL Shell

```bash
docker-compose exec postgres psql -U coursesignal -d coursesignal
```

### Run SQL Commands

```bash
# Query example
docker-compose exec postgres psql -U coursesignal -d coursesignal -c "SELECT COUNT(*) FROM users;"

# Backup database
docker-compose exec postgres pg_dump -U coursesignal coursesignal > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U coursesignal -d coursesignal < backup_20241008.sql
```

### Database Maintenance

```bash
# Vacuum (reclaim space)
docker-compose exec postgres psql -U coursesignal -d coursesignal -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec postgres psql -U coursesignal -d coursesignal -c "SELECT pg_size_pretty(pg_database_size('coursesignal'));"
```

## Redis Operations

### Access Redis CLI

```bash
docker-compose exec redis redis-cli
```

### Common Redis Commands

```bash
# Check memory usage
docker-compose exec redis redis-cli INFO memory

# Check key count
docker-compose exec redis redis-cli DBSIZE

# Flush cache (use with caution)
docker-compose exec redis redis-cli FLUSHDB
```

## Production Deployment

### Option 1: VPS (DigitalOcean, Linode, AWS EC2)

**Requirements:**
- Ubuntu 22.04+ or similar Linux distro
- 2GB RAM minimum (4GB recommended)
- Docker and Docker Compose installed

**Steps:**

1. **SSH into server:**
```bash
ssh user@your-server-ip
```

2. **Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

3. **Clone repository:**
```bash
git clone https://github.com/yourusername/coursesignal.git
cd coursesignal
```

4. **Configure environment:**
```bash
cp backend/.env.production.example backend/.env
nano backend/.env  # Fill in production values
```

5. **Start services:**
```bash
docker-compose up -d
docker-compose exec backend npm run migrate
```

6. **Set up reverse proxy (Nginx or Caddy):**

**Caddy (recommended - automatic SSL):**

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

**Caddyfile:**
```
api.yourdomain.com {
    reverse_proxy localhost:3002
}

app.yourdomain.com {
    reverse_proxy localhost:80
}
```

```bash
# Start Caddy
sudo systemctl restart caddy
```

7. **Configure firewall:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Option 2: AWS ECS/Fargate

1. **Build and push images to ECR:**
```bash
# Create ECR repositories
aws ecr create-repository --repository-name coursesignal-backend
aws ecr create-repository --repository-name coursesignal-frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag images
docker build -t coursesignal-backend:latest ./backend
docker tag coursesignal-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/coursesignal-backend:latest

# Push images
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/coursesignal-backend:latest
```

2. **Create ECS task definitions and services**
3. **Set up RDS PostgreSQL and ElastiCache Redis**
4. **Configure Application Load Balancer**
5. **Set environment variables in ECS task definition**

### Option 3: Docker Swarm (High Availability)

For multi-server deployments:

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml coursesignal

# Scale services
docker service scale coursesignal_backend=3
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker-compose logs backend
```

**Common issues:**
- Missing environment variables
- Database connection failed
- Port already in use

### Database Connection Error

```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U coursesignal -d coursesignal -c "SELECT 1;"
```

### Permission Denied Errors

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Rebuild without cache
docker-compose build --no-cache
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase memory limit in docker-compose.yml:
services:
  backend:
    mem_limit: 512m
    mem_reservation: 256m
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3002

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

## Performance Optimization

### Image Size Optimization

The multi-stage builds already minimize image size. Further optimizations:

```dockerfile
# Use .dockerignore to exclude unnecessary files
# Install only production dependencies
RUN npm ci --only=production

# Remove cache after install
RUN npm cache clean --force
```

### Build Speed Optimization

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build

# Enable BuildKit by default
export DOCKER_BUILDKIT=1
```

### Runtime Optimization

**Backend:**
```bash
# Limit memory usage
NODE_OPTIONS="--max-old-space-size=512"

# Optimize connection pool
# In backend/src/db/connection.ts:
max: 20,  // Adjust based on load
```

**Database:**
```yaml
# In docker-compose.yml:
postgres:
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=1GB"
```

## Security Best Practices

### Container Security

1. **Non-root user** ✅ (already configured)
2. **Read-only filesystem** (optional):
```yaml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
```

3. **Drop capabilities**:
```yaml
services:
  backend:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

4. **Security scanning**:
```bash
# Scan for vulnerabilities
docker scout cves coursesignal-backend:latest
```

### Network Security

```yaml
# Isolate services
networks:
  frontend-network:
  backend-network:

services:
  frontend:
    networks:
      - frontend-network
  backend:
    networks:
      - frontend-network
      - backend-network
  postgres:
    networks:
      - backend-network  # Not exposed to frontend
```

### Secret Management

**DO NOT** store secrets in docker-compose.yml. Use:

1. **Environment files** (excluded from git)
2. **Docker secrets** (Swarm mode)
3. **External secret managers** (AWS Secrets Manager, Vault)

## Monitoring

### Container Health

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' coursesignal-backend

# Watch health checks
watch 'docker inspect --format="{{.State.Health.Status}}" coursesignal-backend'
```

### Log Monitoring

```bash
# Follow logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > logs_$(date +%Y%m%d).txt
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Prometheus + Grafana (advanced)
# See: https://docs.docker.com/config/daemon/prometheus/
```

## Backup and Restore

### Database Backup

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

docker-compose exec -T postgres pg_dump -U coursesignal coursesignal | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -type f -mtime +30 -delete
```

### Volume Backup

```bash
# Backup volume to tar
docker run --rm -v coursesignal_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_backup.tar.gz /data
```

### Restore Database

```bash
# From SQL dump
gunzip -c backup_20241008.sql.gz | docker-compose exec -T postgres psql -U coursesignal -d coursesignal
```

## Cost Estimation

### VPS Hosting (DigitalOcean)

- **$12/month** - 2GB RAM, 1 vCPU (Basic Droplet)
- **$24/month** - 4GB RAM, 2 vCPU (Recommended)

### AWS ECS

- **$30-50/month** - Fargate tasks (2 vCPU, 4GB RAM)
- **$50/month** - RDS PostgreSQL (db.t3.small)
- **$15/month** - ElastiCache Redis (t3.micro)
- **Total**: ~$95-115/month

### Azure Container Instances

- **$40/month** - Container instances
- **$70/month** - Azure Database for PostgreSQL
- **Total**: ~$110/month

## Next Steps

1. Review `backend/.env.production.example` and configure all variables
2. Generate security keys (JWT_SECRET, ENCRYPTION_KEY)
3. Test locally with `docker-compose up`
4. Deploy to production server
5. Run database migrations
6. Set up SSL with Caddy or Let's Encrypt
7. Configure monitoring and backups
8. Test complete user flows
9. Set up automated CI/CD (GitHub Actions, GitLab CI)

## Support

- **Documentation**: See `CLAUDE.md`, `README.md`, `DEPLOYMENT.md`
- **Issues**: https://github.com/yourusername/coursesignal/issues
- **Docker Help**: https://docs.docker.com/

---

**Last Updated**: October 2024
