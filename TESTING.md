# Testing Guide

Comprehensive guide for testing CourseSignal application.

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Database Management](#test-database-management)
6. [Coverage Requirements](#coverage-requirements)
7. [CI/CD Integration](#cicd-integration)
8. [Debugging Tests](#debugging-tests)
9. [Best Practices](#best-practices)

---

## Overview

CourseSignal uses **Jest** as the primary testing framework with comprehensive test utilities for creating test data, managing test databases, and verifying application behavior.

### Test Types

**Unit Tests:**
- Individual functions and utilities
- Services in isolation
- Utilities (JWT, encryption, validation)

**Integration Tests:**
- API endpoints with database
- Service interactions
- OAuth flows
- Attribution logic

**End-to-End Tests:**
- Complete user flows
- Multi-service interactions
- Background job processing

### Test Coverage Goals

- **Overall:** 80% minimum
- **Critical paths:** 95% (attribution, auth, purchases)
- **Services:** 85%
- **Utilities:** 90%
- **Routes:** 80%

---

## Test Infrastructure

### Project Structure

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── scripts/
│   │   │   ├── setupTestDb.ts        # Create test database
│   │   │   └── teardownTestDb.ts     # Destroy test database
│   │   ├── utils/
│   │   │   ├── testDatabase.ts       # Database utilities
│   │   │   ├── testHelpers.ts        # General helpers
│   │   │   └── factories.ts          # Test data factories
│   │   ├── services/                 # Service tests
│   │   ├── routes/                   # API endpoint tests
│   │   └── example.test.ts           # Example test suite
│   ├── services/
│   ├── routes/
│   └── utils/
├── jest.config.js
└── package.json
```

### Test Database

CourseSignal uses a **separate test database** to avoid polluting production or development data.

**Database naming convention:**
- Development: `coursesignal`
- Test: `coursesignal_test`
- Production: `coursesignal` (production server)

### Test Utilities

**1. testDatabase.ts** - Database operations
- `setupTestDatabase()` - Initialize test DB
- `clearTestDatabase()` - Clear all data
- `closeTestDatabase()` - Close connections
- `query()` - Execute SQL queries
- `countRows()` - Count rows in table

**2. testHelpers.ts** - General helpers
- `generateTestAccessToken()` - Create JWT tokens
- `expectValidUUID()` - Validate UUID format
- `expectDateClose()` - Compare dates with tolerance
- `randomTestData` - Generate random test data

**3. factories.ts** - Test data creation
- `createUser()` - Create test user
- `createVisitor()` - Create test visitor
- `createSession()` - Create test session
- `createPurchase()` - Create test purchase
- `createLaunch()` - Create test launch
- `createVisitorJourney()` - Create complete user journey

---

## Running Tests

### Prerequisites

```bash
# 1. Install dependencies
npm install

# 2. Create test database
createdb coursesignal_test

# 3. Set test environment
export NODE_ENV=test
export DATABASE_URL=postgresql://localhost:5432/coursesignal_test
```

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Run specific test file
npm test -- services/attributionService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="attribution"
```

### Setup Test Database

**Automated (recommended):**
```bash
npm run test:setup
```

**Manual:**
```bash
createdb coursesignal_test
DATABASE_URL=postgresql://localhost:5432/coursesignal_test npm run migrate
```

### Teardown Test Database

**Automated:**
```bash
npm run test:teardown
```

**Manual:**
```bash
dropdb coursesignal_test
```

### Watch Mode Workflow

Recommended for active development:

```bash
# Terminal 1: Run tests in watch mode
npm run test:watch

# Terminal 2: Make code changes
# Tests automatically re-run when files change
```

---

## Writing Tests

### Test File Structure

```typescript
import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  query,
  countRows,
} from '../utils/testDatabase';

import { createUser, createVisitor } from '../utils/factories';
import { generateTestAccessToken } from '../utils/testHelpers';

describe('Feature Name', () => {
  // Setup: Run once before all tests
  beforeAll(async () => {
    await setupTestDatabase();
  });

  // Cleanup: Run before each test
  beforeEach(async () => {
    await clearTestDatabase();
  });

  // Teardown: Run once after all tests
  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Specific functionality', () => {
    it('should behave as expected', async () => {
      // Arrange
      const user = await createUser();

      // Act
      const result = await someFunction(user.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});
```

### Example: Testing a Service

```typescript
// backend/src/__tests__/services/authService.test.ts

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from '../utils/testDatabase';

import { createUser } from '../utils/factories';
import * as authService from '../../services/authService';

describe('Auth Service', () => {
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
      const result = await authService.signup(
        'test@example.com',
        'Password123'
      );

      expect(result).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.email_verified).toBe(false);
      expect(result.token).toBeDefined();
    });

    it('should not allow duplicate emails', async () => {
      await createUser({ email: 'test@example.com' });

      await expect(
        authService.signup('test@example.com', 'Password123')
      ).rejects.toThrow('Email already exists');
    });

    it('should hash password', async () => {
      const result = await authService.signup(
        'test@example.com',
        'Password123'
      );

      // Password should be hashed, not plain text
      expect(result.user.password_hash).not.toBe('Password123');
      expect(result.user.password_hash.length).toBeGreaterThan(50);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      const result = await authService.login(
        'test@example.com',
        'Password123'
      );

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await createUser({
        email: 'test@example.com',
        password: 'Password123',
      });

      await expect(
        authService.login('test@example.com', 'WrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'Password123')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Example: Testing an API Route

```typescript
// backend/src/__tests__/routes/analytics.test.ts

import request from 'supertest';
import app from '../../index';
import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from '../utils/testDatabase';

import {
  createUser,
  createPurchase,
  createVisitorJourney,
} from '../utils/factories';

import { generateTestAccessToken } from '../utils/testHelpers';

describe('Analytics Routes', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /api/analytics/summary', () => {
    it('should return revenue summary', async () => {
      const user = await createUser();
      const token = generateTestAccessToken({
        userId: user.id,
        email: user.email,
      });

      // Create test purchases
      await createPurchase({ userId: user.id, amount: 100 });
      await createPurchase({ userId: user.id, amount: 200 });

      const response = await request(app)
        .get('/api/analytics/summary?range=30d')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.totalRevenue).toBe(300);
      expect(response.body.totalPurchases).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/summary');

      expect(response.status).toBe(401);
    });

    it('should filter by date range', async () => {
      const user = await createUser();
      const token = generateTestAccessToken({
        userId: user.id,
        email: user.email,
      });

      // Recent purchase
      await createPurchase({
        userId: user.id,
        amount: 100,
        purchasedAt: new Date(),
      });

      // Old purchase (outside range)
      await createPurchase({
        userId: user.id,
        amount: 200,
        purchasedAt: new Date('2020-01-01'),
      });

      const response = await request(app)
        .get('/api/analytics/summary?range=30d')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.totalRevenue).toBe(100); // Only recent purchase
    });
  });
});
```

### Example: Testing Attribution Logic

```typescript
// backend/src/__tests__/services/attributionService.test.ts

import {
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from '../utils/testDatabase';

import {
  createUser,
  createVisitorJourney,
} from '../utils/factories';

import * as attributionService from '../../services/attributionService';

describe('Attribution Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('attributePurchase', () => {
    it('should match by email', async () => {
      const journey = await createVisitorJourney({
        email: 'customer@example.com',
        sessions: 3,
        purchase: false,
      });

      const purchase = {
        email: 'customer@example.com',
        amount: 99.99,
        platform: 'kajabi',
        platformPurchaseId: 'purchase-123',
        purchasedAt: new Date(),
      };

      const result = await attributionService.attributePurchase(
        journey.user.id,
        purchase
      );

      expect(result.status).toBe('matched');
      expect(result.visitorId).toBe(journey.visitor.id);
      expect(result.firstTouch).toBeDefined();
      expect(result.lastTouch).toBeDefined();
    });

    it('should handle multiple sessions', async () => {
      const journey = await createVisitorJourney({
        email: 'customer@example.com',
        sessions: 3,
        purchase: false,
      });

      const purchase = {
        email: 'customer@example.com',
        amount: 99.99,
        platform: 'kajabi',
        platformPurchaseId: 'purchase-123',
        purchasedAt: new Date(),
      };

      const result = await attributionService.attributePurchase(
        journey.user.id,
        purchase
      );

      // First touch should be first session
      expect(result.firstTouch.source).toBe(
        journey.sessions[0].source
      );

      // Last touch should be most recent session
      expect(result.lastTouch.source).toBe(
        journey.sessions[journey.sessions.length - 1].source
      );
    });

    it('should mark as unmatched when no visitor found', async () => {
      const user = await createUser();

      const purchase = {
        email: 'unknown@example.com',
        amount: 99.99,
        platform: 'kajabi',
        platformPurchaseId: 'purchase-123',
        purchasedAt: new Date(),
      };

      const result = await attributionService.attributePurchase(
        user.id,
        purchase
      );

      expect(result.status).toBe('unmatched');
      expect(result.visitorId).toBeNull();
    });

    it('should auto-assign to active launch', async () => {
      const user = await createUser();
      const journey = await createVisitorJourney({
        email: 'customer@example.com',
        sessions: 1,
        purchase: false,
      });

      // Create active launch
      const launch = await createLaunch({
        userId: user.id,
        status: 'active',
        startDate: new Date(Date.now() - 86400000), // Yesterday
        endDate: new Date(Date.now() + 86400000), // Tomorrow
      });

      const purchase = {
        email: 'customer@example.com',
        amount: 99.99,
        platform: 'kajabi',
        platformPurchaseId: 'purchase-123',
        purchasedAt: new Date(), // Within launch date range
      };

      const result = await attributionService.attributePurchase(
        user.id,
        purchase
      );

      expect(result.launchId).toBe(launch.id);
    });
  });
});
```

### Using Test Factories

Test factories simplify creating test data:

```typescript
import {
  createUser,
  createVisitor,
  createSession,
  createPurchase,
  createLaunch,
  createVisitorJourney,
} from '../utils/factories';

// Create user with defaults
const user = await createUser();

// Create user with custom values
const user = await createUser({
  email: 'custom@example.com',
  password: 'CustomPass123',
  emailVerified: true,
  subscriptionStatus: 'active',
});

// Create visitor for specific user
const visitor = await createVisitor({ userId: user.id });

// Create visitor with custom attribution
const visitor = await createVisitor({
  email: 'customer@example.com',
  firstTouchSource: 'facebook',
  firstTouchMedium: 'social',
});

// Create session for visitor
const session = await createSession({
  visitorId: visitor.id,
  source: 'google',
  medium: 'cpc',
  campaign: 'summer-sale',
});

// Create purchase
const purchase = await createPurchase({
  userId: user.id,
  visitorId: visitor.id,
  amount: 199.99,
  platform: 'teachable',
});

// Create complete visitor journey
const journey = await createVisitorJourney({
  email: 'journey@example.com',
  sessions: 3, // Create 3 sessions
  purchase: true, // Include purchase
});

// journey contains: user, visitor, sessions[], purchase
```

---

## Test Database Management

### Database Lifecycle

**Per Test Suite:**
```typescript
beforeAll(async () => {
  // 1. Connect to test database
  // 2. Run migrations
  await setupTestDatabase();
});

beforeEach(async () => {
  // 3. Clear all data (keep schema)
  await clearTestDatabase();
});

afterAll(async () => {
  // 4. Close connections
  await closeTestDatabase();
});
```

### Database Utilities

**1. Query Execution**

```typescript
import { query } from '../utils/testDatabase';

// Select query
const result = await query('SELECT * FROM users WHERE email = $1', [
  'test@example.com',
]);
expect(result.rows).toHaveLength(1);

// Insert query
await query(
  'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
  ['test@example.com', 'hashed']
);

// Update query
await query('UPDATE users SET email_verified = true WHERE id = $1', [
  userId,
]);

// Delete query
await query('DELETE FROM users WHERE email = $1', ['test@example.com']);
```

**2. Row Counting**

```typescript
import { countRows } from '../utils/testDatabase';

// Count all rows
const userCount = await countRows('users');
expect(userCount).toBe(5);

// Count with condition
const activeCount = await countRows(
  'users',
  "WHERE subscription_status = 'active'"
);
```

**3. Data Clearing**

```typescript
import { clearTestDatabase } from '../utils/testDatabase';

// Clear all tables (runs before each test)
await clearTestDatabase();

// Preserves schema, only deletes data
```

### Isolating Tests

**Why isolation matters:**
- Tests don't affect each other
- Tests can run in any order
- Tests can run in parallel

**How we achieve isolation:**
```typescript
beforeEach(async () => {
  await clearTestDatabase(); // Fresh state for each test
});

// Each test starts with clean database
it('test 1', async () => {
  const user = await createUser({ email: 'test1@example.com' });
  // ...
});

it('test 2', async () => {
  const user = await createUser({ email: 'test2@example.com' });
  // test2 doesn't see test1's user
});
```

---

## Coverage Requirements

### Running Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in terminal
# Coverage summary appears at end

# View coverage in browser
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Configured in `jest.config.js`:

```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/services/attributionService.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
```

### Coverage Targets by Category

| Category | Target | Rationale |
|----------|--------|-----------|
| Attribution logic | 95% | Critical business logic |
| Authentication | 95% | Security critical |
| Payment processing | 95% | Financial operations |
| Services | 85% | Core business logic |
| Routes | 80% | API endpoints |
| Utilities | 90% | Shared functionality |
| Overall | 80% | General health |

### Improving Coverage

**Identify uncovered code:**
```bash
npm run test:coverage

# Look for red lines in coverage/lcov-report/index.html
```

**Add missing tests:**
```typescript
// If coverage shows this branch is untested:
if (user.emailVerified) {
  sendWelcomeEmail(user.email); // Red line - not tested
}

// Add test:
it('should send welcome email to verified users', async () => {
  const user = await createUser({ emailVerified: true });
  const result = await someFunction(user.id);
  // Verify email was sent
  expect(emailSentTo).toBe(user.email);
});
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: coursesignal_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/coursesignal_test
          NODE_ENV: test
        run: npm run migrate

      - name: Run tests
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/coursesignal_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
          JWT_SECRET: test-secret-key
          JWT_REFRESH_SECRET: test-refresh-secret
          ENCRYPTION_KEY: test-encryption-key-32-chars!
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
image: node:18

services:
  - postgres:14
  - redis:7

variables:
  POSTGRES_DB: coursesignal_test
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres
  DATABASE_URL: postgresql://postgres:postgres@postgres:5432/coursesignal_test
  REDIS_URL: redis://redis:6379
  NODE_ENV: test
  JWT_SECRET: test-secret
  JWT_REFRESH_SECRET: test-refresh-secret
  ENCRYPTION_KEY: test-encryption-key-32-chars!

stages:
  - test

test:
  stage: test
  script:
    - npm ci
    - cd backend
    - npm run migrate
    - npm run test:coverage
  coverage: '/All files\s*\|\s*(\d+\.\d+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: backend/coverage/cobertura-coverage.xml
```

### Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests before commit
cd backend && npm test

# Check for passing tests
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

Install husky:
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "cd backend && npm test"
```

---

## Debugging Tests

### Running Single Test

```bash
# Run specific test file
npm test -- services/authService.test.ts

# Run specific test by name
npm test -- --testNamePattern="should create a new user"

# Run only tests in describe block
npm test -- --testNamePattern="Auth Service"
```

### Debug Mode

**VS Code Launch Configuration:**

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Current File",
      "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
      "args": [
        "${fileBasename}",
        "--config",
        "${workspaceFolder}/backend/jest.config.js",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "cwd": "${workspaceFolder}/backend",
      "env": {
        "NODE_ENV": "test"
      }
    }
  ]
}
```

**Usage:**
1. Open test file in VS Code
2. Press F5 or click "Run > Start Debugging"
3. Set breakpoints
4. Step through code

### Console Logging

```typescript
it('should debug a test', async () => {
  const user = await createUser();

  console.log('User created:', user);
  console.log('User ID:', user.id);

  // Logs appear in test output
});
```

### Snapshot Testing

Useful for testing complex objects:

```typescript
it('should match user snapshot', async () => {
  const user = await createUser({
    email: 'test@example.com',
  });

  // Remove dynamic fields
  const snapshot = {
    ...user,
    id: 'UUID',
    created_at: 'TIMESTAMP',
    updated_at: 'TIMESTAMP',
  };

  expect(snapshot).toMatchSnapshot();
});
```

### Common Issues

**Issue: Tests hang indefinitely**
```typescript
// Cause: Missing await
it('test', async () => {
  createUser(); // Missing await!
  // Test finishes before async operation
});

// Fix: Add await
it('test', async () => {
  await createUser(); // Proper await
});
```

**Issue: "Cannot read property of undefined"**
```typescript
// Cause: Database not setup
it('test', async () => {
  const user = await createUser(); // Fails if DB not setup
});

// Fix: Add beforeAll
beforeAll(async () => {
  await setupTestDatabase();
});
```

**Issue: "Database connection error"**
```bash
# Cause: DATABASE_URL not set
# Fix: Set environment variable
export DATABASE_URL=postgresql://localhost:5432/coursesignal_test
npm test
```

---

## Best Practices

### 1. Test Organization

```typescript
// Good: Descriptive test names
describe('Attribution Service', () => {
  describe('attributePurchase', () => {
    it('should match purchase to visitor by email', async () => {
      // ...
    });

    it('should use device fingerprint when email unavailable', async () => {
      // ...
    });
  });
});

// Bad: Vague test names
describe('Tests', () => {
  it('works', async () => {
    // What works?
  });
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should create user', async () => {
  // Arrange: Setup test data
  const email = 'test@example.com';
  const password = 'Password123';

  // Act: Execute the code being tested
  const user = await authService.signup(email, password);

  // Assert: Verify results
  expect(user.email).toBe(email);
  expect(user.email_verified).toBe(false);
});
```

### 3. Test Independence

```typescript
// Good: Each test is independent
it('test 1', async () => {
  const user = await createUser({ email: 'test1@example.com' });
  // ...
});

it('test 2', async () => {
  const user = await createUser({ email: 'test2@example.com' });
  // ...
});

// Bad: Tests depend on each other
let userId;

it('test 1', async () => {
  const user = await createUser();
  userId = user.id; // Global state
});

it('test 2', async () => {
  const user = await getUser(userId); // Depends on test 1
});
```

### 4. Mock External Services

```typescript
// Mock SendGrid email
jest.mock('../../services/emailService', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

it('should send verification email on signup', async () => {
  const emailService = require('../../services/emailService');

  await authService.signup('test@example.com', 'Password123');

  expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
    'test@example.com',
    expect.any(String)
  );
});
```

### 5. Test Error Cases

```typescript
describe('Error handling', () => {
  it('should handle invalid email', async () => {
    await expect(
      authService.signup('invalid-email', 'Password123')
    ).rejects.toThrow('Invalid email');
  });

  it('should handle duplicate email', async () => {
    await createUser({ email: 'test@example.com' });

    await expect(
      authService.signup('test@example.com', 'Password123')
    ).rejects.toThrow('Email already exists');
  });

  it('should handle database errors', async () => {
    // Mock database failure
    jest.spyOn(query, 'execute').mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      authService.signup('test@example.com', 'Password123')
    ).rejects.toThrow('Database error');
  });
});
```

### 6. Keep Tests Fast

```typescript
// Good: Use factories for fast test data creation
const user = await createUser();

// Bad: Manually create related records
const user = await query('INSERT INTO users...');
const visitor = await query('INSERT INTO visitors...');
const session = await query('INSERT INTO sessions...');
// Slow and verbose
```

### 7. Clean Up Resources

```typescript
// Good: Always close connections
afterAll(async () => {
  await closeTestDatabase();
});

// Bad: Leave connections open
// Tests may hang or fail
```

---

## Continuous Improvement

### Monitoring Test Health

**Track metrics:**
- Test execution time (should stay under 60s)
- Flaky test rate (< 1%)
- Coverage percentage (should increase over time)

**Tools:**
- Jest built-in reports
- Codecov for coverage trends
- CI/CD dashboards

### Updating Tests

When adding features:
1. Write tests first (TDD)
2. Ensure tests fail before implementation
3. Implement feature
4. Verify tests pass
5. Check coverage increases

When fixing bugs:
1. Write test that reproduces bug
2. Verify test fails
3. Fix bug
4. Verify test passes
5. Add test to prevent regression

---

## Resources

**Jest Documentation:**
- https://jestjs.io/docs/getting-started

**Testing Best Practices:**
- https://testingjavascript.com/
- https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

**CourseSignal Testing:**
- Example test suite: `backend/src/__tests__/example.test.ts`
- Test utilities: `backend/src/__tests__/utils/`
- Test factories: `backend/src/__tests__/utils/factories.ts`

---

*Last updated: October 2024*
