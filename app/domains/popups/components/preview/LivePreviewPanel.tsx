/**
 * LivePreviewPanel Component
 *
 * Displays a live preview of the campaign popup as the user configures it.
 * Features device toggle (mobile/desktop) and real-time updates.
 */

import React, { useState } from "react";
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
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">(
    "desktop",
  );
  const [zoom, setZoom] = useState(100);

  const handlePreviewOnStore = () => {
    if (shopDomain && campaignId) {
      // Open store with preview parameter - campaign must be saved (any status is fine)
      const storeUrl = `https://${shopDomain}?split_pop_preview=${campaignId}`;
      window.open(storeUrl, "_blank");
    }
  };

  // Calculate scale factors for realistic device preview
  // Goal: Make devices fit in container while showing relative sizes
  const getDeviceScale = () => {
    if (device === "desktop") {
      // Desktop should fill the container at 100% zoom
      return zoom / 100;
    }

    if (device === "mobile") {
      // Mobile: 375px device width + 24px borders = 399px
      // Height: 667px + 24px borders = 691px
      // At ~85% scale, mobile looks realistic and readable
      return 0.85 * (zoom / 100);
    }

    if (device === "tablet") {
      // Tablet: 768px device width + 24px borders = 792px
      // Height: 800px + 24px borders = 824px
      // Container height: 850px, padding: 40px (20px top + 20px bottom)
      // Available space: 810px
      // At 100% zoom: 824px needs to fit in 810px → scale = 810/824 ≈ 0.98
      // Use 0.95 for some margin
      const containerHeight = 850 - 40; // 810px available
      const tabletHeight = 824; // Total height with borders
      const maxScale = Math.min(0.98, containerHeight / tabletHeight);
      return maxScale * (zoom / 100);
    }

    return zoom / 100;
  };

  // Show placeholder if no template is selected
  if (!templateType) {
    return (
      <div>
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

            {/* Placeholder */}
            <div
              style={{
                backgroundColor: "#F6F6F7",
                borderRadius: "8px",
                minHeight: "500px",
                height: "700px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "40px",
              }}
            >
              <div>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>📋</div>
                <Text as="h3" variant="headingMd">
                  No Template Selected
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Select a template from the Design step to see a live preview
                </Text>
              </div>
            </div>
          </BlockStack>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <BlockStack gap="400">
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* Preview on Store Button */}
              {shopDomain && campaignId && (
                <Button
                  icon={ViewIcon}
                  onClick={handlePreviewOnStore}
                  size="slim"
                >
                  Preview on Store
                </Button>
              )}

              {/* Device Toggle */}
              <ButtonGroup variant="segmented">
                <Button
                  pressed={device === "mobile"}
                  onClick={() => setDevice("mobile")}
                  size="slim"
                >
                  📱 Mobile
                </Button>
                <Button
                  pressed={device === "tablet"}
                  onClick={() => setDevice("tablet")}
                  size="slim"
                >
                  📱 Tablet
                </Button>
                <Button
                  pressed={device === "desktop"}
                  onClick={() => setDevice("desktop")}
                  size="slim"
                >
                  💻 Desktop
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* Zoom Control */}
          <div style={{ paddingTop: "8px" }}>
            <InlineStack gap="400" align="space-between" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">
                Zoom
              </Text>
              <div style={{ width: "200px" }}>
                <RangeSlider
                  label=""
                  value={zoom}
                  onChange={(value) =>
                    setZoom(Array.isArray(value) ? value[0] : value)
                  }
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



          {/* Preview Area */}
          <div
            style={{
              background: device === "desktop"
                ? "#F6F6F7"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Gradient background for mobile/tablet to simulate desk/environment
              borderRadius: "8px",
              padding: device === "desktop"
                ? (zoom === 100 ? "0" : "20px")
                : device === "tablet"
                  ? "20px" // Reduced padding for tablet to fit better
                  : "30px",
              minHeight: "500px",
              height: device === "desktop" ? "700px" : device === "tablet" ? "850px" : "650px",
              display: "flex",
              alignItems: "center", // Always center vertically
              justifyContent: "center", // Always center horizontally
              overflow: "auto", // Allow scrolling if content overflows
              position: "relative",
              // Removed transition to prevent blinking when switching modes
            }}
          >
            <div
              style={{
                transform: `scale(${getDeviceScale()})`,
                transformOrigin: "center center", // Always center for proper scaling
                transition: "transform 0.2s ease", // Only transition transform, not other properties
                width: device === "desktop" && zoom === 100 ? "100%" : "auto",
                maxWidth: device === "desktop" && zoom === 100 ? "100%" : "auto",
                height: device === "desktop" && zoom === 100 ? "100%" : "auto",
                filter: device !== "desktop" ? "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))" : "none", // Add realistic shadow for devices
                display: "flex", // Ensure proper centering
                alignItems: "center",
                justifyContent: "center",
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

          {/* Helper Text */}
          {templateType && (
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              Preview updates automatically as you make changes
            </Text>
          )}
        </BlockStack>
      </Card>
    </div>
  );
};
