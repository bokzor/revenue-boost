/**
 * Admin E2E Test Helpers
 *
 * Utilities for testing the admin UI with mock-bridge
 */

import { Page, expect } from '@playwright/test';

const MOCK_ADMIN_URL = process.env.MOCK_ADMIN_URL || 'http://localhost:3080';

/**
 * Navigate to mock admin and wait for app to load
 */
export async function navigateToMockAdmin(page: Page) {
  console.log(`📍 Navigating to mock admin: ${MOCK_ADMIN_URL}`);
  await page.goto(MOCK_ADMIN_URL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Give mock-bridge time to embed the app
}

/**
 * Get the app iframe frame locator
 */
export function getAppFrame(page: Page) {
  return page.frameLocator('#app-iframe');
}

/**
 * Wait for app iframe to be visible and ready
 */
export async function waitForAppFrame(page: Page, timeout = 15000) {
  console.log('⏳ Waiting for app iframe to load...');
  const appFrame = getAppFrame(page);
  await expect(appFrame.locator('body')).toBeVisible({ timeout });
  console.log('✅ App iframe loaded');
  return appFrame;
}

/**
 * Navigate within the app iframe by changing the iframe src
 * This performs a full page navigation within the iframe
 */
export async function navigateInApp(page: Page, path: string) {
  const appFrame = getAppFrame(page);
  console.log(`📍 Navigating to ${path} within app...`);

  // Get the current iframe src to extract the base URL and search params
  const iframeSrc = await page.locator('#app-iframe').getAttribute('src');
  if (!iframeSrc) {
    throw new Error('Could not find iframe src');
  }

  // Parse the iframe URL to get the base and search params
  const iframeUrl = new URL(iframeSrc, 'http://localhost');
  const baseUrl = `${iframeUrl.protocol}//${iframeUrl.host}`;
  const searchParams = iframeUrl.search;

  // Build the new URL with the target path
  const newUrl = `${baseUrl}${path}${searchParams}`;
  console.log(`📍 Setting iframe src to: ${newUrl}`);

  // Set the iframe src to navigate
  await page.locator('#app-iframe').evaluate((iframe, url) => {
    (iframe as HTMLIFrameElement).src = url;
  }, newUrl);

  // Wait for the iframe to load the new page
  await page.waitForTimeout(2000);

  // Wait for the body to be visible
  try {
    await appFrame.locator('body').waitFor({ state: 'visible', timeout: 15000 });
  } catch (error) {
    console.warn(`⚠️  Body not visible after navigation, but continuing...`);
  }

  // Wait a bit more for React to render
  await page.waitForTimeout(1000);
}

/**
 * Get current URL within app iframe
 */
export async function getAppUrl(page: Page): Promise<string> {
  const appFrame = getAppFrame(page);
  try {
    return await appFrame.locator('body').evaluate(() =>
      window.location.pathname + window.location.search
    );
  } catch (error) {
    console.warn(`⚠️  Failed to get app URL: ${error}`);
    return '/';
  }
}

/**
 * Click a button in the app by text
 */
export async function clickButtonInApp(page: Page, text: string) {
  const appFrame = getAppFrame(page);
  console.log(`🖱️  Clicking button: "${text}"`);

  const button = appFrame.locator(`button:has-text("${text}"), a:has-text("${text}")`).first();
  await expect(button).toBeVisible({ timeout: 5000 });
  await button.click();

  // Wait for navigation or content update
  await page.waitForTimeout(500);
}

/**
 * Fill a form field in the app
 */
export async function fillFormField(page: Page, label: string, value: string) {
  const appFrame = getAppFrame(page);
  console.log(`📝 Filling field "${label}" with "${value}"`);

  // Find input by label or placeholder
  const input = appFrame.locator(
    `input[placeholder*="${label}"], input[aria-label*="${label}"], [data-testid="${label}"]`
  ).first();

  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(value);
}

/**
 * Select an option from a dropdown/select
 */
export async function selectOption(page: Page, label: string, value: string) {
  const appFrame = getAppFrame(page);
  console.log(`📋 Selecting "${value}" from "${label}"`);

  // Try to find and click the select
  const select = appFrame.locator(
    `select[aria-label*="${label}"], [data-testid="${label}"]`
  ).first();

  await expect(select).toBeVisible({ timeout: 5000 });
  await select.selectOption(value);
}

/**
 * Wait for a specific element to appear in the app
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  const appFrame = getAppFrame(page);
  console.log(`⏳ Waiting for element: ${selector}`);

  await expect(appFrame.locator(selector)).toBeVisible({ timeout });
}

/**
 * Get text content from an element in the app
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  const appFrame = getAppFrame(page);
  const text = await appFrame.locator(selector).first().textContent();
  return text ?? '';
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-results/${name}-${timestamp}.png`;
  console.log(`📸 Taking screenshot: ${filename}`);
  await page.screenshot({ path: filename, fullPage: true });
}

/**
 * Check if element exists and is visible
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  const appFrame = getAppFrame(page);
  try {
    return await appFrame.locator(selector).first().isVisible({ timeout: 2000 });
  } catch {
    return false;
  }
}

/**
 * Get all text from the app body (for debugging)
 */
export async function getAppContent(page: Page): Promise<string> {
  const appFrame = getAppFrame(page);
  const text = await appFrame.locator('body').textContent();
  return text ?? '';
}

/**
 * Capture full HTML of the iframe for debugging
 */
export async function captureIframeHTML(page: Page, name: string) {
  const appFrame = getAppFrame(page);
  try {
    const html = await appFrame.locator('html').innerHTML();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results/${name}-${timestamp}.html`;

    // Write HTML to file
    const fs = await import('fs').then(m => m.promises);
    await fs.writeFile(filename, html, 'utf-8');
    console.log(`📄 HTML captured: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Failed to capture HTML: ${error}`);
    return null;
  }
}

/**
 * Capture browser console logs from iframe
 */
export async function captureBrowserLogs(page: Page): Promise<string[]> {
  const logs: string[] = [];

  // Listen to console messages
  page.on('console', msg => {
    const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    logs.push(logEntry);
    console.log(`🔍 Browser: ${logEntry}`);
  });

  return logs;
}

/**
 * Capture network requests and responses
 */
export async function captureNetworkActivity(page: Page): Promise<Array<{url: string; status: number; method: string}>> {
  const requests: Array<{url: string; status: number; method: string}> = [];

  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    const method = response.request().method();

    requests.push({ url, status, method });

    // Log errors
    if (status >= 400) {
      console.log(`⚠️  Network Error: ${method} ${url} -> ${status}`);
    }
  });

  return requests;
}

/**
 * Debug helper: Print full page state
 */
export async function debugPageState(page: Page, label: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 DEBUG: ${label}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Get iframe URL
    const iframeSrc = await page.locator('#app-iframe').getAttribute('src');
    console.log(`📍 Iframe src: ${iframeSrc}`);

    // Get app URL
    const appUrl = await getAppUrl(page);
    console.log(`📍 App URL: ${appUrl}`);

    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    // Get app content length
    const content = await getAppContent(page);
    console.log(`📊 App content length: ${content.length} chars`);

    // Check for common elements
    const appFrame = getAppFrame(page);
    const hasHeading = await isElementVisible(page, 'h1, h2, h3');
    const hasButtons = await isElementVisible(page, 'button');
    const hasInputs = await isElementVisible(page, 'input');

    console.log(`✓ Has heading: ${hasHeading}`);
    console.log(`✓ Has buttons: ${hasButtons}`);
    console.log(`✓ Has inputs: ${hasInputs}`);

    // Get first 500 chars of content
    console.log(`\n📝 Content preview:\n${content.substring(0, 500)}...`);

  } catch (error) {
    console.error(`❌ Debug failed: ${error}`);
  }

  console.log(`${'='.repeat(60)}\n`);
}

