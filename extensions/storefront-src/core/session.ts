/**
 * Session Management
 * Tracks visitor sessions and popup display history
 *
 * Note: Visitor ID is managed server-side via cookies for security and persistence
 * The server will set rb_visitor_id cookie which persists for 90 days
 */

const SESSION_KEY = "revenue_boost_session";
const SHOWN_KEY = "revenue_boost_shown";
const VISITOR_KEY = "revenue_boost_visitor"; // Client-side backup

export interface SessionData {
  sessionId: string;
  visitorId: string;
  visitCount: number;
  isReturningVisitor: boolean;
  shownCampaigns: string[];
}

class SessionManager {
  private sessionId: string;
  private visitorId: string;
  private shownCampaigns: Set<string>;

  constructor() {
    this.sessionId = this.initSessionId();
    this.visitorId = this.initVisitorId();
    this.shownCampaigns = this.loadShownCampaigns();
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

  private loadShownCampaigns(): Set<string> {
    const stored = sessionStorage.getItem(SHOWN_KEY);
    if (stored) {
      try {
        return new Set(JSON.parse(stored));
      } catch {
        return new Set();
      }
    }
    return new Set();
  }

  private saveShownCampaigns(): void {
    sessionStorage.setItem(
      SHOWN_KEY,
      JSON.stringify(Array.from(this.shownCampaigns))
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

  wasShown(campaignId: string): boolean {
    return this.shownCampaigns.has(campaignId);
  }

  markShown(campaignId: string): void {
    this.shownCampaigns.add(campaignId);
    this.saveShownCampaigns();
  }

  getData(): SessionData {
    return {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      visitCount: this.getVisitCount(),
      isReturningVisitor: this.isReturningVisitor(),
      shownCampaigns: Array.from(this.shownCampaigns),
    };
  }

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SHOWN_KEY);
    this.shownCampaigns.clear();
    this.sessionId = this.initSessionId();
  }
}

export const session = new SessionManager();

