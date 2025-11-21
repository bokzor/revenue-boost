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
import { ViewIcon } from "@shopify/polaris-icons";
import { DeviceFrame } from "./DeviceFrame";
import { TemplatePreview } from "./TemplatePreview";

export interface LivePreviewPanelProps {
  templateType?: string;
  config: Record<string, any>;
  designConfig: Record<string, any>;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
  shopDomain?: string;
  campaignId?: string;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  templateType,
  config,
  designConfig,
  onPreviewElementReady,
  shopDomain,
  campaignId,
}) => {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [zoom, setZoom] = useState(100);

  // ✅ KEY: Virtual viewport sizes - independent of physical container
  // These dimensions trigger the correct layout modes in the popups
  const virtualViewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 800 },
    desktop: { width: 1024, height: 600 },
  };

  const viewport = virtualViewports[device];
  const previewRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // Measure physical container width to determine available space
  useEffect(() => {
    const measureContainer = () => {
      if (previewRef.current) {
        setContainerWidth(previewRef.current.clientWidth);
      }
    };

    measureContainer();
    const observer = new ResizeObserver(measureContainer);
    if (previewRef.current) observer.observe(previewRef.current);

    return () => observer.disconnect();
  }, []);

  // ✅ KEY: Calculate scale to fit virtual viewport into physical container
  const calculateScale = () => {
    if (!containerWidth) return 1;

    const padding = 40; // preview padding
    const availableWidth = containerWidth - padding;

    // Scale virtual viewport to fit available space
    // We only scale down, never up (unless zoomed)
    const fitScale = Math.min(1, availableWidth / viewport.width);

    // Apply zoom on top
    const totalScale = fitScale * (zoom / 100);

    // Min 50% scale for readability, max 150% for zoom
    return Math.max(0.2, totalScale);
  };

  const scale = calculateScale();

  const handlePreviewOnStore = () => {
    if (shopDomain && campaignId) {
      const storeUrl = `https://${shopDomain}?split_pop_preview=${campaignId}`;
      window.open(storeUrl, "_blank");
    }
  };

  if (!templateType) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">Live Preview</Text>
          <div style={{
            minHeight: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f6f6f7",
            borderRadius: "8px"
          }}>
            <BlockStack inlineAlign="center" gap="200">
              <div style={{ fontSize: "48px" }}>📋</div>
              <Text as="p" variant="bodyMd" tone="subdued">Select a template to preview</Text>
            </BlockStack>
          </div>
        </BlockStack>
      </Card>
    );
  }

  return (
    <Card>
      <BlockStack gap="400">
        {/* Header & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <Text as="h3" variant="headingMd">Live Preview</Text>
            <Text as="p" variant="bodySm" tone="subdued">See how your campaign will look</Text>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {shopDomain && campaignId && (
              <Button icon={ViewIcon} onClick={handlePreviewOnStore} size="slim">
                Preview on Store
              </Button>
            )}
          </div>
        </div>

        {/* Device & Zoom Controls */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
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
            <Text as="span" variant="bodySm" tone="subdued">Zoom</Text>
            <div style={{ width: "150px" }}>
              <RangeSlider
                label=""
                value={zoom}
                onChange={(value) => setZoom(Array.isArray(value) ? value[0] : value)}
                min={50}
                max={150}
                output
                suffix={<Text as="span" variant="bodySm">{zoom}%</Text>}
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
                boxShadow: device !== 'desktop' ? "0 20px 50px -12px rgba(0,0,0,0.25)" : "none",
              }}
            >
              <DeviceFrame device={device}>
                <TemplatePreview
                  templateType={templateType}
                  config={config}
                  designConfig={designConfig}
                  onPreviewElementReady={onPreviewElementReady}
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
