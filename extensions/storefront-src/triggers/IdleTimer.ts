/**
 * IdleTimer
 *
 * Detects when user has been idle (no activity) for a specified duration
 */

export interface IdleTimerConfig {
  idleDuration?: number; // milliseconds
  events?: string[]; // Events to track for activity
}

export type IdleTimerCallback = () => void;

export class IdleTimer {
  private config: Required<IdleTimerConfig>;
  private callback: IdleTimerCallback | null = null;
  private active = false;
  private triggered = false;
  private timer: number | null = null;
  private lastActivityTime = 0;
  private activityHandler: ((e: Event) => void) | null = null;

  constructor(config: IdleTimerConfig = {}) {
    this.config = {
      idleDuration: config.idleDuration || 30000, // Default 30 seconds
      events: config.events || [
        "mousemove",
        "mousedown",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ],
    };
  }

  /**
   * Start the idle timer
   */
  start(callback: IdleTimerCallback): void {
    if (this.active) {
      return; // Already active
    }

    this.callback = callback;
    this.active = true;
    this.triggered = false;
    this.lastActivityTime = Date.now();

    // Listen for activity events
    this.activityHandler = this.handleActivity.bind(this);
    this.config.events.forEach((event) => {
      document.addEventListener(event, this.activityHandler!, { passive: true });
    });

    // Start idle timer
    this.resetTimer();
  }

  /**
   * Stop the idle timer
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;

    // Remove activity listeners
    if (this.activityHandler) {
      this.config.events.forEach((event) => {
        document.removeEventListener(event, this.activityHandler!, false);
      });
      this.activityHandler = null;
    }

    // Clear timer
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Check if timer is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Get current idle time in milliseconds
   */
  getIdleTime(): number {
    if (!this.active) {
      return 0;
    }

    return Date.now() - this.lastActivityTime;
  }

  /**
   * Cleanup and remove all listeners
   */
  destroy(): void {
    this.stop();
    this.callback = null;
  }

  /**
   * Handle user activity
   */
  private handleActivity(e: Event): void {
    if (!this.active || this.triggered) {
      return;
    }

    void e; // mark param as used to satisfy lint

    // Update last activity time
    this.lastActivityTime = Date.now();

    // Reset idle timer
    this.resetTimer();
  }

  /**
   * Reset the idle timer
   */
  private resetTimer(): void {
    // Clear existing timer
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }

    // Start new timer
    this.timer = window.setTimeout(() => {
      this.trigger();
    }, this.config.idleDuration);
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

