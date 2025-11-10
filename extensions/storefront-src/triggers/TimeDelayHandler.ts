/**
 * TimeDelayHandler
 * 
 * Handles time-based delays for triggering popups
 * Supports pause/resume functionality
 */

export interface TimeDelayConfig {
  delay?: number; // milliseconds
}

export type TimeDelayCallback = () => void;

export class TimeDelayHandler {
  private config: Required<TimeDelayConfig>;
  private callback: TimeDelayCallback | null = null;
  private active = false;
  private paused = false;
  private triggered = false;
  private timer: number | null = null;
  private startTime = 0;
  private remainingTime = 0;

  constructor(config: TimeDelayConfig = {}) {
    this.config = {
      delay: config.delay || 3000, // Default 3 seconds
    };
  }

  /**
   * Start the delay timer
   */
  start(callback: TimeDelayCallback): void {
    if (this.active) {
      return; // Already active
    }

    this.callback = callback;
    this.active = true;
    this.triggered = false;
    this.paused = false;
    this.startTime = Date.now();
    this.remainingTime = this.config.delay;

    this.scheduleCallback();
  }

  /**
   * Stop the timer
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.paused = false;
    
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (!this.active || this.paused) {
      return;
    }

    this.paused = true;
    
    // Calculate remaining time
    const elapsed = Date.now() - this.startTime;
    this.remainingTime = Math.max(0, this.config.delay - elapsed);

    // Clear current timer
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Resume the timer
   */
  resume(): void {
    if (!this.active || !this.paused) {
      return;
    }

    this.paused = false;
    this.startTime = Date.now();

    this.scheduleCallback();
  }

  /**
   * Check if handler is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Check if handler is paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(): number {
    if (!this.active) {
      return 0;
    }

    if (this.paused) {
      return this.remainingTime;
    }

    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.config.delay - elapsed);
  }

  /**
   * Cleanup and remove timer
   */
  destroy(): void {
    this.stop();
    this.callback = null;
  }

  /**
   * Schedule the callback
   */
  private scheduleCallback(): void {
    const delay = this.paused ? this.remainingTime : this.config.delay;

    this.timer = window.setTimeout(() => {
      this.trigger();
    }, delay);
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
    
    // Stop after trigger
    this.stop();
  }
}

