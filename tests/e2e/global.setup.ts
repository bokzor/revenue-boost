/**
 * Playwright Global Setup
 *
 * Starts the MockShopifyAdminServer before running tests.
 * This runs once before all tests and tears down after all tests complete.
 *
 * Based on official @getverdict/mock-bridge documentation:
 * https://www.npmjs.com/package/@getverdict/mock-bridge
 */

import { MockShopifyAdminServer } from '@getverdict/mock-bridge';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
config({ path: resolve(__dirname, '../../.env.test') });

let mockServer: MockShopifyAdminServer | null = null;

export default async function globalSetup() {
  console.log('🚀 Starting Mock Shopify Admin Server...');
  console.log(`   Using test database: ${process.env.DATABASE_URL}`);

  // Use real Shopify API key for proper mock-bridge configuration
  const clientId = process.env.SHOPIFY_API_KEY;
  if (!clientId) {
    throw new Error('SHOPIFY_API_KEY not found in .env.test');
  }

  mockServer = new MockShopifyAdminServer({
    appUrl: process.env.BASE_URL || 'http://localhost:56483',
    clientId: clientId,
    clientSecret: 'mock-secret-12345', // Mock secret for development
    shop: process.env.MOCK_SHOP || 'test-shop.myshopify.com',
    port: 3080,
    debug: true,
  });

  await mockServer.start();

  console.log('✅ Mock Shopify Admin Server started at http://localhost:3080');
  console.log(`   App URL: ${process.env.BASE_URL || 'http://localhost:56483'}`);
  console.log(`   Client ID: ${clientId}`);

  // Store the server instance globally so we can stop it in teardown
  (global as any).__MOCK_SERVER__ = mockServer;
}

