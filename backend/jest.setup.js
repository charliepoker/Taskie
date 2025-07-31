// Global test setup for backend
require('dotenv').config({ path: '.env.test' });

const {
  setupTestDatabase,
  teardownTestDatabase,
} = require('./src/utils/test-helpers');

// Setup test database before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Cleanup after all tests
afterAll(async () => {
  await teardownTestDatabase();
});

// Mock Redis client
jest.mock('./src/utils/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    isReady: true,
  },
}));

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(async () => {
  jest.clearAllMocks();
  const { cleanupDatabase } = require('./src/utils/test-helpers');
  await cleanupDatabase();
});
