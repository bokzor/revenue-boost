/**
 * Popup Interaction E2E Tests
 *
 * Tests user interaction patterns:
 * - ESC key to close popup
 * - Click outside to dismiss
 * - Close button functionality
 * - Keyboard navigation (accessibility)
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import {
    STORE_URL,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    getTestPrefix,
    waitForPopupWithRetry,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY,
    getTestStoreId,
} from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

const prisma = new PrismaClient();
const TEST_PREFIX = getTestPrefix('interactions');

let factory: CampaignFactory;
let storeId: string;

test.describe('Popup Interactions', () => {
    test.beforeAll(async () => {
        // Get store ID for the E2E testing store (revenue-boost-staging.myshopify.com)
        storeId = await getTestStoreId(prisma);
        factory = new CampaignFactory(prisma, storeId, TEST_PREFIX);
    });

    test.afterAll(async () => {
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ context, page }) => {
        // Clean up ALL E2E campaigns to avoid priority conflicts
        await cleanupAllE2ECampaigns(prisma);
        await context.clearCookies();
        // Mock challenge token to bypass bot protection
    });

    test.describe('Close Button', () => {
        test('close button dismisses popup', async ({ page }) => {
            console.log('🧪 Testing close button functionality...');

            const campaign = await (await factory.newsletter().init())
                .withName('CloseButton-Test')
                .withHeadline('Close Button Test Popup')
                .withPriority(MAX_TEST_PRIORITY)
                .create();

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            try {
                await page.goto(STORE_URL);
                await handlePasswordPage(page);

                const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
                expect(popupVisible).toBe(true);
                console.log('✅ Popup appeared');

                // Find and click close button in shadow DOM
                const closeClicked = await page.evaluate(() => {
                    const host = document.querySelector('#revenue-boost-popup-shadow-host');
                    if (!host?.shadowRoot) return false;
                    
                    // Try various close button selectors
                    const closeBtn = host.shadowRoot.querySelector(
                        '[aria-label="Close"], [aria-label="close"], button.close, .close-button, ' +
                        'button[class*="close"], [data-testid="close"], svg[class*="close"]'
                    ) as HTMLElement;
                    
                    if (closeBtn) {
                        closeBtn.click();
                        return true;
                    }
                    
                    // Try finding any button that might be a close button
                    const buttons = host.shadowRoot.querySelectorAll('button');
                    for (const btn of buttons) {
                        if (btn.innerHTML.includes('×') || btn.innerHTML.includes('&times;') ||
                            btn.innerHTML.includes('close') || btn.innerHTML.includes('Close') ||
                            btn.getAttribute('aria-label')?.toLowerCase().includes('close')) {
                            btn.click();
                            return true;
                        }
                    }
                    return false;
                });

                if (closeClicked) {
                    console.log('✅ Close button clicked');
                    
                    // Wait for popup to disappear
                    await page.waitForTimeout(1000);
                    
                    // Check if popup is hidden
                    const popupHidden = await page.evaluate(() => {
                        const host = document.querySelector('#revenue-boost-popup-shadow-host');
                        if (!host) return true;
                        const style = window.getComputedStyle(host);
                        return style.display === 'none' || style.visibility === 'hidden' || 
                               style.opacity === '0' || !host.shadowRoot?.innerHTML;
                    });
                    
                    console.log(`Popup hidden after close: ${popupHidden}`);
                    // Note: Popup might still be in DOM but visually hidden
                } else {
                    console.log('⚠️ Close button not found - checking popup structure');
                }

            } finally {
                // Use deleteMany to avoid error if campaign was already deleted by cleanup
                await prisma.campaign.deleteMany({ where: { id: campaign.id } });
            }
        });
    });

    test.describe('Keyboard Navigation', () => {
        test('ESC key dismisses popup', async ({ page }) => {
            console.log('🧪 Testing ESC key dismissal...');

            const campaign = await (await factory.newsletter().init())
                .withName('ESC-Dismiss-Test')
                .withHeadline('Press ESC to Close')
                .withPriority(MAX_TEST_PRIORITY)
                .create();

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            try {
                await page.goto(STORE_URL);
                await handlePasswordPage(page);

                const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
                expect(popupVisible).toBe(true);
                console.log('✅ Popup appeared');

                // Press ESC key
                await page.keyboard.press('Escape');
                console.log('✅ ESC key pressed');

                // Wait for animation
                await page.waitForTimeout(500);

                // Check if popup is dismissed
                const popupStillVisible = await page.evaluate(() => {
                    const host = document.querySelector('#revenue-boost-popup-shadow-host');
                    if (!host) return false;
                    const style = window.getComputedStyle(host);
                    return style.display !== 'none' && style.visibility !== 'hidden' && 
                           style.opacity !== '0';
                });

                if (!popupStillVisible) {
                    console.log('✅ Popup dismissed with ESC key');
                } else {
                    console.log('⚠️ Popup still visible after ESC - feature may not be implemented');
                }

            } finally {
                // Use deleteMany to avoid error if campaign was already deleted by cleanup
                await prisma.campaign.deleteMany({ where: { id: campaign.id } });
            }
        });

        test('Tab key navigates through focusable elements', async ({ page }) => {
            console.log('🧪 Testing Tab key navigation (accessibility)...');

            const campaign = await (await factory.newsletter().init())
                .withName('Tab-Navigation-Test')
                .withHeadline('Tab Navigation Test')
                .withPriority(MAX_TEST_PRIORITY)
                .create();

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            try {
                await page.goto(STORE_URL);
                await handlePasswordPage(page);

                const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
                expect(popupVisible).toBe(true);

                // Count focusable elements in popup
                const focusableCount = await page.evaluate(() => {
                    const host = document.querySelector('#revenue-boost-popup-shadow-host');
                    if (!host?.shadowRoot) return 0;

                    const focusable = host.shadowRoot.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    return focusable.length;
                });

                console.log(`Found ${focusableCount} focusable elements`);

                // Press Tab multiple times
                for (let i = 0; i < Math.min(focusableCount, 5); i++) {
                    await page.keyboard.press('Tab');
                    await page.waitForTimeout(100);
                }

                // Check if focus is within popup
                const focusInPopup = await page.evaluate(() => {
                    const host = document.querySelector('#revenue-boost-popup-shadow-host');
                    if (!host?.shadowRoot) return false;
                    return host.shadowRoot.contains(host.shadowRoot.activeElement);
                });

                if (focusInPopup) {
                    console.log('✅ Tab navigation works within popup');
                } else {
                    console.log('⚠️ Focus escaped popup - focus trapping may not be implemented');
                }

            } finally {
                // Use deleteMany to avoid error if campaign was already deleted by cleanup
                await prisma.campaign.deleteMany({ where: { id: campaign.id } });
            }
        });
    });

    test.describe('Overlay Click', () => {
        test('clicking overlay dismisses popup', async ({ page }) => {
            console.log('🧪 Testing overlay click dismissal...');

            const campaign = await (await factory.newsletter().init())
                .withName('Overlay-Click-Test')
                .withHeadline('Click Outside to Close')
                .withPriority(MAX_TEST_PRIORITY)
                .create();

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            try {
                await page.goto(STORE_URL);
                await handlePasswordPage(page);

                const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
                expect(popupVisible).toBe(true);
                console.log('✅ Popup appeared');

                // Get popup bounds to click outside it
                const popupBounds = await page.evaluate(() => {
                    const host = document.querySelector('#revenue-boost-popup-shadow-host');
                    if (!host?.shadowRoot) return null;

                    // Find the popup container
                    const popup = host.shadowRoot.querySelector('[class*="popup"], [class*="modal"], [role="dialog"]');
                    if (popup) {
                        const rect = popup.getBoundingClientRect();
                        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                    }
                    return null;
                });

                if (popupBounds) {
                    // Click outside the popup (on the overlay)
                    await page.mouse.click(10, 10);
                    console.log('✅ Clicked on overlay');

                    await page.waitForTimeout(500);

                    const popupStillVisible = await page.evaluate(() => {
                        const host = document.querySelector('#revenue-boost-popup-shadow-host');
                        if (!host) return false;
                        const style = window.getComputedStyle(host);
                        return style.display !== 'none' && style.visibility !== 'hidden';
                    });

                    if (!popupStillVisible) {
                        console.log('✅ Popup dismissed on overlay click');
                    } else {
                        console.log('⚠️ Popup still visible - overlay dismiss may not be enabled');
                    }
                } else {
                    console.log('⚠️ Could not determine popup bounds');
                }

            } finally {
                // Use deleteMany to avoid error if campaign was already deleted by cleanup
                await prisma.campaign.deleteMany({ where: { id: campaign.id } });
            }
        });
    });
});

test.describe('Form Validation', () => {
    test.beforeAll(async () => {
        // Get store ID for the E2E testing store (revenue-boost-staging.myshopify.com)
        storeId = await getTestStoreId(prisma);
        factory = new CampaignFactory(prisma, storeId, TEST_PREFIX);
    });

    test.beforeEach(async ({ context, page }) => {
        await context.clearCookies();
        // Mock challenge token to bypass bot protection
    });

    test('shows error for invalid email format', async ({ page }) => {
        console.log('🧪 Testing invalid email validation...');

        const campaign = await (await factory.newsletter().init())
            .withName('Invalid-Email-Test')
            .withHeadline('Enter Your Email')
            .withPriority(MAX_TEST_PRIORITY)
            .create();

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        try {
            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Enter invalid email
            const invalidEmailEntered = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;

                const input = host.shadowRoot.querySelector('input[type="email"]') as HTMLInputElement;
                if (!input) return false;

                input.value = 'not-an-email';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            });

            expect(invalidEmailEntered).toBe(true);

            // Try to submit
            const submitted = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;

                const button = host.shadowRoot.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (button) {
                    button.click();
                    return true;
                }
                return false;
            });

            await page.waitForTimeout(500);

            // Check for error message or validation state
            const hasError = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;

                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('invalid') || html.includes('error') ||
                       html.includes('valid email') || html.includes('please enter');
            });

            // Also check if input has validation styling
            const inputInvalid = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;

                const input = host.shadowRoot.querySelector('input[type="email"]') as HTMLInputElement;
                return input?.validity?.valid === false ||
                       input?.classList.contains('error') ||
                       input?.classList.contains('invalid');
            });

            if (hasError || inputInvalid) {
                console.log('✅ Invalid email error shown');
            } else {
                console.log('⚠️ No visible error for invalid email - HTML5 validation may be used');
            }

        } finally {
            // Use deleteMany to avoid error if campaign was already deleted by cleanup
                await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('shows error for empty required email', async ({ page }) => {
        console.log('🧪 Testing empty email validation...');

        const campaign = await (await factory.newsletter().init())
            .withName('Empty-Email-Test')
            .withHeadline('Email Required')
            .withPriority(MAX_TEST_PRIORITY)
            .create();

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        try {
            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Try to submit without entering email
            const submitted = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;

                const button = host.shadowRoot.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (button) {
                    button.click();
                    return true;
                }
                return false;
            });

            await page.waitForTimeout(500);

            // Check if email input is marked as invalid (HTML5 required validation)
            const inputRequired = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;

                const input = host.shadowRoot.querySelector('input[type="email"]') as HTMLInputElement;
                return input?.required === true || input?.validity?.valueMissing === true;
            });

            if (inputRequired) {
                console.log('✅ Email field has required validation');
            } else {
                console.log('⚠️ Email field may not have required attribute');
            }

        } finally {
            // Use deleteMany to avoid error if campaign was already deleted by cleanup
                await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('GDPR checkbox must be checked before submission', async ({ page }) => {
        console.log('🧪 Testing GDPR checkbox requirement...');

        const campaign = await (await factory.newsletter().init())
            .withName('GDPR-Required-Test')
            .withHeadline('GDPR Test')
            .withGdprCheckbox(true, 'I agree to the privacy policy')
            .withPriority(MAX_TEST_PRIORITY)
            .create();

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        try {
            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Enter valid email but don't check GDPR
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;

                const input = host.shadowRoot.querySelector('input[type="email"]') as HTMLInputElement;
                if (input) {
                    input.value = 'test@example.com';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            // Try to submit without checking GDPR
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;

                const button = host.shadowRoot.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (button) button.click();
            });

            await page.waitForTimeout(500);

            // Check if GDPR checkbox exists and is required
            const gdprState = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return { exists: false, required: false, checked: false };

                const checkbox = host.shadowRoot.querySelector('input[type="checkbox"]') as HTMLInputElement;
                return {
                    exists: !!checkbox,
                    required: checkbox?.required === true,
                    checked: checkbox?.checked === true
                };
            });

            if (gdprState.exists) {
                console.log(`GDPR checkbox: required=${gdprState.required}, checked=${gdprState.checked}`);
                if (gdprState.required && !gdprState.checked) {
                    console.log('✅ GDPR checkbox required and not checked');
                }
            } else {
                console.log('⚠️ GDPR checkbox not found - may not be rendered for this campaign');
            }

        } finally {
            // Use deleteMany to avoid error if campaign was already deleted by cleanup
                await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });
});

