/**
 * Storefront Notification Components
 * Customer-facing notification and banner components
 */

export { BannerPopup } from "./BannerPopup";
export type { BannerPopupProps } from "./BannerPopup";

// Social proof notifications
export { SocialProofNotificationComponent } from "./social-proof/SocialProofNotification";
export { SocialProofPopup } from "./social-proof/SocialProofPopup";
export type {
  SocialProofNotificationType,
  BaseSocialProofNotification,
  PurchaseNotification,
  VisitorNotification,
  ReviewNotification,
  SocialProofNotification,
} from "./social-proof/types";
