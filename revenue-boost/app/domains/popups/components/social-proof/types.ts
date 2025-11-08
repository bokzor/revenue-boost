/**
 * Social Proof Types
 *
 * Type definitions for social proof notifications that build trust and credibility.
 */

import type { SocialProofConfig as TemplateSocialProofConfig } from "~/lib/template-configs";

export type SocialProofNotificationType = "purchase" | "visitor" | "review";

export interface BaseSocialProofNotification {
  id: string;
  type: SocialProofNotificationType;
  timestamp: number;
}

export interface PurchaseNotification extends BaseSocialProofNotification {
  type: "purchase";
  customerName: string; // "John D." (anonymized)
  location: string; // "New York, NY"
  productName: string; // "Classic T-Shirt"
  productImage?: string; // Optional product image URL
  timeAgo: string; // "2 minutes ago"
  verified: boolean; // Show verified badge
}

export interface VisitorNotification extends BaseSocialProofNotification {
  type: "visitor";
  count: number; // 23
  context: string; // "viewing this product" | "shopping now"
  trending: boolean; // Show trending indicator
}

export interface ReviewNotification extends BaseSocialProofNotification {
  type: "review";
  rating: number; // 4.8
  reviewCount: number; // 1,234
  recentReview?: {
    text: string; // "Love this product!"
    author: string; // "Sarah M."
    verified: boolean;
  };
}

export type SocialProofNotification =
  | PurchaseNotification
  | VisitorNotification
  | ReviewNotification;

// Extend the template config with additional runtime properties
export interface SocialProofConfig extends Partial<TemplateSocialProofConfig> {
  // Notification Types
  enablePurchaseNotifications: boolean;
  enableVisitorNotifications: boolean;
  enableReviewNotifications: boolean;

  // Display Settings
  position: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  displayDuration: number; // seconds (default: 5)
  rotationInterval: number; // seconds (default: 8)
  maxNotificationsPerSession: number; // default: 5

  // Data Settings
  purchaseLookbackHours: number; // default: 48
  minVisitorCount: number; // default: 5
  minReviewRating: number; // default: 4.0

  // Privacy Settings
  anonymizeCustomerNames: boolean; // default: true
  showCustomerLocation: boolean; // default: true

  // Design Settings
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  showIcons: boolean;
  showVerifiedBadge: boolean;

  // Enhanced color properties
  notificationBackgroundColor?: string;
  timestampColor?: string;
  actionTextColor?: string;
  customerNameColor?: string;
  productNameColor?: string;
}

export const DEFAULT_SOCIAL_PROOF_CONFIG: SocialProofConfig = {
  // Notification Types
  enablePurchaseNotifications: true,
  enableVisitorNotifications: true,
  enableReviewNotifications: true,

  // Display Settings
  position: "bottom-left",
  displayDuration: 5,
  rotationInterval: 8,
  maxNotificationsPerSession: 5,

  // Data Settings
  purchaseLookbackHours: 48,
  minVisitorCount: 5,
  minReviewRating: 4.0,

  // Privacy Settings
  anonymizeCustomerNames: true,
  showCustomerLocation: true,

  // Design Settings
  backgroundColor: "#FFFFFF",
  textColor: "#1A1A1A",
  accentColor: "#10B981",
  showIcons: true,
  showVerifiedBadge: true,

  // Enhanced color properties
  notificationBackgroundColor: "#F9FAFB",
  timestampColor: "#6B7280",
  actionTextColor: "#059669",
  customerNameColor: "#1F2937",
  productNameColor: "#3B82F6",
};
