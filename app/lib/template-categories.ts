/**
 * Template Categories Configuration
 *
 * Defines template categories and their metadata
 */

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  order: number;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  "email-capture": {
    id: "email-capture",
    name: "Email Capture",
    description: "Collect email addresses and grow your subscriber list",
    icon: "📧",
    order: 1,
  },
  "sales-boost": {
    id: "sales-boost",
    name: "Sales Boost",
    description: "Increase conversions and drive more sales",
    icon: "💰",
    order: 2,
  },
  "engagement": {
    id: "engagement",
    name: "Engagement",
    description: "Increase user engagement and interaction",
    icon: "🎯",
    order: 3,
  },
  "cart-recovery": {
    id: "cart-recovery",
    name: "Cart Recovery",
    description: "Recover abandoned carts and reduce cart abandonment",
    icon: "🛒",
    order: 4,
  },
  "social-proof": {
    id: "social-proof",
    name: "Social Proof",
    description: "Build trust with social proof notifications",
    icon: "⭐",
    order: 5,
  },
  "announcements": {
    id: "announcements",
    name: "Announcements",
    description: "Share important updates and announcements",
    icon: "📢",
    order: 6,
  },
  "gamification": {
    id: "gamification",
    name: "Gamification",
    description: "Engage users with interactive games and rewards",
    icon: "🎮",
    order: 7,
  },
  "urgency": {
    id: "urgency",
    name: "Urgency & Scarcity",
    description: "Create urgency with countdown timers and limited offers",
    icon: "⏰",
    order: 8,
  },
};


