/**
 * Session Management
 * Tracks visitor sessions and popup display history
 */

const SESSION_KEY = "revenue_boost_session";
const SHOWN_KEY = "revenue_boost_shown";

export interface SessionData {
  sessionId: string;
  visitCount: number;
  isReturningVisitor: boolean;
  shownCampaigns: string[];
}

class SessionManager {
  private sessionId: string;
  private shownCampaigns: Set<string>;

  constructor() {
    this.sessionId = this.initSessionId();
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

