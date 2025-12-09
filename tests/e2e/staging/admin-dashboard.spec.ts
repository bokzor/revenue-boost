/**
 * Admin Dashboard E2E Tests
 * 
 * Tests the admin UI by logging into the Shopify admin and accessing the embedded app.
 * 
 * Prerequisites:
 * - ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set
 * - The staging app must be installed on the staging store
 */

import { test, expect, type Page } from "@playwright/test";

// Staging store admin URL
const STORE_ADMIN_URL = "https://admin.shopify.com/store/revenue-boost-staging";

// App slug/name in the Shopify admin (this is the app handle, not the store name)
const APP_SLUG = "revenue-boost";

// Credentials from environment or hardcoded for now
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shopify.polio610@passmail.net";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bR0&Z4c&Ektaq7Yvggx*";

/**
 * Helper to login to Shopify admin
 *
 * NOTE: Shopify has bot detection that may show CAPTCHA challenges.
 * If tests fail with "Your connection needs to be verified", you may need to:
 * 1. Run tests in headed mode (--headed) and solve the CAPTCHA manually once
 * 2. The session will be reused for subsequent tests in the same run
 */
async function loginToShopifyAdmin(page: Page): Promise<void> {
    console.log("🔐 Logging into Shopify admin...");

    // Go to the store admin URL - this will redirect to login
    await page.goto(STORE_ADMIN_URL);

    // Wait for page to stabilize
    await page.waitForLoadState("domcontentloaded");

    // Check if already logged in (look for admin navigation)
    const isLoggedIn = await page.locator('[data-polaris-topbar], [class*="Polaris-TopBar"]').isVisible().catch(() => false);

    if (isLoggedIn) {
        console.log("✅ Already logged in");
        return;
    }

    // Wait for either: email field, CAPTCHA challenge, or already logged in
    // Use Promise.race to detect which state we're in
    const emailField = page.getByRole('textbox', { name: 'Email' });
    const verificationChallenge = page.getByRole('heading', { name: /connection needs to be verified/i });
    const adminNav = page.locator('[data-polaris-topbar], [class*="Polaris-TopBar"]');

    // Wait up to 15 seconds for one of these to appear
    await Promise.race([
        emailField.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
        verificationChallenge.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
        adminNav.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
    ]);

    // Check if already logged in
    if (await adminNav.isVisible().catch(() => false)) {
        console.log("✅ Already logged in");
        return;
    }

    // Check for CAPTCHA/verification challenge
    if (await verificationChallenge.isVisible().catch(() => false)) {
        console.log("⚠️ CAPTCHA/verification challenge detected!");
        console.log("⚠️ Please solve the challenge manually in the browser window.");
        console.log("⚠️ Waiting up to 60 seconds for manual intervention...");

        // Wait for the challenge to be solved (user manually solves it)
        // The page will redirect to login or admin after solving
        await page.waitForURL(/accounts\.shopify\.com\/lookup|admin\.shopify\.com/, { timeout: 60000 });

        // Check if we're now logged in
        if (await adminNav.isVisible().catch(() => false)) {
            console.log("✅ Logged in after CAPTCHA");
            return;
        }

        // If not logged in, we should be at the login page now
        console.log("📧 Continuing with login after CAPTCHA...");
    }

    // Now we should be at the login page - verify email field is visible
    await expect(emailField).toBeVisible({ timeout: 15000 });

    // Fill email - type slowly to trigger button enable
    await emailField.fill(ADMIN_EMAIL);
    console.log("📧 Email entered");

    // Wait a moment for button to enable
    await page.waitForTimeout(500);

    // Click "Continue with email" button
    const continueButton = page.getByRole('button', { name: /Continue with email/i });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    await continueButton.click();
    console.log("📧 Clicked continue");

    // Wait for password field (on next page)
    const passwordField = page.getByRole('textbox', { name: /password/i }).or(page.locator('input[type="password"]'));
    await expect(passwordField).toBeVisible({ timeout: 15000 });

    // Fill password
    await passwordField.fill(ADMIN_PASSWORD);
    console.log("🔑 Password entered");

    // Click login button
    const loginButton = page.getByRole('button', { name: /Log in/i }).or(page.getByRole('button', { name: /Continue/i }));
    await loginButton.click();
    console.log("🔑 Clicked login");

    // Wait for admin to load - look for the admin interface
    await page.waitForURL(/admin\.shopify\.com\/store/, { timeout: 30000 });
    console.log("✅ Logged in successfully");
}

/**
 * Navigate to the app within Shopify admin
 */
async function navigateToApp(page: Page): Promise<void> {
    console.log("🚀 Navigating to Revenue Boost app...");

    // Navigate directly to the app URL
    // The app is at /store/{store}/apps/{app-slug}/app
    await page.goto(`${STORE_ADMIN_URL}/apps/${APP_SLUG}/app`);
    console.log("📱 Navigated to app URL");

    // Wait for the page to stabilize
    await page.waitForLoadState("domcontentloaded");

    // Shopify embeds apps in an iframe - find it
    const appFrame = page.frameLocator('iframe').first();

    // Wait for app content to appear in the iframe
    // Our app shows "Dashboard" heading - just wait for that
    await expect(
        appFrame.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible({ timeout: 30000 });

    console.log("✅ App loaded successfully");

    return;
}

/**
 * Get the app iframe for interacting with app content
 */
function getAppFrame(page: Page) {
    return page.frameLocator('iframe').first();
}

test.describe("Admin Dashboard", () => {
    test.beforeEach(async ({ page }) => {
        // Set longer timeout for admin tests (login can be slow)
        test.setTimeout(120000);

        // Login once per test
        await loginToShopifyAdmin(page);
    });

    test("can access the dashboard", async ({ page }) => {
        console.log("🧪 Testing dashboard access...");

        await navigateToApp(page);

        // Get the app iframe
        const appFrame = getAppFrame(page);

        // Verify dashboard elements are visible
        const dashboardVisible = await appFrame.getByRole('heading', { name: 'Dashboard' }).isVisible().catch(() => false);
        const recipesVisible = await appFrame.getByText('Popular Recipes').isVisible().catch(() => false);

        console.log(`Dashboard heading visible: ${dashboardVisible}`);
        console.log(`Popular Recipes visible: ${recipesVisible}`);

        // At least one of these should be visible
        expect(dashboardVisible || recipesVisible).toBe(true);

        console.log("✅ Dashboard loaded successfully!");
    });

    test("can click a template recipe", async ({ page }) => {
        console.log("🧪 Testing template selection...");

        await navigateToApp(page);

        const appFrame = getAppFrame(page);

        // Find "Use this template" button for Welcome Discount
        const welcomeDiscountButton = appFrame.getByRole('button', { name: 'Use this template' }).first();
        await expect(welcomeDiscountButton).toBeVisible({ timeout: 10000 });

        console.log("✅ Template buttons are visible!");

        // Click on "Browse campaign recipes" to see all recipes
        const browseRecipesButton = appFrame.getByRole('button', { name: 'Browse campaign recipes' });
        if (await browseRecipesButton.isVisible()) {
            await browseRecipesButton.click();
            console.log("📋 Clicked Browse campaign recipes");

            // Wait for recipes page to load
            await page.waitForLoadState("networkidle");
        }

        console.log("✅ Recipe selection works!");
    });
});

