/**
 * ScrollDepthTracker
 * 
 * Tracks scroll depth and triggers when user reaches a specific percentage
 */

export interface ScrollDepthConfig {
  depthPercentage?: number; // 0-100
  direction?: "down" | "up";
  debounceTime?: number; // milliseconds
}

export type ScrollDepthCallback = () => void;

export class ScrollDepthTracker {
  private config: Required<ScrollDepthConfig>;
  private callback: ScrollDepthCallback | null = null;
  private active = false;
  private triggered = false;
  private scrollHandler: ((e: Event) => void) | null = null;
  private debounceTimer: number | null = null;

  constructor(config: ScrollDepthConfig = {}) {
    this.config = {
      depthPercentage: config.depthPercentage || 50,
      direction: config.direction || "down",
      debounceTime: config.debounceTime || 100,
    };
  }

  /**
   * Start tracking scroll depth
   */
  start(callback: ScrollDepthCallback): void {
    if (this.active) {
      return; // Already active
    }

    this.callback = callback;
    this.active = true;
    this.triggered = false;

    // Listen for scroll events
    this.scrollHandler = this.handleScroll.bind(this);
    window.addEventListener("scroll", this.scrollHandler, { passive: true });
  }

  /**
   * Stop tracking scroll depth
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler, { passive: true } as any);
      this.scrollHandler = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Check if tracker is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get current scroll depth percentage
   */
  getCurrentScrollDepth(): number {
    const scrollTop = window.scrollY || window.pageYOffset;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // Calculate scroll percentage
    const scrollableHeight = scrollHeight - clientHeight;
    
    if (scrollableHeight <= 0) {
      return 0;
    }

    const scrollPercentage = (scrollTop / scrollableHeight) * 100;
    
    return Math.min(100, Math.max(0, Math.round(scrollPercentage)));
  }

  /**
   * Check if target depth has been reached
   */
  hasReachedDepth(): boolean {
    const currentDepth = this.getCurrentScrollDepth();
    return currentDepth >= this.config.depthPercentage;
  }

  /**
   * Cleanup and remove all listeners
   */
  destroy(): void {
    this.stop();
    this.callback = null;
  }

  /**
   * Handle scroll events (debounced)
   */
  private handleScroll(e: Event): void {
    if (!this.active || this.triggered) {
      return;
    }

    // Debounce scroll events
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.checkScrollDepth();
    }, this.config.debounceTime);
  }

  /**
   * Check if scroll depth threshold is met
   */
  private checkScrollDepth(): void {
    if (!this.active || this.triggered) {
      return;
    }

    if (this.hasReachedDepth()) {
      this.trigger();
    }
  }

  /**
   * Trigger the callback
   */
  private trigger(): void {
    if (this.triggered || !this.callback) {
      return;
    }

    this.triggered = true;
    this.callback();
    
    // Stop listening after trigger
    this.stop();
  }
}

