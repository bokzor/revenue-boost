/**
 * Vitest Setup File
 *
 * Provides test environment variables for unit and integration tests.
 * This runs before all tests to ensure environment is properly configured.
 */

import { beforeAll, vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.SHOPIFY_API_KEY = 'test_api_key_12345';
  process.env.SHOPIFY_API_SECRET = 'test_api_secret_12345';
  process.env.SCOPES = 'read_discounts,write_discounts,read_products,read_themes,read_orders,write_marketing_events,read_marketing_events,read_customers,write_customers,write_files';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.SESSION_SECRET = 'test_session_secret_minimum_32_chars_long_for_validation';
  process.env.INTERNAL_API_SECRET = 'test_internal_api_secret_minimum_32_chars_long_validation';
  process.env.SHOPIFY_APP_URL = 'http://localhost:3000';

  // Optional test variables (set to undefined to make them truly optional)
  delete process.env.REDIS_URL; // Make Redis optional in tests
});

// Mock Prisma Client for tests that don't have a real database
// Integration tests can override this mock if they need real database access
vi.mock('~/db.server', () => {
  const mockPrisma = {
    store: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    campaign: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    lead: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    popupEvent: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    campaignConversion: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $disconnect: vi.fn(),
    $connect: vi.fn(),
  };

  return {
    default: mockPrisma,
  };
});

// Mock Redis client to avoid connection errors in tests
vi.mock('~/lib/redis.server', () => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    exists: vi.fn(),
    keys: vi.fn(),
    mget: vi.fn(),
    mset: vi.fn(),
    pipeline: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  };

  return {
    redis: null, // Redis is not available in test environment
    getRedis: vi.fn(() => null),
    REDIS_PREFIXES: {
      FREQUENCY_CAP: 'freq:',
      VISITOR: 'visitor:',
      SESSION: 'session:',
      CAMPAIGN_DISPLAY: 'display:',
      SOCIAL_PROOF: 'social:',
    },
    REDIS_TTL: {
      SESSION: 1800,
      VISITOR: 2592000,
      FREQUENCY_CAP: 2592000,
      SOCIAL_PROOF: 300,
    },
    executeRedisCommand: vi.fn((command, fallback) => Promise.resolve(fallback)),
  };
});

