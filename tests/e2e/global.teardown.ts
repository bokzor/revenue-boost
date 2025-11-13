/**
 * Playwright Global Teardown
 * 
 * Stops the MockShopifyAdminServer after all tests complete.
 */

import { MockShopifyAdminServer } from '@getverdict/mock-bridge';

export default async function globalTeardown() {
  const mockServer = (global as any).__MOCK_SERVER__ as MockShopifyAdminServer | undefined;
  
  if (mockServer) {
    console.log('🛑 Stopping Mock Shopify Admin Server...');
    await mockServer.stop();
    console.log('✅ Mock server stopped');
  }
}

