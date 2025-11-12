/**
 * Environment Variable Validation Tests
 *
 * Tests for the env.server.ts validation module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock process.env before importing the module
const originalEnv = process.env;

describe('Environment Variable Validation', () => {
  beforeEach(() => {
    // Reset modules and environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate correct environment variables', async () => {
      process.env = {
        NODE_ENV: 'development',
        SHOPIFY_API_KEY: 'test_api_key',
        SHOPIFY_API_SECRET: 'test_api_secret',
        SCOPES: 'read_products,write_products',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        SESSION_SECRET: 'a'.repeat(32),
        INTERNAL_API_SECRET: 'b'.repeat(32),
      };

      const { validateEnv } = await import('~/lib/env.server');
      const env = validateEnv();

      expect(env.SHOPIFY_API_KEY).toBe('test_api_key');
      expect(env.SHOPIFY_API_SECRET).toBe('test_api_secret');
      expect(env.SCOPES).toBe('read_products,write_products');
    });

    it('should fail when SHOPIFY_API_KEY is missing', async () => {
      process.env = {
        NODE_ENV: 'development',
        // SHOPIFY_API_KEY missing
        SHOPIFY_API_SECRET: 'test_api_secret',
        SCOPES: 'read_products',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        SESSION_SECRET: 'a'.repeat(32),
        INTERNAL_API_SECRET: 'b'.repeat(32),
      };

      const { validateEnv } = await import('~/lib/env.server');

      expect(() => validateEnv()).toThrow(/SHOPIFY_API_KEY/);
    });

    it('should fail when SESSION_SECRET is too short', async () => {
      process.env = {
        NODE_ENV: 'development',
        SHOPIFY_API_KEY: 'test_api_key',
        SHOPIFY_API_SECRET: 'test_api_secret',
        SCOPES: 'read_products',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        SESSION_SECRET: 'short', // Too short
        INTERNAL_API_SECRET: 'b'.repeat(32),
      };

      const { validateEnv } = await import('~/lib/env.server');

      expect(() => validateEnv()).toThrow(/SESSION_SECRET/);
      expect(() => validateEnv()).toThrow(/at least 32 characters/);
    });

    it('should fail when DATABASE_URL is invalid', async () => {
      process.env = {
        NODE_ENV: 'development',
        SHOPIFY_API_KEY: 'test_api_key',
        SHOPIFY_API_SECRET: 'test_api_secret',
        SCOPES: 'read_products',
        DATABASE_URL: 'not-a-valid-url', // Invalid URL
        SESSION_SECRET: 'a'.repeat(32),
        INTERNAL_API_SECRET: 'b'.repeat(32),
      };

      const { validateEnv } = await import('~/lib/env.server');

      expect(() => validateEnv()).toThrow(/DATABASE_URL/);
    });

    it('should accept optional REDIS_URL', async () => {
      process.env = {
        NODE_ENV: 'development',
        SHOPIFY_API_KEY: 'test_api_key',
        SHOPIFY_API_SECRET: 'test_api_secret',
        SCOPES: 'read_products',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        SESSION_SECRET: 'a'.repeat(32),
        INTERNAL_API_SECRET: 'b'.repeat(32),
        REDIS_URL: 'redis://localhost:6379',
      };

      const { validateEnv } = await import('~/lib/env.server');
      const env = validateEnv();

      expect(env.REDIS_URL).toBe('redis://localhost:6379');
    });

    it('should work without optional REDIS_URL', async () => {
      process.env = {
        NODE_ENV: 'development',
        SHOPIFY_API_KEY: 'test_api_key',
        SHOPIFY_API_SECRET: 'test_api_secret',
        SCOPES: 'read_products',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        SESSION_SECRET: 'a'.repeat(32),
        INTERNAL_API_SECRET: 'b'.repeat(32),
        // No REDIS_URL
      };

      const { validateEnv } = await import('~/lib/env.server');
      const env = validateEnv();

      expect(env.REDIS_URL).toBeUndefined();
    });
  });

  describe('Helper functions', () => {
    beforeEach(async () => {
      process.env = {
        NODE_ENV: 'production',
        SHOPIFY_API_KEY: 'test_api_key',
        SHOPIFY_API_SECRET: 'test_api_secret',
        SCOPES: 'read_products',
        DATABASE_URL: 'postgresql://localhost:5432/test',
        SESSION_SECRET: 'a'.repeat(32),
        INTERNAL_API_SECRET: 'b'.repeat(32),
      };
    });

    it('should detect production environment', async () => {
      const { isProduction, isDevelopment } = await import('~/lib/env.server');

      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });

    it('should detect development environment', async () => {
      process.env.NODE_ENV = 'development';
      vi.resetModules();

      const { isProduction, isDevelopment } = await import('~/lib/env.server');

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
    });
  });
});

