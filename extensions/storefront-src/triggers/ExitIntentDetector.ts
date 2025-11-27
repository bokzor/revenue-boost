/**
 * ExitIntentDetector
 *
 * Detects when user is about to leave the page (exit intent)
 * Uses multiple signals for accurate detection:
 * 1. Mouse leaving viewport from top (mouseleave event)
 * 2. Mouse velocity moving upward rapidly
 * 3. Mouse position near top edge with upward movement
 */

export interface ExitIntentConfig {
  sensitivity?: "low" | "medium" | "high";
  delay?: number; // Minimum time on page before exit intent can trigger (ms)
  mobileEnabled?: boolean;
}

export type ExitIntentCallback = () => void;

interface MousePosition {
  x: number;
  y: number;
  time: number;
}

export class ExitIntentDetector {
  private config: Required<ExitIntentConfig>;
  private callback: ExitIntentCallback | null = null;
  private active = false;
  private triggered = false;
  private startTime = 0;

  // Mouse tracking for velocity calculation
  private lastPositions: MousePosition[] = [];
  private readonly POSITION_HISTORY_SIZE = 5;

  // Event handlers
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseLeaveHandler: ((e: MouseEvent) => void) | null = null;

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
    this.lastPositions = [];

    // Listen for mouse movement (for velocity tracking)
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
    document.addEventListener("mousemove", this.mouseMoveHandler, { passive: true });

    // Listen for mouse leaving the document (primary detection method)
    this.mouseLeaveHandler = this.handleMouseLeave.bind(this);
    document.documentElement.addEventListener("mouseleave", this.mouseLeaveHandler);
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

    if (this.mouseLeaveHandler) {
      document.documentElement.removeEventListener("mouseleave", this.mouseLeaveHandler);
      this.mouseLeaveHandler = null;
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
    this.lastPositions = [];
  }

  /**
   * Track mouse position for velocity calculation
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.active || this.triggered) {
      return;
    }

    // Store position history for velocity calculation
    this.lastPositions.push({
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    });

    // Keep only recent positions
    if (this.lastPositions.length > this.POSITION_HISTORY_SIZE) {
      this.lastPositions.shift();
    }
  }

  /**
   * Handle mouse leaving the document
   * This is the primary exit intent detection method
   */
  private handleMouseLeave(e: MouseEvent): void {
    if (!this.active || this.triggered) {
      return;
    }

    // Check if enough time has passed
    const elapsed = Date.now() - this.startTime;
    if (elapsed < this.config.delay) {
      return;
    }

    // Only trigger if mouse left from the TOP of the viewport
    // e.clientY will be <= 0 when leaving from top
    if (!this.isLeavingFromTop(e)) {
      return;
    }

    // Check if mouse was moving upward (not just hovering at top)
    if (!this.hasUpwardVelocity()) {
      return;
    }

    this.trigger();
  }

  /**
   * Check if mouse is leaving from the top of the viewport
   */
  private isLeavingFromTop(e: MouseEvent): boolean {
    const threshold = this.getSensitivityThreshold();

    // Mouse is leaving from top if:
    // 1. clientY is at or above the threshold (near/above top edge)
    // 2. Mouse is not leaving from sides (clientX is within viewport)
    const isNearTop = e.clientY <= threshold;
    const isWithinHorizontalBounds = e.clientX >= 0 && e.clientX <= window.innerWidth;

    return isNearTop && isWithinHorizontalBounds;
  }

  /**
   * Calculate if mouse has upward velocity (moving toward top)
   * This reduces false positives from mouse just being at top of screen
   */
  private hasUpwardVelocity(): boolean {
    if (this.lastPositions.length < 2) {
      // Not enough data, assume intent based on position alone
      return true;
    }

    const oldest = this.lastPositions[0];
    const newest = this.lastPositions[this.lastPositions.length - 1];

    const deltaY = newest.y - oldest.y;
    const deltaTime = newest.time - oldest.time;

    // Avoid division by zero
    if (deltaTime === 0) {
      return true;
    }

    // Calculate velocity (pixels per millisecond)
    const velocityY = deltaY / deltaTime;

    // Mouse is moving upward if velocity is negative
    // Use sensitivity to determine threshold
    const velocityThreshold = this.getVelocityThreshold();

    // velocityY < 0 means moving up, we want significant upward movement
    return velocityY < -velocityThreshold;
  }

  /**
   * Get velocity threshold based on sensitivity
   * Lower threshold = easier to trigger
   */
  private getVelocityThreshold(): number {
    switch (this.config.sensitivity) {
      case "low":
        return 0.5; // Requires fast upward movement
      case "medium":
        return 0.2; // Moderate upward movement
      case "high":
        return 0.05; // Any noticeable upward movement
      default:
        return 0.2;
    }
  }

  /**
   * Get position threshold in pixels from top edge
   */
  private getSensitivityThreshold(): number {
    switch (this.config.sensitivity) {
      case "low":
        return 5; // Very close to edge
      case "medium":
        return 15; // Default
      case "high":
        return 30; // Further from edge
      default:
        return 15;
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

