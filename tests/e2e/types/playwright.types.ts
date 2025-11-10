/**
 * Playwright Type Definitions
 *
 * Proper type definitions for Playwright test helpers
 */

import { Page } from "@playwright/test";

// Re-export Page type for test helpers
export type { Page } from "@playwright/test";

// Helper function types
export type LoginFunction = (page: Page) => Promise<void>;
export type DetectPopupFunction = (page: Page) => Promise<boolean>;
export type FillEmailFunction = (page: Page, email: string) => Promise<boolean>;
export type ClickButtonFunction = (page: Page) => Promise<boolean>;
export type CheckIntegrationFunction = (page: Page) => Promise<number>;
export type TakeScreenshotFunction = (page: Page, filename: string, templateType?: string) => Promise<void>;
export type FindPopupFunction = (page: Page) => Promise<unknown>;
export type FindTextFunction = (page: Page, text: string) => Promise<boolean>;
export type ShadowQueryFunction = (page: Page, selector: string) => Promise<unknown>;

