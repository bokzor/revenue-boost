/**
 * MarketingTemplatePreview Component
 *
 * A simplified wrapper around TemplatePreview designed for marketing websites.
 * Provides a clean API for showcasing all 11 template types with pre-configured
 * demo content and full E2E flow simulation.
 *
 * Features:
 * - Pre-configured demo content for all templates
 * - Full interactive flow (spin wheel, scratch card, form submit, etc.)
 * - Optional device frame (mobile/tablet/desktop)
 * - Zero Shopify/Polaris dependencies
 * - Customizable scale for responsive layouts
 *
 * Usage:
 * ```tsx
 * <MarketingTemplatePreview
 *   templateType="SPIN_TO_WIN"
 *   device="mobile"
 *   scale={0.8}
 * />
 * ```
 */

import React, { useMemo } from "react";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { DeviceFrame } from "./DeviceFrame";
import { getDemoConfig, TEMPLATE_MARKETING_INFO } from "./demo-configs";

export interface MarketingTemplatePreviewProps {
  /** The template type to render */
  templateType: TemplateType;

  /** Optional device frame to wrap the preview */
  device?: "mobile" | "tablet" | "desktop" | "none";

  /** Scale factor for the entire preview (useful for grids) */
  scale?: number;

  /** Custom content config to override demo defaults */
  customContent?: Record<string, unknown>;

  /** Custom design config to override demo defaults */
  customDesign?: Record<string, unknown>;

  /** Whether to show the template info (title + description) */
  showInfo?: boolean;

  /** Custom class name for the container */
  className?: string;

  /** Custom styles for the container */
  style?: React.CSSProperties;
}

export const MarketingTemplatePreview: React.FC<MarketingTemplatePreviewProps> = ({
  templateType,
  device = "none",
  scale = 1,
  customContent,
  customDesign,
  showInfo = false,
  className,
  style,
}) => {
  // Get the demo config for this template
  const demoConfig = useMemo(() => getDemoConfig(templateType), [templateType]);

  // Merge custom overrides with demo defaults
  const contentConfig = useMemo(
    () => ({
      ...demoConfig.content,
      ...customContent,
    }),
    [demoConfig.content, customContent]
  );

  const designConfig = useMemo(
    () => ({
      ...demoConfig.design,
      ...customDesign,
      previewMode: true, // Always ensure preview mode is on
    }),
    [demoConfig.design, customDesign]
  );

  // Get marketing info if needed
  const info = showInfo ? TEMPLATE_MARKETING_INFO[templateType] : null;

  // The core preview component
  const previewContent = (
    <TemplatePreview
      templateType={templateType}
      config={contentConfig}
      designConfig={designConfig}
    />
  );

  // Wrap in device frame if specified
  const framedContent =
    device !== "none" ? (
      <DeviceFrame device={device}>{previewContent}</DeviceFrame>
    ) : (
      previewContent
    );

  // Apply scaling
  const scaledContent =
    scale !== 1 ? (
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: scale < 1 ? `${100 / scale}%` : undefined,
        }}
      >
        {framedContent}
      </div>
    ) : (
      framedContent
    );

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        ...style,
      }}
    >
      {scaledContent}

      {info && (
        <div style={{ textAlign: "center", maxWidth: "300px" }}>
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "18px",
              fontWeight: 600,
              color: "#1F2937",
            }}
          >
            {info.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#6B7280",
            }}
          >
            {info.description}
          </p>
          <span
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: 500,
              color: "#6366F1",
              backgroundColor: "#EEF2FF",
              borderRadius: "12px",
            }}
          >
            {info.category}
          </span>
        </div>
      )}
    </div>
  );
};

export default MarketingTemplatePreview;

