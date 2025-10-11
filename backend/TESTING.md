# CourseSignal Backend Testing Infrastructure

## Overview

Comprehensive Jest testing infrastructure for the CourseSignal backend, including database utilities, mock data factories, and test helpers.

## Quick Start

```bash
# 1. Setup test database (one-time)
npm run test:setup

# 2. Run all tests
npm test

# 3. Run tests in watch mode
npm run test:watch

# 4. Generate coverage report
npm run test:coverage
```

## File Structure

### Configuration Files

- **`jest.config.js`** - Jest configuration with TypeScript support, coverage thresholds, and module path mapping
- **`.env.test`** - Test environment variables (uses `coursesignal_test` database)
- **`backend/package.json`** - Updated with test scripts

### Test Infrastructure (`src/__tests__/`)

```
src/__tests__/
├── utils/
│   ├── testDatabase.ts      # Database setup, teardown, transactions, queries
│   ├── factories.ts          # Mock data factories for all entities
│   ├── testHelpers.ts        # Test utilities, JWT generation, assertions
│   └── index.ts              # Central export point
├── scripts/
│   ├── setupTestDb.ts        # Database initialization script
│   └── teardownTestDb.ts     # Database cleanup script
├── setup.ts                  # Jest setup (runs before each test file)
├── globalSetup.ts            # Global setup (runs once at start)
├── globalTeardown.ts         # Global teardown (runs once at end)
├── example.test.ts           # Example test suite demonstrating all features
└── README.md                 # Detailed testing guide
```

## Test Utilities

### 1. Database Utilities (`testDatabase.ts`)

**Core Functions:**
- `setupTestDatabase()` - Initialize test database schema (idempotent)
- `clearTestDatabase()` - Delete all data while preserving schema
- `dropTestDatabase()` - Completely destroy database structure
- `closeTestDatabase()` - Close connection pool
- `query(sql, params)` - Execute SQL queries
- `getClient()` - Get connection for transactions
- `countRows(tableName)` - Count rows in a table
- `tableExists(tableName)` - Check if table exists

**Transaction Functions:**
- `beginTransaction()` - Start a transaction
- `commitTransaction(client)` - Commit a transaction
- `rollbackTransaction(client)` - Rollback a transaction

### 2. Mock Data Factories (`factories.ts`)

**Available Factories:**

```typescript
// User factory
const user = await createUser({
  email: 'test@example.com',
  password: 'Password123',
  emailVerified: true,
  subscriptionStatus: 'active'
});

// Visitor factory
const visitor = await createVisitor({
  userId: user.id,
  email: 'visitor@example.com',
  firstTouchData: { source: 'google', medium: 'cpc' }
});

// Session factory
const session = await createSession({
  visitorId: visitor.id,
  source: 'facebook',
  medium: 'social'
});

// Purchase factory
const purchase = await createPurchase({
  userId: user.id,
  visitorId: visitor.id,
  amount: 99.99,
  platform: 'kajabi'
});

// Launch factory
const launch = await createLaunch({
  userId: user.id,
  title: 'Summer Launch',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-14')
});

// Complete visitor journey
const journey = await createVisitorJourney({
  email: 'customer@example.com',
  sessions: 3,
  purchase: true
});
// Returns: { user, visitor, sessions[], purchase }
```

**All Factories:**
- `createUser(options?)`
- `createVisitor(options?)`
- `createSession(options?)`
- `createPurchase(options?)`
- `createLaunch(options?)`
- `createPlatformIntegration(options?)`
- `createTrackingScript(options?)`
- `createRefreshToken(options?)`
- `createVisitorJourney(options?)`

### 3. Test Helpers (`testHelpers.ts`)

**JWT & Authentication:**
```typescript
const token = generateTestAccessToken({ userId: '123', email: 'test@example.com' });
const api = authenticatedRequest(app, userId, email);
```

**Assertions:**
```typescript
expectValidUUID(uuid);
expectDateClose(date1, date2, toleranceMs);
await expectAsyncThrow(fn, 'Expected error message');
expectSuccessResponse(response, 200);
expectErrorResponse(response, 404, 'Not found');
expectValidPaginationResponse(response);
```

**Mock Objects:**
```typescript
const req = mockRequest({ body: { email: 'test@example.com' } });
const res = mockResponse();
const next = mockNext();
```

**Random Data Generation:**
```typescript
randomTestData.email()        // => 'test-abc123@example.com'
randomTestData.string(10)     // => 'xj29dk3s'
randomTestData.number(1, 100) // => 42
randomTestData.boolean()      // => true
randomTestData.date(7)        // => Date 7 days from now
randomTestData.uuid()         // => '123e4567-...'
randomTestData.url()          // => 'https://example-abc123.com'
```

**Utilities:**
```typescript
await wait(1000);  // Sleep for 1 second
await retry(fn, { retries: 3, delay: 100 });  // Retry flaky operations
const cleanup = mockEnv({ NODE_ENV: 'test' });  // Mock environment variables
const items = await createBatch(10, createUser);  // Create multiple items
```

## Writing Tests

### Basic Test Structure

```typescript
import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  createUser,
  expectValidUUID,
} from './__tests__/utils';

describe('My Feature', () => {
  // Run once before all tests
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // Clean database before each test
  beforeEach(async () => {
    await clearTestDatabase();
  });

  // Close connections after all tests
  afterAll(async () => {
    await closeTestDatabase();
  });

  it('should create a user', async () => {
    const user = await createUser();
    expectValidUUID(user.id);
    expect(user.email).toMatch(/@example\.com$/);
  });
});
```

### Testing Services

```typescript
import * as authService from '../services/authService';

describe('AuthService', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it('should authenticate valid credentials', async () => {
    await createUser({
      email: 'test@example.com',
      password: 'Password123',
    });

    const result = await authService.login('test@example.com', 'Password123');

    expect(result.accessToken).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });
});
```

### Testing API Routes

```typescript
import request from 'supertest';
import app from '../index';
import { createUser, generateTestAccessToken } from './__tests__/utils';

describe('API Routes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it('should require authentication', async () => {
    await request(app)
      .get('/api/analytics')
      .expect(401);
  });

  it('should return analytics for authenticated user', async () => {
    const user = await createUser();
    const token = generateTestAccessToken({
      userId: user.id,
      email: user.email,
    });

    const response = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toBeDefined();
  });
});
```

## Test Scripts

### Available Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report (HTML + terminal output)
npm run test:coverage

# Run tests with verbose output (shows all test names)
npm run test:verbose

# Setup test database (create database + apply schema)
npm run test:setup

# Teardown test database (delete database - requires confirmation)
npm run test:teardown

# Force teardown without confirmation
npm run test:teardown -- --force
```

## Configuration

### Jest Configuration (`jest.config.js`)

- **Preset:** `ts-jest` for TypeScript support
- **Test Environment:** Node.js
- **Test Match:** `**/__tests__/**/*.test.ts`, `**/__tests__/**/*.spec.ts`
- **Coverage Threshold:** 70% for branches, functions, lines, statements
- **Test Timeout:** 10 seconds
- **Execution Mode:** Sequential (`--runInBand`) for database isolation

### Environment Variables (`.env.test`)

Key differences from development:
- `NODE_ENV=test`
- `DATABASE_URL=postgresql://localhost:5432/coursesignal_test` (separate database)
- Test credentials for external services
- Consistent secrets for reproducible tests

## Best Practices

### 1. Always Clean Between Tests

```typescript
beforeEach(async () => {
  await clearTestDatabase();  // Ensures test isolation
});
```

### 2. Use Factories for Test Data

```typescript
// Good - flexible and maintainable
const user = await createUser({ email: 'test@example.com' });

// Avoid - brittle and verbose
await query('INSERT INTO users (email, password_hash, ...) VALUES (...)');
```

### 3. Test Behavior, Not Implementation

```typescript
// Good - tests what the user experiences
it('should reject duplicate emails', async () => {
  await createUser({ email: 'test@example.com' });
  await expect(
    createUser({ email: 'test@example.com' })
  ).rejects.toThrow('User already exists');
});

// Avoid - tests internal implementation
it('should call query with INSERT statement', async () => {
  const spy = jest.spyOn(db, 'query');
  await createUser();
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('INSERT'));
});
```

### 4. Name Tests Descriptively

```typescript
// Good
it('should attribute purchase to most recent session within 24 hours');

// Avoid
it('test attribution');
```

### 5. Close Connections

```typescript
afterAll(async () => {
  await closeTestDatabase();  // Prevents connection leaks
});
```

## Dependencies Installed

The following packages were added to `devDependencies`:

```json
{
  "ts-jest": "^29.4.4",
  "@types/pg": "^8.15.5",
  "supertest": "^7.1.4",
  "@types/supertest": "^6.0.3"
}
```

Existing dependencies used:
- `jest` - Test runner
- `@types/jest` - TypeScript types for Jest
- `pg` - PostgreSQL client
- `bcrypt` - Password hashing (used in factories)
- `uuid` - UUID generation
- `jsonwebtoken` - JWT token generation

## Troubleshooting

### Database Already Exists

```bash
npm run test:teardown --force
npm run test:setup
```

### Port Conflicts

If port 3002 is in use:
```bash
lsof -ti:3002 | xargs kill -9
```

### Schema Out of Sync

The `setupTestDatabase()` function is idempotent. If you update the schema:
```bash
npm run test:teardown --force
npm run test:setup
```

### Slow Tests

- Tests run sequentially (`--runInBand`) for database isolation
- This is intentional to prevent race conditions
- Individual test files can still run in parallel

## Coverage Reports

After running `npm run test:coverage`:

```bash
# View HTML report
open coverage/index.html

# View LCOV report (for CI/CD integration)
cat coverage/lcov.info
```

Coverage thresholds are set to 70% globally. Aim to exceed this for critical business logic (services, attribution, analytics).

## Example Test

See `src/__tests__/example.test.ts` for a comprehensive example demonstrating:
- All factory methods
- Database utilities
- Test helpers
- Integration testing patterns
- Complete visitor journey testing

## Next Steps

1. **Write Service Tests** - Start with `authService.ts`, `attributionService.ts`
2. **Write Route Tests** - Test API endpoints with `supertest`
3. **Write Integration Tests** - Test complete flows (signup → tracking → purchase → attribution)
4. **Achieve Coverage Goals** - Aim for 80%+ coverage on critical paths
5. **Add CI/CD** - Integrate with GitHub Actions or similar

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [Node.js PostgreSQL Guide](https://node-postgres.com/)
