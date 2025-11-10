/**
 * CustomEventHandler
 * 
 * Handles custom JavaScript events for triggering popups
 * Allows developers to trigger popups programmatically
 */

export interface CustomEventConfig {
  eventNames?: string[];
}

export interface CustomEventData {
  eventName: string;
  detail: any;
}

export type CustomEventCallback = (data: CustomEventData) => void;

export class CustomEventHandler {
  private config: Required<CustomEventConfig>;
  private callback: CustomEventCallback | null = null;
  private active = false;
  private eventHandlers: Map<string, (e: Event) => void> = new Map();

  constructor(config: CustomEventConfig = {}) {
    this.config = {
      eventNames: config.eventNames || [],
    };
  }

  /**
   * Start listening for custom events
   */
  start(callback: CustomEventCallback): void {
    if (this.active) {
      return; // Already active
    }

    this.callback = callback;
    this.active = true;

    // Listen for each configured event
    this.config.eventNames.forEach((eventName) => {
      this.addEventListenerForName(eventName);
    });
  }

  /**
   * Stop listening for custom events
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;

    // Remove all event listeners
    this.eventHandlers.forEach((handler, eventName) => {
      document.removeEventListener(eventName, handler);
    });
    this.eventHandlers.clear();
  }

  /**
   * Check if handler is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Add a new event name to listen for (dynamically)
   */
  addEventName(eventName: string): void {
    if (!this.config.eventNames.includes(eventName)) {
      this.config.eventNames.push(eventName);
    }

    if (this.active) {
      this.addEventListenerForName(eventName);
    }
  }

  /**
   * Remove an event name from listening (dynamically)
   */
  removeEventName(eventName: string): void {
    const index = this.config.eventNames.indexOf(eventName);
    if (index > -1) {
      this.config.eventNames.splice(index, 1);
    }

    if (this.active && this.eventHandlers.has(eventName)) {
      const handler = this.eventHandlers.get(eventName)!;
      document.removeEventListener(eventName, handler);
      this.eventHandlers.delete(eventName);
    }
  }

  /**
   * Cleanup and remove all listeners
   */
  destroy(): void {
    this.stop();
    this.callback = null;
  }

  /**
   * Add event listener for a specific event name
   */
  private addEventListenerForName(eventName: string): void {
    if (this.eventHandlers.has(eventName)) {
      return; // Already listening
    }

    const handler = (e: Event) => this.handleCustomEvent(eventName, e);
    this.eventHandlers.set(eventName, handler);
    document.addEventListener(eventName, handler);
  }

  /**
   * Handle custom event
   */
  private handleCustomEvent(eventName: string, e: Event): void {
    if (!this.active || !this.callback) {
      return;
    }

    const customEvent = e as CustomEvent;
    const detail = customEvent.detail || {};

    // Trigger callback
    this.callback({
      eventName,
      detail,
    });
  }
}

