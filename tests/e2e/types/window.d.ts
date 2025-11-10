/**
 * Type definitions for window extensions used in E2E tests
 */

/**
 * Split Pop App instance
 */
interface SplitPopApp {
  initialized?: boolean;
  currentlyShowing?: boolean;
  popupManager?: unknown;
  init?: () => Promise<void>;
}

/**
 * Campaign data structure
 */
interface CampaignData {
  id: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Performance memory info (Chrome-specific)
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Extended Performance interface with memory
 */
interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Extended Window interface for E2E tests
 */
declare global {
  interface Window {
    __splitPopApp?: SplitPopApp;
    __SPLIT_POP_ERRORS?: string[];
    __consoleLogs?: string[];
    SPLIT_POP_CAMPAIGNS?: CampaignData[];
    SplitPop?: unknown;
    SplitPopComponents?: unknown;
    SPLIT_POP_CONFIG?: unknown;
    __splitPopInitPromise?: Promise<unknown>;
    performance: PerformanceWithMemory;
  }

  interface HTMLElement {
    shadowRoot?: ShadowRoot | null;
  }
}

export {};

