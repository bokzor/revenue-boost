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

  // Calculate scale factors to fit mobile/tablet in container without scrollbars
  const getDeviceScale = () => {
    if (device === "desktop") return zoom / 100;

    const containerHeight = 600 - 40; // Container height minus padding (20px top + 20px bottom)

    if (device === "mobile") {
      const mobileHeight = 667 + 24; // Device height (667px) + borders (12px * 2)
      const maxScale = Math.min(0.8, (containerHeight - 20) / mobileHeight); // Leave some margin
      return maxScale * (zoom / 100);
    }

    if (device === "tablet") {
      const tabletHeight = 1024 + 24; // Device height (1024px) + borders (12px * 2)
      const maxScale = Math.min(0.5, (containerHeight - 20) / tabletHeight); // Leave some margin
      return maxScale * (zoom / 100);
    }

    return zoom / 100;
  };

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
              backgroundColor: "#F6F6F7",
              borderRadius: "8px",
              padding:
                device === "desktop" ? (zoom === 100 ? "0" : "20px") : "20px",
              minHeight: "500px",
              height: device === "desktop" ? "700px" : "600px", // More height for mobile/tablet
              display: "flex",
              alignItems: device === "desktop" ? "center" : "flex-start", // Top align for mobile/tablet
              justifyContent: "center",
              overflow: "hidden", // Always hidden to prevent scrollbars
              position: "relative",
              transition: "opacity 0.2s ease, padding 0.2s ease",
            }}
          >
            <div
              style={{
                transform: `scale(${getDeviceScale()})`,
                transformOrigin:
                  device === "desktop"
                    ? zoom === 100
                      ? "center center"
                      : "top center"
                    : "top center", // Top center for mobile/tablet like desktop
                transition: "transform 0.2s ease",
                width: device === "desktop" && zoom === 100 ? "100%" : "auto",
                maxWidth:
                  device === "desktop" && zoom === 100 ? "100%" : "auto",
                height: device === "desktop" && zoom === 100 ? "100%" : "auto",
                paddingTop: device !== "desktop" ? "10px" : "0", // Small top padding for mobile/tablet
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
