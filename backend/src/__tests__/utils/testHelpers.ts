import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import supertest from 'supertest';

/**
 * JWT token generation for testing
 */
export function generateTestAccessToken(payload: { userId: string; email: string }): string {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateTestRefreshToken(payload: { userId: string; email: string }): string {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * Create an authenticated request with supertest
 */
export function authenticatedRequest(
  app: any,
  userId: string,
  email: string
) {
  const token = generateTestAccessToken({ userId, email });
  return {
    get: (url: string) => supertest(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => supertest(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => supertest(app).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => supertest(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => supertest(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}

/**
 * Mock Express request object
 */
export function mockRequest(options: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  user?: any;
} = {}): Partial<Request> {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user,
  } as Partial<Request>;
}

/**
 * Mock Express response object with jest spies
 */
export function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Wait for a promise to resolve or reject
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Expect async function to throw with specific error message
 */
export async function expectAsyncThrow(
  fn: () => Promise<any>,
  expectedError?: string | RegExp
): Promise<void> {
  let error: Error | undefined;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  expect(error).toBeDefined();

  if (expectedError) {
    if (typeof expectedError === 'string') {
      expect(error?.message).toBe(expectedError);
    } else {
      expect(error?.message).toMatch(expectedError);
    }
  }
}

/**
 * Format dates consistently for testing
 */
export function formatTestDate(date: Date): string {
  return date.toISOString();
}

/**
 * Compare dates with tolerance (for timestamp comparisons)
 */
export function expectDateClose(actual: Date, expected: Date, toleranceMs = 1000) {
  const actualTime = actual.getTime();
  const expectedTime = expected.getTime();
  const diff = Math.abs(actualTime - expectedTime);

  expect(diff).toBeLessThanOrEqual(toleranceMs);
}

/**
 * Validate UUID format (accepts all UUID versions)
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Assert UUID format
 */
export function expectValidUUID(uuid: string) {
  expect(isValidUUID(uuid)).toBe(true);
}

/**
 * Mock environment variables for testing
 */
export function mockEnv(vars: Record<string, string>): () => void {
  const originalEnv = { ...process.env };

  Object.keys(vars).forEach(key => {
    process.env[key] = vars[key];
  });

  // Return cleanup function
  return () => {
    process.env = originalEnv;
  };
}

/**
 * Create a mock file upload object
 */
export function mockFileUpload(options: {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer?: Buffer;
} = {}) {
  return {
    fieldname: options.fieldname || 'file',
    originalname: options.originalname || 'test.txt',
    encoding: options.encoding || '7bit',
    mimetype: options.mimetype || 'text/plain',
    size: options.size || 1024,
    buffer: options.buffer || Buffer.from('test content'),
  };
}

/**
 * Extract error message from response
 */
export function extractErrorMessage(response: any): string {
  return response.body?.error || response.body?.message || 'Unknown error';
}

/**
 * Assert response success
 */
export function expectSuccessResponse(response: any, expectedStatus = 200) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
}

/**
 * Assert response error
 */
export function expectErrorResponse(
  response: any,
  expectedStatus: number,
  errorMessagePattern?: string | RegExp
) {
  expect(response.status).toBe(expectedStatus);

  if (errorMessagePattern) {
    const errorMessage = extractErrorMessage(response);

    if (typeof errorMessagePattern === 'string') {
      expect(errorMessage).toContain(errorMessagePattern);
    } else {
      expect(errorMessage).toMatch(errorMessagePattern);
    }
  }
}

/**
 * Create a mock next function for middleware testing
 */
export function mockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Deep clone an object (useful for test data)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate random test data
 */
export const randomTestData = {
  email: () => `test-${Math.random().toString(36).substring(7)}@example.com`,
  string: (length = 10) => Math.random().toString(36).substring(2, 2 + length),
  number: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
  boolean: () => Math.random() > 0.5,
  date: (daysFromNow = 0) => new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000),
  url: () => `https://example-${Math.random().toString(36).substring(7)}.com`,
  uuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
};

/**
 * Create a batch of test items
 */
export async function createBatch<T>(
  count: number,
  factory: () => Promise<T>
): Promise<T[]> {
  const promises = Array.from({ length: count }, () => factory());
  return Promise.all(promises);
}

/**
 * Sleep/pause execution (useful for timing tests)
 */
export const sleep = wait;

/**
 * Retry a function multiple times (useful for flaky tests)
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 100, onRetry } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      if (attempt < retries) {
        await wait(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Mock console methods to suppress output during tests
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();

  return () => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  };
}

/**
 * Assert array contains items matching predicate
 */
export function expectArrayContaining<T>(
  array: T[],
  predicate: (item: T) => boolean,
  count?: number
) {
  const matches = array.filter(predicate);

  if (count !== undefined) {
    expect(matches).toHaveLength(count);
  } else {
    expect(matches.length).toBeGreaterThan(0);
  }

  return matches;
}

/**
 * Validate pagination response structure
 */
export function expectValidPaginationResponse(response: any) {
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('pagination');
  expect(response.body.pagination).toHaveProperty('page');
  expect(response.body.pagination).toHaveProperty('limit');
  expect(response.body.pagination).toHaveProperty('total');
  expect(response.body.pagination).toHaveProperty('totalPages');
  expect(Array.isArray(response.body.data)).toBe(true);
}
