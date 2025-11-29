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

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Card,
  BlockStack,
  Text,
  ButtonGroup,
  Button,
  RangeSlider,
  InlineStack,
  Popover,
  ActionList,
} from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import { DeviceFrame } from "./DeviceFrame";
import { TemplatePreview } from "./TemplatePreview";

export interface LivePreviewPanelProps {
  templateType?: string;
  config: Record<string, any>;
  designConfig: Record<string, any>;
  targetRules?: Record<string, any>;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
  shopDomain?: string;
  campaignId?: string;
  globalCustomCSS?: string;
}

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  templateType,
  config,
  designConfig,
  targetRules,
  onPreviewElementReady,
  shopDomain,
  campaignId,
  globalCustomCSS,
}) => {
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("tablet");
  const [zoom, setZoom] = useState(100);

  // ✅ KEY: Virtual viewport sizes - independent of physical container
  // These dimensions trigger the correct layout modes in the popups.
  // Desktop uses a wider logical viewport so overlays (like upsell bars)
  // don't appear to span the *entire* browser width in preview.
  // Mobile uses iPhone 14/15 dimensions (390×844) - more representative of modern phones.
  const virtualViewports = {
    mobile: { width: 390, height: 844 },
    tablet: { width: 768, height: 800 },
    desktop: { width: 1024, height: 600 },
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

  const [isCreatingPreview, setIsCreatingPreview] = useState(false);
  const [previewPopoverActive, setPreviewPopoverActive] = useState(false);

  const togglePreviewPopover = useCallback(() => setPreviewPopoverActive((active) => !active), []);

  const handlePreviewOnStore = async (behavior: "instant" | "realistic" = "instant") => {
    setPreviewPopoverActive(false); // Close popover when action is triggered
    if (!shopDomain) {
      console.error("Shop domain is required for preview");
      return;
    }

    setIsCreatingPreview(true);

    try {
      // Always use token-based preview sessions for consistency (saved and unsaved)
      const previewData = {
        name: config.name || "Preview Campaign",
        templateType,
        contentConfig: config,
        designConfig,
        targetRules: targetRules || {},
        priority: 0,
        discountConfig: config.discountConfig || {},
        // Optional: reference to the underlying saved campaign, if any
        sourceCampaignId: campaignId,
      };

      // Create preview session
      const response = await fetch("/api/preview/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(previewData),
      });

      if (!response.ok) {
        throw new Error("Failed to create preview session");
      }

      const result = await response.json();

      if (!result.success || !result.token) {
        throw new Error("Invalid preview session response");
      }

      // Open storefront with preview token and behavior mode
      const storeUrl = `https://${shopDomain}?split_pop_preview_token=${result.token}&preview_behavior=${behavior}`;
      window.open(storeUrl, "_blank");
    } catch (error) {
      console.error("Failed to create preview:", error);
      alert("Failed to create preview. Please try again.");
    } finally {
      setIsCreatingPreview(false);
    }
  };

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
        {/* Header & Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <Text as="h3" variant="headingMd">
              Live Preview
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              See how your campaign will look
            </Text>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {shopDomain && (
              <Popover
                active={previewPopoverActive}
                activator={
                  <Button
                    icon={ViewIcon}
                    disclosure="down"
                    onClick={togglePreviewPopover}
                    size="slim"
                    loading={isCreatingPreview}
                    disabled={isCreatingPreview}
                  >
                    Preview on Store
                  </Button>
                }
                autofocusTarget="first-node"
                onClose={togglePreviewPopover}
              >
                <ActionList
                  actionRole="menuitem"
                  items={[
                    {
                      content: "Quick Preview",
                      helpText: "Shows popup immediately, bypassing triggers",
                      onAction: () => handlePreviewOnStore("instant"),
                    },
                    {
                      content: "Test with Triggers",
                      helpText: "Evaluates triggers as configured (delays, scroll, etc.)",
                      onAction: () => handlePreviewOnStore("realistic"),
                    },
                  ]}
                />
              </Popover>
            )}
          </div>
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
