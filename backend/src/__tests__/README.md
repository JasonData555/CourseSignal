# CourseSignal Backend Testing Guide

This directory contains the comprehensive testing infrastructure for the CourseSignal backend.

## Quick Start

### 1. Setup Test Database

First, create and initialize the test database:

```bash
npm run test:setup
```

This creates a `coursesignal_test` database and applies the schema.

### 2. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

### 3. Teardown (Optional)

To completely remove the test database:

```bash
npm run test:teardown
```

**Warning:** This permanently deletes the test database. You will be prompted for confirmation.

## Directory Structure

```
__tests__/
├── utils/
│   ├── testDatabase.ts      # Database setup, teardown, and query utilities
│   ├── factories.ts          # Mock data factories for all entities
│   ├── testHelpers.ts        # Common test utilities and helpers
│   └── index.ts              # Central export point
├── scripts/
│   ├── setupTestDb.ts        # Test database setup script
│   └── teardownTestDb.ts     # Test database teardown script
├── setup.ts                  # Jest setup file (runs before each test file)
├── globalSetup.ts            # Global setup (runs once before all tests)
├── globalTeardown.ts         # Global teardown (runs once after all tests)
├── example.test.ts           # Example test suite
└── README.md                 # This file
```

## Writing Tests

### Basic Test Structure

```typescript
import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  createUser,
  createPurchase,
  expectValidUUID,
} from './utils';

describe('My Feature', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase(); // Clean slate for each test
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it('should do something', async () => {
    const user = await createUser();
    expect(user.id).toBeDefined();
    expectValidUUID(user.id);
  });
});
```

### Using Factories

Factories create test data with sensible defaults:

```typescript
// Create with defaults
const user = await createUser();
const visitor = await createVisitor();
const purchase = await createPurchase();

// Create with custom values
const user = await createUser({
  email: 'custom@test.com',
  emailVerified: true,
  subscriptionStatus: 'active',
});

// Create related entities
const user = await createUser();
const visitor = await createVisitor({ userId: user.id });
const session = await createSession({ visitorId: visitor.id });

// Create a complete visitor journey
const journey = await createVisitorJourney({
  email: 'customer@example.com',
  sessions: 3,
  purchase: true,
});
// Returns: { user, visitor, sessions[], purchase }
```

### Available Factories

- `createUser(options?)` - Creates a user with hashed password
- `createVisitor(options?)` - Creates a visitor with first-touch data
- `createSession(options?)` - Creates a session with UTM parameters
- `createPurchase(options?)` - Creates a purchase with attribution
- `createLaunch(options?)` - Creates a launch
- `createPlatformIntegration(options?)` - Creates a platform integration
- `createTrackingScript(options?)` - Creates a tracking script
- `createRefreshToken(options?)` - Creates a refresh token
- `createVisitorJourney(options?)` - Creates a complete user → visitor → sessions → purchase flow

### Testing API Routes

Use `supertest` for API testing:

```typescript
import request from 'supertest';
import app from '../index'; // Your Express app
import { authenticatedRequest, generateTestAccessToken } from './utils';

describe('API Tests', () => {
  it('should require authentication', async () => {
    const response = await request(app)
      .get('/api/analytics')
      .expect(401);
  });

  it('should allow authenticated requests', async () => {
    const user = await createUser();
    const token = generateTestAccessToken({
      userId: user.id,
      email: user.email,
    });

    const response = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  // Or use the helper
  it('should use authenticated helper', async () => {
    const user = await createUser();
    const api = authenticatedRequest(app, user.id, user.email);

    await api.get('/api/analytics').expect(200);
    await api.post('/api/launches').send({ title: 'Test' }).expect(201);
  });
});
```

### Database Utilities

```typescript
import { query, countRows, getClient, beginTransaction } from './utils';

// Direct queries
const result = await query('SELECT * FROM users WHERE email = $1', ['test@example.com']);

// Count rows
const userCount = await countRows('users');

// Transactions
const client = await beginTransaction();
try {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO visitors ...');
  await commitTransaction(client);
} catch (error) {
  await rollbackTransaction(client);
}
```

### Test Helpers

```typescript
import {
  expectValidUUID,
  expectDateClose,
  expectAsyncThrow,
  expectSuccessResponse,
  expectErrorResponse,
  randomTestData,
  wait,
  retry,
} from './utils';

// UUID validation
expectValidUUID(user.id);

// Date comparison with tolerance
expectDateClose(actualDate, expectedDate, 1000); // 1 second tolerance

// Async error testing
await expectAsyncThrow(
  async () => { throw new Error('Test error'); },
  'Test error'
);

// Response validation
expectSuccessResponse(response, 200);
expectErrorResponse(response, 404, 'Not found');

// Random test data
const email = randomTestData.email();
const string = randomTestData.string(10);
const number = randomTestData.number(1, 100);
const date = randomTestData.date(7); // 7 days from now

// Wait/sleep
await wait(1000); // Wait 1 second

// Retry flaky operations
await retry(
  async () => { /* some operation */ },
  { retries: 3, delay: 100 }
);
```

## Configuration

### Environment Variables

Test environment variables are loaded from `.env.test`:

```bash
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/coursesignal_test
JWT_SECRET=test-jwt-secret-key-for-testing
# ... etc
```

### Jest Configuration

Configuration is in `jest.config.js`:

- TypeScript support via `ts-jest`
- Coverage thresholds: 70% for branches, functions, lines, statements
- Module path mapping for clean imports
- Test timeout: 10 seconds
- Sequential execution (`--runInBand`) for database tests

## Best Practices

### 1. Isolate Tests

Always clean the database before each test:

```typescript
beforeEach(async () => {
  await clearTestDatabase();
});
```

### 2. Close Connections

Always close database connections after tests:

```typescript
afterAll(async () => {
  await closeTestDatabase();
});
```

### 3. Use Factories

Prefer factories over manual data creation:

```typescript
// Good
const user = await createUser({ email: 'test@example.com' });

// Avoid (unless testing specific SQL)
await query('INSERT INTO users ...');
```

### 4. Test Behavior, Not Implementation

```typescript
// Good - tests behavior
it('should create a purchase with attribution', async () => {
  const purchase = await createPurchase({
    firstTouchSource: 'google',
  });
  expect(purchase.first_touch_source).toBe('google');
});

// Avoid - tests implementation
it('should call query with correct SQL', async () => {
  const spy = jest.spyOn(db, 'query');
  await createPurchase();
  expect(spy).toHaveBeenCalledWith(...);
});
```

### 5. Name Tests Clearly

```typescript
// Good
it('should reject invalid email addresses');
it('should attribute purchase to most recent session');

// Avoid
it('test1');
it('works');
```

### 6. Keep Tests Fast

- Use `clearTestDatabase()` instead of `dropTestDatabase()` between tests
- Avoid unnecessary `await` statements
- Mock external services (email, APIs) when possible

## Troubleshooting

### Database Connection Errors

If you see "database does not exist":
```bash
npm run test:setup
```

### Schema Out of Sync

If schema changes aren't reflected:
```bash
npm run test:teardown --force
npm run test:setup
```

### Port Already in Use

Tests run on the same port as development. Stop dev server:
```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9
```

### Slow Tests

Tests should run in parallel per file but sequential within files (`--runInBand`). If tests are slow:
- Check for missing indexes in test database
- Reduce factory-generated data
- Mock external API calls

## Coverage Reports

After running `npm run test:coverage`, view the report:

```bash
# CLI summary in terminal

# HTML report
open coverage/index.html
```

Coverage thresholds are set to 70%. Aim to exceed these for critical business logic.

## Example Test Files

See `example.test.ts` for a comprehensive example demonstrating:
- Factory usage
- Database utilities
- Test helpers
- Integration testing patterns

## Writing Service Tests

Example for testing a service:

```typescript
import * as authService from '../services/authService';
import { setupTestDatabase, clearTestDatabase, closeTestDatabase, createUser } from './utils';

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

  describe('signup', () => {
    it('should create a new user', async () => {
      const result = await authService.signup('test@example.com', 'Password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.emailVerified).toBe(false);
    });

    it('should reject duplicate emails', async () => {
      await authService.signup('test@example.com', 'Password123');

      await expect(
        authService.signup('test@example.com', 'Password456')
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      const result = await authService.login('test@example.com', 'Password123');

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      await expect(
        authService.login('test@example.com', 'WrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
