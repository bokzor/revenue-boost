/**
 * Shared Preview Components
 *
 * This package provides reusable preview components that can be used by:
 * - Shopify Admin (campaign editor preview)
 * - Marketing Website (template showcases)
 * - Documentation (interactive examples)
 *
 * Key Components:
 * - DeviceFrame: Renders mobile/tablet/desktop chrome around content
 * - MarketingTemplatePreview: Ready-to-use marketing showcase wrapper
 * - Demo Configs: Pre-configured attractive demos for all 11 templates
 *
 * The underlying TemplatePreview component is imported from the popups domain
 * since it handles the complex preview logic and mock callbacks.
 */

// Device frame component (fully portable)
export { DeviceFrame } from "./DeviceFrame";
export type { DeviceFrameProps } from "./DeviceFrame";

// Marketing-ready preview wrapper
export { MarketingTemplatePreview } from "./MarketingTemplatePreview";
export type { MarketingTemplatePreviewProps } from "./MarketingTemplatePreview";

// Demo configurations for all 11 templates
export {
  DEMO_CONFIGS,
  getDemoConfig,
  getAllDemoConfigs,
  TEMPLATE_MARKETING_INFO,
} from "./demo-configs";

// Re-export the core TemplatePreview for advanced usage
// This allows consumers to use the lower-level component if needed
export { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
export type {
  TemplatePreviewProps,
  TemplatePreviewRef,
} from "~/domains/popups/components/preview/TemplatePreview";

// Re-export the template preview registry for custom config building
export {
  getTemplatePreviewEntry,
  transformDiscountConfig,
  TEMPLATE_PREVIEW_REGISTRY,
} from "~/domains/popups/components/preview/template-preview-registry";
export type {
  TemplatePreviewEntry,
  ConfigBuilder,
} from "~/domains/popups/components/preview/template-preview-registry";

