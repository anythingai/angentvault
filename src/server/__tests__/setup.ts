// Test setup file
// Set environment variables for testing
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test';
}
if (!process.env.DATABASE_URL) {
  (process.env as any).DATABASE_URL = 'file:./test.db';
}
if (!process.env.JWT_SECRET) {
  (process.env as any).JWT_SECRET = 'test-jwt-secret';
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific log levels during testing
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}; 