/**
 * ADMIN TESTS WITH MOCK-BRIDGE
 *
 * These tests use @getverdict/mock-bridge to test the admin UI
 * in a mock Shopify admin environment.
 *
 * Based on official documentation:
 * https://www.npmjs.com/package/@getverdict/mock-bridge
 *
 * Prerequisites:
 * 1. Start the app server: npm run dev
 * 2. Mock-bridge starts automatically via Playwright globalSetup
 *
 * Run: npm run test:e2e -- --project=admin
 */

import { test, expect } from '@playwright/test';

test.describe('Admin UI Tests (Mock-Bridge)', () => {
  test('should load app in mock Shopify admin', async ({ page }) => {
    console.log('🧪 Testing app loads in mock admin...');

    // Navigate to mock admin (baseURL is http://localhost:3080)
    await page.goto('/');

    console.log(`📍 Page loaded: ${page.url()}`);

    // Wait for app to load in iframe (using frameLocator as per documentation)
    console.log('⏳ Waiting for app iframe to load...');
    const appFrame = page.frameLocator('#app-iframe');

    // Wait for the app to be visible in the iframe
    await expect(appFrame.locator('body')).toBeVisible({ timeout: 15000 });

    console.log('✅ App iframe loaded successfully');

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/mock-admin-loaded.png', fullPage: true });

    console.log('✅ Mock admin test passed!');
  });

  test('should display campaigns page content', async ({ page }) => {
    console.log('🧪 Testing campaigns page content...');

    // Navigate to mock admin
    await page.goto('/');

    // Wait for app iframe
    const appFrame = page.frameLocator('#app-iframe');
    await expect(appFrame.locator('body')).toBeVisible({ timeout: 15000 });

    console.log('📍 Checking for campaigns page content...');

    // Check for common UI elements on campaigns page
    // The app should render either a table, empty state, or buttons
    const hasButton = await appFrame.locator('button').count() > 0;
    const hasTable = await appFrame.locator('table, [class*="IndexTable"]').count() > 0;
    const hasEmptyState = await appFrame.locator('[class*="EmptyState"]').count() > 0;

    console.log(`📊 Page elements found:`);
    console.log(`   - Buttons: ${hasButton}`);
    console.log(`   - Table/List: ${hasTable}`);
    console.log(`   - Empty state: ${hasEmptyState}`);

    // At least one UI element should be present
    expect(hasButton || hasTable || hasEmptyState).toBe(true);

    // Take screenshot
    await page.screenshot({ path: 'test-results/campaigns-page.png', fullPage: true });

    console.log('✅ Campaigns page test passed!');
  });
});

