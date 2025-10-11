import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Set test timeout
jest.setTimeout(parseInt(process.env.TEST_TIMEOUT || '10000', 10));

// Mock console methods to reduce noise in test output
// Comment these out if you need to debug tests
// global.console.log = jest.fn();
// global.console.warn = jest.fn();
// global.console.error = jest.fn();

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global test utilities can be added here if needed
// Example: (global as any).testUtils = { ... };
