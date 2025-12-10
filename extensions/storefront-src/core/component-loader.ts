/**
 * ComponentLoader - Lazy loading for popup components
 *
 * Loads popup components on-demand using multiple strategies:
 * 1. Global registry populated by separately loaded IIFE bundles (window.RevenueBoostComponents)
 * 2. Dynamic import via import.meta.glob (development/builds that support code splitting)
 * 3. Script tag loading as fallback
 */

export type TemplateType =
  | "NEWSLETTER"
  | "SPIN_TO_WIN"
  | "FLASH_SALE"
  | "FREE_SHIPPING"
  | "EXIT_INTENT"
  | "CART_ABANDONMENT"
  | "PRODUCT_UPSELL"
  | "SOCIAL_PROOF"
  | "COUNTDOWN_TIMER"
  | "SCRATCH_CARD"
  | "ANNOUNCEMENT"
  // New upsell popup template types
  | "CLASSIC_UPSELL"
  | "MINIMAL_SLIDE_UP"
  | "PREMIUM_FULLSCREEN"
  | "COUNTDOWN_URGENCY";

export type LoadedComponent = unknown; // Preact component

export interface ComponentLoaderConfig {
  version?: string;
  baseUrl?: string;
  debug?: boolean;
  timeoutMs?: number;
}

declare const __REVENUE_BOOST_DYNAMIC_IMPORT__: boolean;

export class ComponentLoader {
  private cache = new Map<string, LoadedComponent>();
  private cfg: ComponentLoaderConfig;
  private loadingPromises = new Map<string, Promise<LoadedComponent>>();

  constructor(cfg: ComponentLoaderConfig = {}) {
    this.cfg = {
      timeoutMs: 8000,
      debug: false,
      ...cfg,
    };
  }

  private log(...args: unknown[]) {
    if (this.cfg.debug) {
      console.log("[Revenue Boost Loader]", ...args);
    }
  }

  /**
   * Preload components (best-effort, ignores errors)
   */
  async preloadComponents(templateTypes: TemplateType[]): Promise<void> {
    const unique = Array.from(new Set(templateTypes));
    await Promise.all(
      unique.map((type) =>
        this.loadComponent(type).catch((err) => {
          this.log("Preload failed for", type, err?.message || err);
        })
      )
    );
  }

  /**
   * Load component by template type
   */
  async loadComponent(templateType: TemplateType): Promise<LoadedComponent> {
    const key = templateType;

    // Check cache
    if (this.cache.has(key)) {
      this.log("Cache hit:", key);
      return this.cache.get(key)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(key)) {
      this.log("Already loading:", key);
      return this.loadingPromises.get(key)!;
    }

    // Create loading promise
    const loadPromise = this._loadComponentInternal(key);
    this.loadingPromises.set(key, loadPromise);

    try {
      const component = await loadPromise;
      this.cache.set(key, component);
      return component;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  private async _loadComponentInternal(key: string): Promise<LoadedComponent> {
    // Strategy 1: Try global registry (populated by IIFE bundles)
    const fromGlobal = this.loadFromGlobal(key);
    if (fromGlobal) {
      this.cache.set(key, fromGlobal);
      return fromGlobal;
    }

    // Strategy 2: Try dynamic import (development mode)
    try {
      const fromDynamic = await this.loadViaDynamicImport(key);
      if (fromDynamic) {
        this.cache.set(key, fromDynamic);
        return fromDynamic;
      }
    } catch (err) {
      this.log("Dynamic import failed for", key, err);
    }

    // Strategy 3: Try loading external script bundle
    if (this.cfg.baseUrl) {
      try {
        const fromScript = await this.loadViaScript(key);
        if (fromScript) {
          this.cache.set(key, fromScript);
          return fromScript;
        }
      } catch (err) {
        this.log("Script loading failed for", key, err);
      }
    }

    throw new Error(`Component for template '${key}' not found`);
  }

  /**
   * Load from global registry created by IIFE bundles
   */
  private loadFromGlobal(key: string): LoadedComponent | null {
    type GlobalWithRegistry = typeof globalThis & {
      RevenueBoostComponents?: Record<string, unknown>;
    };
    const g = globalThis as GlobalWithRegistry;
    const reg = g.RevenueBoostComponents;
    if (reg && reg[key]) {
      this.log("Loaded from global registry:", key);
      return reg[key] as unknown;
    }
    return null;
  }

  /**
   * Use dynamic import to lazy-load modules during dev/build
   */
  private async loadViaDynamicImport(key: string): Promise<LoadedComponent | null> {
    // Consume param to satisfy lint
    void key;
    // Check if dynamic imports are enabled at build time
    if (
      typeof __REVENUE_BOOST_DYNAMIC_IMPORT__ !== "undefined" &&
      !__REVENUE_BOOST_DYNAMIC_IMPORT__
    ) {
      return null;
    }

    // This will be replaced by bundler with actual imports
    this.log("Dynamic import not available in production");
    return null;
  }

  /**
   * Load component via external script tag
   */
  private async loadViaScript(key: string): Promise<LoadedComponent | null> {
    const bundleName = this.getBundleName(key);
    const url = `${this.cfg.baseUrl}/${bundleName}?v=${this.cfg.version || "1"}`;

    this.log("Loading script:", url);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading ${bundleName}`));
      }, this.cfg.timeoutMs);

      const script = document.createElement("script");
      script.src = url;
      script.async = true;

      script.onload = () => {
        clearTimeout(timeout);
        const component = this.loadFromGlobal(key);
        if (component) {
          resolve(component);
        } else {
          reject(new Error(`Component ${key} not registered after script load`));
        }
      };

      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load script: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  private getBundleName(key: string): string {
    return `${key.toLowerCase().replace(/_/g, "-")}.bundle.js`;
  }
}
