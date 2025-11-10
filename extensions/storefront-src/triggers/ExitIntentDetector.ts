/**
 * ExitIntentDetector
 * 
 * Detects when user is about to leave the page (exit intent)
 * Triggers when mouse moves towards browser chrome/address bar
 */

export interface ExitIntentConfig {
  sensitivity?: "low" | "medium" | "high";
  delay?: number; // Minimum time on page before exit intent can trigger (ms)
  mobileEnabled?: boolean;
}

export type ExitIntentCallback = () => void;

export class ExitIntentDetector {
  private config: Required<ExitIntentConfig>;
  private callback: ExitIntentCallback | null = null;
  private active = false;
  private triggered = false;
  private startTime = 0;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

  constructor(config: ExitIntentConfig = {}) {
    this.config = {
      sensitivity: config.sensitivity || "medium",
      delay: config.delay || 1000,
      mobileEnabled: config.mobileEnabled || false,
    };
  }

  /**
   * Start detecting exit intent
   */
  start(callback: ExitIntentCallback): void {
    if (this.active) {
      return; // Already active
    }

    // Don't activate on mobile unless explicitly enabled
    if (this.isMobile() && !this.config.mobileEnabled) {
      return;
    }

    this.callback = callback;
    this.active = true;
    this.triggered = false;
    this.startTime = Date.now();

    // Listen for mouse movement
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    document.addEventListener("mousemove", this.mouseMoveHandler);
  }

  /**
   * Stop detecting exit intent
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    
    if (this.mouseMoveHandler) {
      document.removeEventListener("mousemove", this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
  }

  /**
   * Check if detector is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Cleanup and remove all listeners
   */
  destroy(): void {
    this.stop();
    this.callback = null;
  }

  /**
   * Handle mouse move events
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.active || this.triggered) {
      return;
    }

    // Check if enough time has passed
    const elapsed = Date.now() - this.startTime;
    if (elapsed < this.config.delay) {
      return;
    }

    // Check if mouse is leaving viewport from top
    if (this.isExitIntent(e)) {
      this.trigger();
    }
  }

  /**
   * Check if mouse movement indicates exit intent
   */
  private isExitIntent(e: MouseEvent): boolean {
    const threshold = this.getSensitivityThreshold();
    
    // Exit intent is detected when mouse moves to top of viewport
    // (towards browser chrome/address bar)
    return e.clientY <= threshold;
  }

  /**
   * Get sensitivity threshold in pixels
   */
  private getSensitivityThreshold(): number {
    switch (this.config.sensitivity) {
      case "low":
        return 5; // Very close to edge
      case "medium":
        return 20; // Default
      case "high":
        return 50; // Further from edge
      default:
        return 20;
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

  /**
   * Check if device is mobile
   */
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}

