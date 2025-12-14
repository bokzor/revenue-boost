/**
 * LivePreviewPanel Component
 *
 * Displays a live preview of the campaign popup as the user configures it.
 * Features device toggle (mobile/tablet/desktop) and real-time updates.
 *
 * Key Architecture:
 * - Uses a "Virtual Viewport" approach: The preview renders at a fixed logical size
 *   (e.g., 375px for mobile, 1024px for desktop) regardless of the physical panel size.
 * - Uses CSS Transforms to scale this virtual viewport down to fit the available space.
 * - This ensures that layout breakpoints (media queries or container queries) trigger
 *   correctly based on the *simulated* device size, not the *actual* panel width.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  BlockStack,
  Text,
  ButtonGroup,
  Button,
  RangeSlider,
  InlineStack,
} from "@shopify/polaris";
import { DeviceFrame } from "./DeviceFrame";
import { TemplatePreview } from "./TemplatePreview";

export type PreviewDevice = "mobile" | "tablet" | "desktop";

export interface LivePreviewPanelProps {
  templateType?: string;
  config: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  targetRules?: Record<string, unknown>;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
  /** @deprecated No longer used - Preview on Store moved to header */
  shopDomain?: string;
  globalCustomCSS?: string;
  /** Default theme tokens for preview (from store's default preset or Shopify theme) */
  defaultThemeTokens?: import("~/domains/campaigns/types/design-tokens").DesignTokens;
  /** Controlled device mode - when provided, overrides internal state */
  device?: PreviewDevice;
  /** Callback when device changes (for controlled mode) */
  onDeviceChange?: (device: PreviewDevice) => void;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  templateType,
  config,
  designConfig,
  targetRules: _targetRules,
  onPreviewElementReady,
  globalCustomCSS,
  defaultThemeTokens,
  device: controlledDevice,
  onDeviceChange,
}) => {
  const [internalDevice, setInternalDevice] = useState<PreviewDevice>("tablet");

  // Support both controlled and uncontrolled modes
  const device = controlledDevice ?? internalDevice;
  const setDevice = onDeviceChange ?? setInternalDevice;
  const [zoom, setZoom] = useState(100);

  // ✅ KEY: Virtual viewport sizes - independent of physical container
  // These dimensions trigger the correct layout modes in the popups.
  // Desktop uses a wider logical viewport so overlays (like upsell bars)
  // don't appear to span the *entire* browser width in preview.
  // Mobile uses iPhone 14/15 dimensions (390×844) - more representative of modern phones.
  // Desktop height increased to 768px to accommodate content-heavy popups like Product Upsell.
  const virtualViewports = {
    mobile: { width: 390, height: 844 },
    tablet: { width: 768, height: 800 },
    desktop: { width: 1024, height: 768 },
  };

  const viewport = virtualViewports[device];
  const previewRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
    null
  );

  // Measure physical container size to determine available space
  useEffect(() => {
    const measureContainer = () => {
      if (previewRef.current) {
        const { clientWidth, clientHeight } = previewRef.current;
        setContainerSize({ width: clientWidth, height: clientHeight });
      }
    };

    measureContainer();
    const observer = new ResizeObserver(measureContainer);
    if (previewRef.current) observer.observe(previewRef.current);

    return () => observer.disconnect();
  }, []);

  // ✅ KEY: Calculate scale to fit virtual viewport into physical container
  const calculateScale = () => {
    if (!containerSize) return 1;

    // Account for the padding applied on the preview container (20px on each side)
    const paddingX = 40;
    const paddingY = 40;
    const availableWidth = containerSize.width - paddingX;
    const availableHeight = containerSize.height - paddingY;

    if (availableWidth <= 0 || availableHeight <= 0) return 1;

    // Scale virtual viewport to fit BOTH width and height in the available space.
    // We only scale down, never up (unless zoomed).
    const widthScale = availableWidth / viewport.width;
    const heightScale = availableHeight / viewport.height;
    const rawFitScale = Math.min(1, widthScale, heightScale);

    // Apply a small safety margin so content doesn't hug the edges and
    // there's less risk of run-cut at extreme sizes.
    const fitScale = rawFitScale * 0.9;

    // Apply zoom on top of the best-fit scale
    const totalScale = fitScale * (zoom / 100);

    // Min 20% scale for readability
    return Math.max(0.2, totalScale);
  };

  const scale = calculateScale();

  if (!templateType) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Live Preview
          </Text>
          <div
            style={{
              minHeight: "500px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f6f6f7",
              borderRadius: "8px",
            }}
          >
            <BlockStack inlineAlign="center" gap="200">
              <div style={{ fontSize: "48px" }}>📋</div>
              <Text as="p" variant="bodyMd" tone="subdued">
                Select a template to preview
              </Text>
            </BlockStack>
          </div>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <div>
          <Text as="h3" variant="headingMd">
            Live Preview
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            See how your campaign will look
          </Text>
        </div>

        {/* Device & Zoom Controls */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <ButtonGroup variant="segmented">
            <Button pressed={device === "mobile"} onClick={() => setDevice("mobile")} size="slim">
              📱 Mobile
            </Button>
            <Button pressed={device === "tablet"} onClick={() => setDevice("tablet")} size="slim">
              📱 Tablet
            </Button>
            <Button pressed={device === "desktop"} onClick={() => setDevice("desktop")} size="slim">
              💻 Desktop
            </Button>
          </ButtonGroup>

          <InlineStack align="end" blockAlign="center" gap="200">
            <Text as="span" variant="bodySm" tone="subdued">
              Zoom
            </Text>
            <div style={{ width: "150px" }}>
              <RangeSlider
                label=""
                value={zoom}
                onChange={(value) => setZoom(Array.isArray(value) ? value[0] : value)}
                min={50}
                max={150}
                output
                suffix={
                  <Text as="span" variant="bodySm">
                    {zoom}%
                  </Text>
                }
              />
            </div>
          </InlineStack>
        </div>

        {/* ✅ KEY: Preview Container with scaling */}
        <div
          ref={previewRef}
          style={{
            background: device === "desktop" ? "#f6f6f7" : "#e4e5e7", // Darker bg for mobile/tablet to show contrast
            borderRadius: "8px",
            padding: "20px",
            minHeight: "600px",
            height: "650px", // Fixed height for consistency
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden", // Hide overflow from scaling
            position: "relative",
          }}
        >
          {/* ✅ KEY: Scale wrapper - scales virtual viewport to fit physical space */}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease-out",
              // Ensure the scaled element takes up space correctly
              width: viewport.width,
              height: viewport.height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* ✅ KEY: Virtual viewport container - sized by device mode */}
            <div
              style={{
                width: viewport.width,
                height: viewport.height,
                position: "relative",
                boxShadow: device !== "desktop" ? "0 20px 50px -12px rgba(0,0,0,0.25)" : "none",
              }}
            >
              <DeviceFrame device={device}>
                <TemplatePreview
                  templateType={templateType}
                  config={config}
                  designConfig={designConfig}
                  onPreviewElementReady={onPreviewElementReady}
                  campaignCustomCSS={designConfig?.customCSS as string | undefined}
                  globalCustomCSS={globalCustomCSS}
                  defaultThemeTokens={defaultThemeTokens}
                />
              </DeviceFrame>
            </div>
          </div>
        </div>

        <Text as="p" variant="bodyXs" tone="subdued" alignment="center">
          Preview scaled to {Math.round(scale * 100)}% to fit screen
        </Text>
      </BlockStack>
    </Card>
  );
};
