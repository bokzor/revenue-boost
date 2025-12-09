/**
 * TemplateShowcaseGrid - Example Marketing Component
 *
 * This is an example component showing how to use MarketingTemplatePreview
 * to create a template gallery for your marketing website.
 *
 * Features:
 * - Displays all 11 template types in a responsive grid
 * - Each template is fully interactive (spin, scratch, submit forms)
 * - Shows template title, description, and category
 * - Scales templates to fit nicely in grid cells
 *
 * Usage in marketing site:
 * ```tsx
 * import { TemplateShowcaseGrid } from '~/shared/preview/examples/TemplateShowcaseGrid';
 *
 * export default function TemplatesPage() {
 *   return (
 *     <section>
 *       <h1>11 Powerful Popup Templates</h1>
 *       <TemplateShowcaseGrid />
 *     </section>
 *   );
 * }
 * ```
 */

import React, { useState } from "react";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import { MarketingTemplatePreview } from "../MarketingTemplatePreview";
import { TEMPLATE_MARKETING_INFO } from "../demo-configs";

// Template types to display (you can customize this order)
const TEMPLATE_TYPES: TemplateType[] = [
  "NEWSLETTER",
  "SPIN_TO_WIN",
  "SCRATCH_CARD",
  "FLASH_SALE",
  "COUNTDOWN_TIMER",
  "FREE_SHIPPING",
  "CART_ABANDONMENT",
  "PRODUCT_UPSELL",
  "SOCIAL_PROOF",
  "ANNOUNCEMENT",
  "EXIT_INTENT",
];

export interface TemplateShowcaseGridProps {
  /** Filter to show only specific templates */
  templates?: TemplateType[];
  /** Device frame to use for all previews */
  device?: "mobile" | "tablet" | "desktop" | "none";
  /** Number of columns in the grid */
  columns?: 2 | 3 | 4;
  /** Whether to show template info below each preview */
  showInfo?: boolean;
  /** Callback when a template is clicked */
  onTemplateClick?: (templateType: TemplateType) => void;
}

export const TemplateShowcaseGrid: React.FC<TemplateShowcaseGridProps> = ({
  templates = TEMPLATE_TYPES,
  device = "none",
  columns = 3,
  showInfo = true,
  onTemplateClick,
}) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType | null>(null);

  const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "32px",
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  };

  const cardStyles: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
    padding: "24px",
    cursor: onTemplateClick ? "pointer" : "default",
    transition: "transform 0.2s, box-shadow 0.2s",
  };

  const activeCardStyles: React.CSSProperties = {
    ...cardStyles,
    transform: "scale(1.02)",
    boxShadow: "0 8px 32px rgba(99, 102, 241, 0.2)",
  };

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    templateType: TemplateType
  ) => {
    if (!onTemplateClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTemplateClick(templateType);
    }
  };

  return (
    <div style={gridStyles}>
      {templates.map((templateType) => (
        <div
          key={templateType}
          style={activeTemplate === templateType ? activeCardStyles : cardStyles}
          onMouseEnter={() => setActiveTemplate(templateType)}
          onMouseLeave={() => setActiveTemplate(null)}
          onClick={() => onTemplateClick?.(templateType)}
          onKeyDown={(event) => handleCardKeyDown(event, templateType)}
          role={onTemplateClick ? "button" : undefined}
          tabIndex={onTemplateClick ? 0 : -1}
        >
          <MarketingTemplatePreview
            templateType={templateType}
            device={device}
            scale={device === "none" ? 0.6 : 0.5}
            showInfo={showInfo}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Single template spotlight - for featuring one template at a time
 */
export const TemplateSpotlight: React.FC<{
  templateType: TemplateType;
  device?: "mobile" | "desktop";
}> = ({ templateType, device = "desktop" }) => {
  const info = TEMPLATE_MARKETING_INFO[templateType];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "48px",
        padding: "48px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* Preview */}
      <div style={{ flex: 1 }}>
        <MarketingTemplatePreview
          templateType={templateType}
          device={device}
          scale={device === "mobile" ? 0.8 : 0.7}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, maxWidth: "400px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#6366F1",
            backgroundColor: "#EEF2FF",
            borderRadius: "16px",
            marginBottom: "16px",
          }}
        >
          {info.category}
        </span>
        <h2 style={{ fontSize: "32px", fontWeight: 700, margin: "0 0 16px 0" }}>
          {info.title}
        </h2>
        <p style={{ fontSize: "18px", color: "#6B7280", lineHeight: 1.6 }}>
          {info.description}
        </p>
      </div>
    </div>
  );
};

export default TemplateShowcaseGrid;
