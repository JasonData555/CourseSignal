# Security Documentation

Comprehensive security guide for CourseSignal application.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Encryption](#data-encryption)
4. [Environment Variables](#environment-variables)
5. [API Security](#api-security)
6. [Database Security](#database-security)
7. [Webhook Security](#webhook-security)
8. [Rate Limiting](#rate-limiting)
9. [CORS Policy](#cors-policy)
10. [Security Headers](#security-headers)
11. [Critical Pre-Production Fixes](#critical-pre-production-fixes)
12. [Security Audit Checklist](#security-audit-checklist)
13. [Incident Response](#incident-response)
14. [Vulnerability Disclosure](#vulnerability-disclosure)

---

## Security Overview

CourseSignal handles sensitive data including:
- User credentials (emails, passwords)
- OAuth access tokens (Kajabi, Teachable)
- Payment information (via Stripe)
- Customer purchase data
- Visitor tracking data

### Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal access rights
3. **Secure by Default** - Security built-in, not bolted-on
4. **Zero Trust** - Verify everything, trust nothing
5. **Data Minimization** - Collect only necessary data

### Threat Model

**External Threats:**
- Brute force attacks on login
- SQL injection attempts
- XSS attacks via user input
- CSRF attacks on authenticated endpoints
- Unauthorized OAuth access
- DDoS attacks
- Man-in-the-middle attacks

**Internal Threats:**
- Accidental data exposure in logs
- Insecure environment variables
- Unencrypted sensitive data
- Over-privileged database users

---

## Authentication & Authorization

### JWT Token Architecture

**Access Tokens:**
- Short-lived (15 minutes)
- Contains user ID and email
- Used for API authentication
- Signed with `JWT_SECRET`

**Refresh Tokens:**
- Long-lived (7 days)
- Stored in database with user association
- Used to obtain new access tokens
- Signed with `JWT_REFRESH_SECRET`
- Can be revoked

### Implementation

**Token Generation:**
```typescript
// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

export function generateAccessToken(payload: {
  userId: string;
  email: string;
}): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

export function generateRefreshToken(payload: {
  userId: string;
}): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}
```

**Token Verification:**
```typescript
export function verifyAccessToken(token: string): {
  userId: string;
  email: string;
} {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    return payload as { userId: string; email: string };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

**Middleware:**
```typescript
// backend/src/middleware/auth.ts
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

### Password Security

**Hashing:**
```typescript
import bcrypt from 'bcryptjs';

// Hash password on signup
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);

// Verify password on login
const isValid = await bcrypt.compare(password, user.password_hash);
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Validated using Zod schema

```typescript
// backend/src/utils/validation.ts
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number');
```

### Token Refresh Flow

```typescript
// POST /api/auth/refresh
export async function refreshToken(refreshToken: string) {
  // 1. Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // 2. Check if token exists in database
  const storedToken = await query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2',
    [refreshToken, payload.userId]
  );

  if (!storedToken.rows.length) {
    throw new Error('Invalid refresh token');
  }

  // 3. Check if expired
  if (new Date(storedToken.rows[0].expires_at) < new Date()) {
    throw new Error('Refresh token expired');
  }

  // 4. Generate new access token
  const user = await getUserById(payload.userId);
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  return { accessToken: newAccessToken };
}
```

### Token Revocation

```typescript
// DELETE /api/auth/logout
export async function revokeRefreshToken(userId: string, token: string) {
  await query(
    'DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2',
    [userId, token]
  );
}

// Revoke all user tokens (on password change)
export async function revokeAllUserTokens(userId: string) {
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}
```

---

## Data Encryption

### OAuth Token Encryption

**Critical:** OAuth tokens MUST be encrypted before storage.

```typescript
// backend/src/utils/encryption.ts
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Usage:**
```typescript
// Storing OAuth tokens
import { encrypt, decrypt } from '../utils/encryption';

// Save to database
await query(
  'INSERT INTO platform_integrations (user_id, platform, access_token, refresh_token) VALUES ($1, $2, $3, $4)',
  [
    userId,
    'kajabi',
    encrypt(accessToken),   // Encrypted
    encrypt(refreshToken),  // Encrypted
  ]
);

// Retrieve from database
const result = await query(
  'SELECT access_token, refresh_token FROM platform_integrations WHERE user_id = $1',
  [userId]
);

const accessToken = decrypt(result.rows[0].access_token);
const refreshToken = decrypt(result.rows[0].refresh_token);
```

### Encryption Key Requirements

**CRITICAL:** Encryption key MUST be:
- Exactly 32 characters (256-bit)
- Randomly generated
- Never committed to source control
- Rotated every 90 days (production)

**Generate secure key:**
```bash
# Generate 32-character key
openssl rand -base64 32 | cut -c1-32

# Example output: a3k9mX2pQ8vN4bZ7cY1wE5rT6uI0oP9j
```

**IMPORTANT:** If encryption key is lost, all encrypted data becomes unrecoverable. Back up securely.

---

## Environment Variables

### Secrets Management

**Never:**
- Commit `.env` files to git
- Log environment variables
- Include secrets in error messages
- Send secrets in API responses
- Store secrets in frontend code

**Always:**
- Use `.env.example` for templates
- Use platform secret managers (Railway, Render)
- Rotate secrets regularly
- Use different secrets per environment

### Required Environment Variables

**Critical Security Variables:**

```bash
# JWT secrets (minimum 32 characters)
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>

# Encryption key (exactly 32 characters)
ENCRYPTION_KEY=<32-character-random-string>

# Database connection (use SSL in production)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# OAuth secrets (from platform)
KAJABI_CLIENT_SECRET=<kajabi-secret>
TEACHABLE_CLIENT_SECRET=<teachable-secret>

# Email API key
SMTP_PASSWORD=<sendgrid-api-key>

# Stripe (if using billing)
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
```

### Validation

**Validate environment variables on startup:**

```typescript
// backend/src/index.ts
function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }

  // Validate ENCRYPTION_KEY length
  if (process.env.ENCRYPTION_KEY!.length !== 32) {
    console.error('ENCRYPTION_KEY must be exactly 32 characters');
    process.exit(1);
  }

  // Validate JWT secrets are different
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    process.exit(1);
  }
}

validateEnvironment();
```

---

## API Security

### Input Validation

**Use Zod for all API inputs:**

```typescript
import { z } from 'zod';

// Define schema
const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
});

// Validate input
app.post('/api/auth/signup', async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);
    // data is now type-safe and validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
  }
});
```

### SQL Injection Prevention

**Always use parameterized queries:**

```typescript
// ✅ SAFE: Parameterized query
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ UNSAFE: String interpolation
const result = await query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS Prevention

**Frontend sanitization:**

```typescript
// Don't render raw HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // ❌ UNSAFE

// Use text content instead
<div>{userInput}</div> // ✅ SAFE
```

**Backend sanitization:**

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user input before storing
const sanitizedInput = DOMPurify.sanitize(userInput);
```

### CSRF Protection

**SameSite cookies:**

```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

**CSRF tokens for state-changing operations:**

```typescript
// Generate CSRF token
const csrfToken = crypto.randomBytes(32).toString('hex');

// Store in session
req.session.csrfToken = csrfToken;

// Validate on POST requests
if (req.body.csrfToken !== req.session.csrfToken) {
  return res.status(403).json({ error: 'Invalid CSRF token' });
}
```

---

## Database Security

### Connection Security

**Always use SSL in production:**

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Database User Permissions

**Principle of least privilege:**

```sql
-- Create application-specific user (not superuser)
CREATE USER coursesignal_app WITH PASSWORD 'strong-password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE coursesignal TO coursesignal_app;
GRANT USAGE ON SCHEMA public TO coursesignal_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO coursesignal_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO coursesignal_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM coursesignal_app;
```

### Sensitive Data Protection

**Email masking in logs:**

```typescript
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.slice(0, 2) + '***' + local.slice(-1);
  return `${masked}@${domain}`;
}

console.log(`User logged in: ${maskEmail(user.email)}`);
// Output: "us***r@example.com"
```

**Redacting sensitive fields:**

```typescript
function redactUser(user: any) {
  const { password_hash, password_reset_token, ...safe } = user;
  return safe;
}

res.json(redactUser(user));
```

### Backup Encryption

```bash
# Encrypt backup
pg_dump $DATABASE_URL | gpg --encrypt --recipient your@email.com > backup.sql.gpg

# Decrypt backup
gpg --decrypt backup.sql.gpg | psql $DATABASE_URL
```

---

## Webhook Security

### Signature Verification

**Kajabi webhook verification:**

```typescript
import crypto from 'crypto';

function verifyKajabiSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

app.post('/api/webhooks/kajabi/:userId', (req, res) => {
  const signature = req.headers['x-kajabi-signature'] as string;
  const payload = JSON.stringify(req.body);
  const secret = process.env.KAJABI_WEBHOOK_SECRET!;

  if (!verifyKajabiSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
});
```

**Teachable webhook verification:**

```typescript
function verifyTeachableSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

**Stripe webhook verification:**

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

app.post('/api/webhooks/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      secret
    );
    // Process event
  } catch (error) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
});
```

### Webhook Replay Protection

```typescript
// Store processed webhook IDs
const processedWebhooks = new Set<string>();

app.post('/api/webhooks/kajabi/:userId', async (req, res) => {
  const webhookId = req.headers['x-webhook-id'] as string;

  // Check if already processed
  if (processedWebhooks.has(webhookId)) {
    return res.status(200).json({ message: 'Already processed' });
  }

  // Verify signature
  // ...

  // Process webhook
  // ...

  // Mark as processed
  processedWebhooks.add(webhookId);

  // Store in database for persistence
  await query(
    'INSERT INTO processed_webhooks (webhook_id, processed_at) VALUES ($1, NOW())',
    [webhookId]
  );
});
```

---

## Rate Limiting

### Implementation

**Auth endpoints (strict):**

```typescript
// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**API endpoints (moderate):**

```typescript
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Tracking endpoints (lenient):**

```typescript
export const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 events per minute per IP
  message: 'Rate limit exceeded',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Usage

```typescript
import { authLimiter, apiLimiter, trackingLimiter } from './middleware/rateLimit';

// Apply to specific routes
app.post('/api/auth/login', authLimiter, loginHandler);
app.post('/api/auth/signup', authLimiter, signupHandler);

// Apply to all API routes
app.use('/api', apiLimiter);

// Apply to tracking endpoints
app.post('/api/tracking/event', trackingLimiter, trackingHandler);
```

### Redis-Based Rate Limiting (Production)

For better performance with multiple server instances:

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
});

await client.connect();

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'rl:', // Rate limit prefix
  }),
  windowMs: 60 * 1000,
  max: 100,
});
```

---

## CORS Policy

### Configuration

**Development (permissive):**

```typescript
import cors from 'cors';

app.use(
  cors({
    origin: 'http://localhost:5173', // Frontend dev server
    credentials: true,
  })
);
```

**Production (restrictive):**

```typescript
const allowedOrigins = [
  'https://app.coursesignal.com',
  'https://coursesignal.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**Tracking script (public):**

```typescript
// Tracking endpoints need permissive CORS
app.use('/api/tracking', cors({ origin: '*' }));
app.use('/api/script', cors({ origin: '*' }));
```

---

## Security Headers

### Helmet.js

```typescript
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

### Manual Headers

```typescript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});
```

---

## Critical Pre-Production Fixes

### 1. Change Default Encryption Key

**Current issue:**
```typescript
// backend/src/utils/encryption.ts
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
```

**Fix:**
```typescript
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be set and exactly 32 characters');
}
```

### 2. Implement Webhook Signature Verification

**Current issue:** Webhook endpoints accept any request without verification.

**Fix:** Implement signature verification for all webhooks (see [Webhook Security](#webhook-security)).

### 3. Add Rate Limiting to All Routes

**Current issue:** Some routes may not have rate limiting.

**Fix:**
```typescript
// Apply global rate limiter
app.use('/api', apiLimiter);

// Stricter limits on auth
app.use('/api/auth', authLimiter);
```

### 4. Enable SSL for Database Connections

**Current issue:** Development uses unencrypted connections.

**Fix:**
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});
```

### 5. Implement CSRF Protection

**Current issue:** No CSRF tokens on state-changing operations.

**Fix:** Implement CSRF tokens or use SameSite cookies (see [CSRF Protection](#csrf-protection)).

### 6. Add Security Headers

**Current issue:** Missing security headers.

**Fix:** Add Helmet.js (see [Security Headers](#security-headers)).

### 7. Validate All Environment Variables on Startup

**Current issue:** App may start with invalid configuration.

**Fix:** Add validation function (see [Environment Variables](#validation)).

### 8. Rotate Default JWT Secrets

**Current issue:** May be using weak or default secrets.

**Fix:**
```bash
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

---

## Security Audit Checklist

### Pre-Production Audit

- [ ] All secrets stored in environment variables (not code)
- [ ] ENCRYPTION_KEY is exactly 32 characters and random
- [ ] JWT secrets are strong (32+ characters) and different
- [ ] Database connections use SSL in production
- [ ] All API inputs validated with Zod
- [ ] Parameterized queries used (no string interpolation)
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS configured restrictively (not `*` in production)
- [ ] Helmet.js security headers configured
- [ ] OAuth tokens encrypted before storage
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] Webhook signatures verified
- [ ] Sensitive data redacted from logs
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS enforced in production
- [ ] Security headers present (CSP, HSTS, X-Frame-Options)
- [ ] File uploads validated and sanitized (if applicable)
- [ ] Database backups encrypted
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented

### Regular Security Reviews

**Monthly:**
- [ ] Review access logs for suspicious activity
- [ ] Check for failed authentication attempts
- [ ] Review rate limit violations
- [ ] Update dependencies (`npm audit fix`)
- [ ] Review error logs for security issues

**Quarterly:**
- [ ] Rotate all secrets (JWT, encryption keys, API keys)
- [ ] Conduct penetration testing
- [ ] Review and update security policies
- [ ] Train team on security best practices

**Annually:**
- [ ] Third-party security audit
- [ ] Compliance review (GDPR, CCPA, etc.)
- [ ] Disaster recovery drill
- [ ] Update incident response plan

---

## Incident Response

### Security Incident Types

1. **Data Breach** - Unauthorized access to user data
2. **Account Compromise** - User account taken over
3. **DDoS Attack** - Service unavailability
4. **Vulnerability Discovery** - Security flaw found
5. **Malicious Activity** - Abuse of platform

### Incident Response Plan

**1. Detection & Assessment (0-1 hour)**
- Identify incident type and severity
- Determine affected systems and data
- Assess ongoing risk

**2. Containment (1-4 hours)**
- Isolate affected systems
- Block malicious traffic
- Revoke compromised credentials
- Enable enhanced logging

**3. Eradication (4-24 hours)**
- Remove malicious code/access
- Patch vulnerabilities
- Update security rules
- Reset affected credentials

**4. Recovery (24-72 hours)**
- Restore from clean backups
- Verify system integrity
- Monitor for recurrence
- Gradually restore services

**5. Post-Incident (1-2 weeks)**
- Document incident timeline
- Conduct root cause analysis
- Update security policies
- Notify affected users (if required)
- File reports (if required by law)

### Severity Levels

**Critical (P0):**
- Active data breach
- Complete service outage
- Widespread account compromise
- **Response time:** Immediate (24/7)

**High (P1):**
- Vulnerability with high exploit potential
- Partial service degradation
- Limited data exposure
- **Response time:** 4 hours

**Medium (P2):**
- Vulnerability with low exploit potential
- Individual account compromise
- Minor data exposure
- **Response time:** 24 hours

**Low (P3):**
- Theoretical vulnerability
- No immediate risk
- **Response time:** 1 week

### Communication Plan

**Internal:**
- Immediately notify: CTO, CEO, Security Team
- Regular updates every 2 hours during incident
- Post-incident debrief within 48 hours

**External:**
- Draft user communication template
- Prepare public statement (if needed)
- Coordinate with PR team
- Notify regulators (if required by law)

**User Notification Template:**
```
Subject: Important Security Update

Dear [User],

We recently discovered [brief description of incident].
We have taken immediate action to [containment steps].

What happened:
- [Timeline of incident]
- [Affected data/systems]

What we're doing:
- [Remediation steps]
- [Enhanced security measures]

What you should do:
- [User actions: change password, etc.]
- [Contact support if concerns]

We sincerely apologize for this incident and take your security seriously.

[Contact information]
```

### Emergency Contacts

**Internal:**
- Security Team: security@coursesignal.com
- On-call Engineer: [Phone/Pager]
- CTO: [Contact info]

**External:**
- Hosting Provider: [Railway/Render support]
- Database Provider: [Support contact]
- Security Consultant: [Contact info]

---

## Vulnerability Disclosure

### Responsible Disclosure Policy

We appreciate responsible disclosure of security vulnerabilities. If you discover a security issue, please:

**Do:**
1. Email security@coursesignal.com with details
2. Allow 90 days for remediation before public disclosure
3. Provide steps to reproduce
4. Avoid accessing user data
5. Document findings professionally

**Don't:**
1. Exploit vulnerabilities beyond proof-of-concept
2. Access, modify, or delete user data
3. Disrupt service availability
4. Publicly disclose before patch
5. Demand payment for disclosure

### Reporting Template

```
Subject: Security Vulnerability Report

Vulnerability Type: [SQL Injection, XSS, etc.]
Severity: [Critical, High, Medium, Low]
Affected Component: [URL/Service]

Description:
[Detailed description of vulnerability]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
...

Impact:
[What an attacker could do]

Proof of Concept:
[Code/screenshots demonstrating issue]

Suggested Fix:
[If you have recommendations]

Your Contact Info:
[For follow-up questions]
```

### Response Timeline

- **Acknowledgment:** Within 24 hours
- **Initial Assessment:** Within 3 days
- **Fix Development:** Within 30 days (critical), 90 days (others)
- **Disclosure:** After patch deployed + 7-day grace period

### Recognition

Security researchers who responsibly disclose vulnerabilities will be:
- Listed in our Security Hall of Fame (with permission)
- Eligible for bug bounty (if program active)
- Provided with disclosure credit

---

## Security Resources

### Tools

**Dependency Scanning:**
```bash
# Check for vulnerable dependencies
npm audit

# Automatically fix vulnerabilities
npm audit fix

# Force fix (may break changes)
npm audit fix --force
```

**Static Analysis:**
- ESLint with security plugin
- SonarQube
- Snyk

**Dynamic Analysis:**
- OWASP ZAP
- Burp Suite
- Postman security testing

**Secrets Detection:**
- git-secrets
- TruffleHog
- GitGuardian

### External Resources

**OWASP:**
- Top 10 Web Application Security Risks
- API Security Top 10
- Cheat Sheet Series

**Standards:**
- PCI DSS (if handling payments)
- GDPR (EU users)
- CCPA (California users)
- SOC 2 (enterprise customers)

**Training:**
- OWASP WebGoat
- HackerOne CTF
- PentesterLab
- PortSwigger Web Security Academy

---

## Compliance

### GDPR (General Data Protection Regulation)

**User Rights:**
- Right to access data (GET /api/user/data)
- Right to deletion (DELETE /api/user/account)
- Right to data portability (export functionality)
- Right to be forgotten

**Implementation:**
```typescript
// Export user data
app.get('/api/user/export', authenticate, async (req, res) => {
  const userId = req.user!.userId;

  const userData = await query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );

  const visitors = await query(
    `SELECT * FROM visitors WHERE user_id = $1`,
    [userId]
  );

  const purchases = await query(
    `SELECT * FROM purchases WHERE user_id = $1`,
    [userId]
  );

  res.json({
    user: userData.rows[0],
    visitors: visitors.rows,
    purchases: purchases.rows,
  });
});

// Delete user account and all data
app.delete('/api/user/account', authenticate, async (req, res) => {
  const userId = req.user!.userId;

  // Cascading deletes handled by database
  await query('DELETE FROM users WHERE id = $1', [userId]);

  res.json({ message: 'Account deleted' });
});
```

### Data Retention

**Policy:**
- Active user data: Retained indefinitely
- Deleted user data: Purged within 30 days
- Tracking events: Retained for 90 days
- Logs: Retained for 90 days
- Backups: Encrypted, retained for 30 days

---

## Final Security Checklist

Before going to production, verify:

### Critical
- [ ] All default secrets changed
- [ ] ENCRYPTION_KEY is 32 characters and random
- [ ] Database uses SSL in production
- [ ] HTTPS enforced (no HTTP)
- [ ] Webhook signatures verified
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Important
- [ ] Input validation on all endpoints
- [ ] OAuth tokens encrypted
- [ ] Passwords hashed with bcrypt
- [ ] CORS configured restrictively
- [ ] Error messages don't leak info
- [ ] Logs don't contain sensitive data

### Recommended
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Security audit completed
- [ ] Dependency scan clean
- [ ] Penetration testing performed

---

*Last updated: October 2024*

**For security concerns:** security@coursesignal.com
