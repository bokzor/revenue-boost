/**
 * CampaignPopupPreview Component
 *
 * Renders a visual preview of a campaign's popup on the detail page.
 * Uses the TemplatePreview component with proper scaling and device framing.
 */

import React, { useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import { Box, Text, BlockStack, Button, InlineStack, Tooltip } from "@shopify/polaris";
import { RefreshIcon, DesktopIcon, MobileIcon } from "@shopify/polaris-icons";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { DeviceFrame } from "~/domains/popups/components/preview/DeviceFrame";
import { ShadowDomWrapper } from "./recipes/ShadowDomWrapper";
import type { CampaignWithConfigs, TemplateType } from "~/domains/campaigns/types/campaign";
import type { DesignTokens } from "~/domains/campaigns/types/design-tokens";

// iPhone 14 dimensions (used by DeviceFrame for mobile)
const IPHONE_14_WIDTH = 390;
const IPHONE_14_HEIGHT = 844;
const DEVICE_FRAME_BORDER = 24;

// Desktop browser dimensions
const BROWSER_WIDTH = 1280;
const BROWSER_HEIGHT = 800;
const BROWSER_CHROME_HEIGHT = 40;

// How long to wait before the popup reappears after closing
const REAPPEAR_DELAY_MS = 1500;

export interface CampaignPopupPreviewProps {
  campaign: CampaignWithConfigs;
  /** Fixed height for the preview container */
  height?: number;
  /** Show device toggle buttons */
  showDeviceToggle?: boolean;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Default theme tokens for preview (from store's default preset or Shopify theme) */
  defaultThemeTokens?: DesignTokens;
}

export function CampaignPopupPreview({
  campaign,
  height = 400,
  showDeviceToggle = true,
  showRefresh = true,
  defaultThemeTokens,
}: CampaignPopupPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [isPopupVisible, setIsPopupVisible] = useState(true);
  const [remountKey, setRemountKey] = useState(0);

  // Handle close: trigger exit animation, then schedule reappear
  const handleClose = useCallback(() => {
    setIsPopupVisible(false);
    setTimeout(() => {
      setRemountKey(k => k + 1);
      setIsPopupVisible(true);
    }, REAPPEAR_DELAY_MS);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRemountKey(k => k + 1);
    setIsPopupVisible(true);
  }, []);

  // Measure container width
  useLayoutEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate virtual viewport dimensions based on device
  const virtualDimensions = useMemo(() => {
    if (device === "mobile") {
      return {
        width: IPHONE_14_WIDTH + DEVICE_FRAME_BORDER,
        height: IPHONE_14_HEIGHT + DEVICE_FRAME_BORDER,
      };
    }
    return {
      width: BROWSER_WIDTH,
      height: BROWSER_HEIGHT + BROWSER_CHROME_HEIGHT,
    };
  }, [device]);

  // Calculate scale to fit container
  const scale = useMemo(() => {
    if (containerWidth === 0) return 0.4;
    const padding = 0.95;
    const scaleX = (containerWidth * padding) / virtualDimensions.width;
    const scaleY = (height * padding) / virtualDimensions.height;
    return Math.min(scaleX, scaleY);
  }, [containerWidth, height, virtualDimensions]);

  // Build content and design config from campaign
  const contentConfig = useMemo(() => ({
    ...campaign.contentConfig,
    discountConfig: campaign.discountConfig,
    previewMode: true,
  }), [campaign.contentConfig, campaign.discountConfig]);

  const designConfig = useMemo(() => ({
    ...campaign.designConfig,
    previewMode: true,
    disablePortal: true,
  }), [campaign.designConfig]);

  const scaledWidth = virtualDimensions.width * scale;
  const scaledHeight = virtualDimensions.height * scale;

  return (
    <BlockStack gap="300">
      {/* Controls */}
      {(showDeviceToggle || showRefresh) && (
        <InlineStack align="space-between" blockAlign="center">
          <Text as="span" variant="bodySm" tone="subdued">
            Live Preview
          </Text>
          <InlineStack gap="200">
            {showDeviceToggle && (
              <>
                <Tooltip content="Mobile view">
                  <Button
                    icon={MobileIcon}
                    variant={device === "mobile" ? "primary" : "tertiary"}
                    size="slim"
                    onClick={() => setDevice("mobile")}
                    accessibilityLabel="Mobile preview"
                  />
                </Tooltip>
                <Tooltip content="Desktop view">
                  <Button
                    icon={DesktopIcon}
                    variant={device === "desktop" ? "primary" : "tertiary"}
                    size="slim"
                    onClick={() => setDevice("desktop")}
                    accessibilityLabel="Desktop preview"
                  />
                </Tooltip>
              </>
            )}
            {showRefresh && (
              <Tooltip content="Refresh preview">
                <Button
                  icon={RefreshIcon}
                  variant="tertiary"
                  size="slim"
                  onClick={handleRefresh}
                  accessibilityLabel="Refresh preview"
                />
              </Tooltip>
            )}
          </InlineStack>
        </InlineStack>
      )}

      {/* Preview Container */}
      <Box
        background="bg-surface-secondary"
        borderRadius="300"
        padding="400"
        minHeight={`${height}px`}
      >
        <div
          ref={containerRef}
          style={{
            height: `${height - 32}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <ShadowDomWrapper
            style={{
              width: "auto",
              height: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Outer clip container */}
            <div
              style={{
                width: scaledWidth,
                height: scaledHeight,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Inner viewport - renders at full size then scales */}
              <div
                style={{
                  width: virtualDimensions.width,
                  height: virtualDimensions.height,
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  transformOrigin: "center center",
                  containerType: "inline-size",
                  containerName: "popup-viewport",
                } as React.CSSProperties}
              >
                <DeviceFrame device={device} showShadow={false}>
                  <TemplatePreview
                    key={remountKey}
                    templateType={campaign.templateType as TemplateType}
                    config={contentConfig}
                    designConfig={designConfig}
                    onClose={handleClose}
                    isVisible={isPopupVisible}
                    defaultThemeTokens={defaultThemeTokens}
                  />
                </DeviceFrame>
              </div>
            </div>
          </ShadowDomWrapper>
        </div>
      </Box>
    </BlockStack>
  );
}

