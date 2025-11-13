/**
 * Session Management
 * Tracks visitor sessions and user dismissals
 *
 * Note: Visitor ID is managed server-side via cookies for security and persistence
 * The server will set rb_visitor_id cookie which persists for 90 days
 *
 * Frequency capping (max views per session/day) is handled server-side via Redis.
 * Client only tracks explicit user dismissals (close button clicks).
 */

const SESSION_KEY = "revenue_boost_session";
const DISMISSED_KEY = "revenue_boost_dismissed";
const VISITOR_KEY = "revenue_boost_visitor"; // Client-side backup

export interface SessionData {
  sessionId: string;
  visitorId: string;
  visitCount: number;
  isReturningVisitor: boolean;
  dismissedCampaigns: string[];
}

class SessionManager {
  private sessionId: string;
  private visitorId: string;
  private dismissedCampaigns: Set<string>;

  constructor() {
    this.sessionId = this.initSessionId();
    this.visitorId = this.initVisitorId();
    this.dismissedCampaigns = this.loadDismissedCampaigns();
    this.incrementVisitCount();
  }

  private initSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
  }

  private initVisitorId(): string {
    // Try to get visitor ID from localStorage (client-side backup)
    let visitorId = localStorage.getItem(VISITOR_KEY);

    if (!visitorId) {
      // Generate new visitor ID
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(VISITOR_KEY, visitorId);
    }

    // Note: Server will also set rb_visitor_id cookie which takes precedence
    // This is just a client-side backup for when cookies are disabled
    return visitorId;
  }

  private loadDismissedCampaigns(): Set<string> {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        return new Set();
      }
    }
    return new Set();
  }

  private saveDismissedCampaigns(): void {
    localStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify(Array.from(this.dismissedCampaigns))
    );
  }

  private incrementVisitCount(): void {
    const count = parseInt(localStorage.getItem("revenue_boost_visit_count") || "0");
    localStorage.setItem("revenue_boost_visit_count", (count + 1).toString());
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getVisitorId(): string {
    return this.visitorId;
  }

  getVisitCount(): number {
    return parseInt(localStorage.getItem("revenue_boost_visit_count") || "1");
  }

  isReturningVisitor(): boolean {
    return this.getVisitCount() > 1;
  }

  /**
   * Check if campaign was dismissed by user
   * Server handles frequency capping via Redis
   */
  wasDismissed(campaignId: string): boolean {
    return this.dismissedCampaigns.has(campaignId);
  }

  /**
   * Mark campaign as dismissed (user clicked close button)
   */
  markDismissed(campaignId: string): void {
    this.dismissedCampaigns.add(campaignId);
    this.saveDismissedCampaigns();
  }

  getData(): SessionData {
    return {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      visitCount: this.getVisitCount(),
      isReturningVisitor: this.isReturningVisitor(),
      dismissedCampaigns: Array.from(this.dismissedCampaigns),
    };
  }

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DISMISSED_KEY);
    this.dismissedCampaigns.clear();
    this.sessionId = this.initSessionId();
  }
}

export const session = new SessionManager();

