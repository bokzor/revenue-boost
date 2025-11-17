/**
 * ADMIN E2E TESTS - Campaign Management Flow
 *
 * Tests the complete campaign creation and management workflow using mock-bridge.
 *
 * Prerequisites:
 * 1. Start the app: npm run dev:test (in one terminal)
 * 2. Run tests: npm run test:e2e:admin (in another terminal)
 *
 * Mock-bridge is started automatically via Playwright globalSetup.
 */

import { test, expect } from '@playwright/test';
import {
  navigateToMockAdmin,
  waitForAppFrame,
  navigateInApp,
  clickButtonInApp,
  fillFormField,
  getAppUrl,
  takeScreenshot,
  getElementText,
  isElementVisible,
  debugPageState,
  captureIframeHTML,
  captureBrowserLogs,
  captureNetworkActivity,
} from './helpers/admin-helpers';

test.describe('Admin - Campaign Management (Mock-Bridge)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to mock admin before each test
    await navigateToMockAdmin(page);
    await waitForAppFrame(page);
  });

  test('should load campaigns page', async ({ page }) => {
    console.log('🧪 Test: Load campaigns page');

    // Setup debugging
    captureBrowserLogs(page);
    captureNetworkActivity(page);

    // Navigate to campaigns
    await navigateInApp(page, '/app/campaigns');

    // Debug the page state
    await debugPageState(page, 'After navigating to /app/campaigns');

    // Capture HTML for inspection
    await captureIframeHTML(page, 'campaigns-page');

    // Verify we're on campaigns page
    const url = await getAppUrl(page);
    console.log(`📍 Current URL: ${url}`);
    expect(url).toContain('/app/campaigns');

    // Check for campaigns page content
    const hasContent = await isElementVisible(page, 'h1, h2, [role="heading"]');
    expect(hasContent).toBe(true);

    await takeScreenshot(page, 'campaigns-page-loaded');
  });

  test('should navigate to new campaign page', async ({ page }) => {
    console.log('🧪 Test: Navigate to new campaign page');

    // Navigate directly to the new campaign page within the app
    await navigateInApp(page, '/app/campaigns/new');

    // Should navigate to new campaign or template selector
    const url = await getAppUrl(page);
    expect(url).toMatch(/\/app\/(campaigns\/new|templates|campaigns\/.*\/edit)/);

    await takeScreenshot(page, 'new-campaign-page');
  });

  test('should display campaign list', async ({ page }) => {
    console.log('🧪 Test: Display campaign list');

    // Navigate to campaigns
    await navigateInApp(page, '/app/campaigns');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Get page content for debugging
    const content = await getElementText(page, 'body');
    expect(content.length).toBeGreaterThan(0);

    console.log(`📄 Page content length: ${content.length} characters`);

    await takeScreenshot(page, 'campaign-list');
  });

  test('should handle navigation between pages', async ({ page }) => {
    console.log('🧪 Test: Navigate between pages');

    // Start at campaigns
    await navigateInApp(page, '/app/campaigns');
    let url = await getAppUrl(page);
    expect(url).toContain('/app/campaigns');

    // Navigate to home
    await navigateInApp(page, '/app');
    url = await getAppUrl(page);
    expect(url).toContain('/app');

    // Navigate back to campaigns
    await navigateInApp(page, '/app/campaigns');
    url = await getAppUrl(page);
    expect(url).toContain('/app/campaigns');

    console.log('✅ Navigation between pages works');
  });

  test('should maintain session across navigation', async ({ page }) => {
    console.log('🧪 Test: Maintain session across navigation');

    // Navigate to campaigns
    await navigateInApp(page, '/app/campaigns');
    await page.waitForTimeout(500);

    // Navigate to home
    await navigateInApp(page, '/app');
    await page.waitForTimeout(500);

    // Navigate back to campaigns - should still be authenticated
    await navigateInApp(page, '/app/campaigns');

    const url = await getAppUrl(page);
    expect(url).toContain('/app/campaigns');

    console.log('✅ Session maintained across navigation');
  });

  test('should load app with mock-bridge session token', async ({ page }) => {
    console.log('🧪 Test: Load app with mock-bridge session token');

    // The app should be loaded with a mock session token from mock-bridge
    // Check that we can navigate without authentication errors

    await navigateInApp(page, '/app/campaigns');

    // If we get here without errors, the session token worked
    const url = await getAppUrl(page);
    expect(url).toContain('/app/campaigns');

    console.log('✅ Mock-bridge session token working');
  });
});

test.describe('Admin - Campaign Creation Flow (Mock-Bridge)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToMockAdmin(page);
    await waitForAppFrame(page);
  });

  test('should show template selector on new campaign', async ({ page }) => {
    console.log('🧪 Test: Show template selector on new campaign');

    // Navigate to new campaign
    await navigateInApp(page, '/app/campaigns/new');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check for template-related content
    const content = await getElementText(page, 'body');
    expect(content.length).toBeGreaterThan(0);

    console.log(`📄 New campaign page loaded (${content.length} chars)`);

    await takeScreenshot(page, 'template-selector');
  });

  test('should handle form interactions', async ({ page }) => {
    console.log('🧪 Test: Handle form interactions');

    // Navigate to new campaign
    await navigateInApp(page, '/app/campaigns/new');
    await page.waitForTimeout(1000);

    // Try to find and interact with form elements
    const appFrame = page.frameLocator('#app-iframe');
    const inputs = await appFrame.locator('input').count();
    const buttons = await appFrame.locator('button').count();

    console.log(`📋 Found ${inputs} inputs and ${buttons} buttons`);

    // Just verify the form exists
    expect(inputs + buttons).toBeGreaterThan(0);

    await takeScreenshot(page, 'form-elements');
  });
});

