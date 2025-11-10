/**
 * React PopupManager - Optimized Version
 *
 * This is now a thin wrapper around the shared PopupManagerCore logic
 * to eliminate code duplication between React and Preact versions.
 */

// Re-export the React implementation
export {
  PopupManager,
  type PopupManagerProps,
  type CampaignPopupConfig,
} from "./PopupManagerReact";
