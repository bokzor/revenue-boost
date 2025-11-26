/**
 * Real-Time Preview Panel - Live preview with device toggle
 *
 * Based on research from docs/ui-analysis/:
 * - Discovery #23: "Real-time preview panel shows live updates"
 * - Discovery #42: "Preview uses actual product data, not placeholders"
 * - Discovery #57: "Device toggle (Desktop/Mobile/Tablet)"
 * - Discovery #66: "Preview updates as configuration changes"
 *
 * Features:
 * - Live updates (debounced 300ms)
 * - Device toggle (Desktop/Mobile/Tablet)
 * - Actual product data
 * - Interactive elements
 * - Simulated website background
 * - Animation replay
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  ButtonGroup,
  Box,
  Tooltip,
} from "@shopify/polaris";
import { DesktopIcon, MobileIcon, TabletIcon, PlayIcon, RefreshIcon } from "@shopify/polaris-icons";
import {
  PopupPreview,
  type PopupPreviewRef,
} from "~/domains/popups/components/design/PopupPreview";
import type { PopupDesignConfig } from "~/domains/popups/components/design/PopupDesignEditor";
import styles from "./RealTimePreviewPanel.module.css";

export type DeviceType = "desktop" | "tablet" | "mobile";

export interface DeviceConfig {
  id: DeviceType;
  name: string;
  width: number;
  height: number;
  icon: typeof DesktopIcon;
}

const DEVICES: DeviceConfig[] = [
  {
    id: "desktop",
    name: "Desktop",
    width: 1200,
    height: 800,
    icon: DesktopIcon,
  },
  { id: "tablet", name: "Tablet", width: 768, height: 1024, icon: TabletIcon },
  { id: "mobile", name: "Mobile", width: 375, height: 667, icon: MobileIcon },
];

export interface RealTimePreviewPanelProps {
  /**
   * Popup design configuration
   */
  config: PopupDesignConfig;

  /**
   * Whether to show device toggle
   */
  showDeviceToggle?: boolean;

  /**
   * Whether to show animation controls
   */
  showAnimationControls?: boolean;

  /**
   * Whether to show refresh button
   */
  showRefreshButton?: boolean;

  /**
   * Callback when config changes (for interactive preview)
   */
  onConfigChange?: (config: Partial<PopupDesignConfig>) => void;

  /**
   * Initial device type
   */
  initialDevice?: DeviceType;

  /**
   * Whether preview is sticky (fixed position)
   */
  sticky?: boolean;
}

export function RealTimePreviewPanel({
  config,
  showDeviceToggle = true,
  showAnimationControls = true,
  showRefreshButton = true,
  initialDevice = "desktop",
  sticky = false,
}: RealTimePreviewPanelProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(
    DEVICES.find((d) => d.id === initialDevice) || DEVICES[0]
  );
  const [previewKey, setPreviewKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [debouncedConfig, setDebouncedConfig] = useState(config);
  const previewRef = useRef<PopupPreviewRef>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Debounce config updates (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedConfig(config);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [config]);

  const handleDeviceChange = useCallback((device: DeviceConfig) => {
    setSelectedDevice(device);
    setPreviewKey((prev) => prev + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    setPreviewKey((prev) => prev + 1);
  }, []);

  const handleReplayAnimation = useCallback(() => {
    setIsAnimating(true);
    previewRef.current?.triggerPreview();

    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  }, []);

  const getPreviewScale = () => {
    // For desktop, use 100% width (no scaling)
    if (selectedDevice.id === "desktop") {
      return 1;
    }
    // Scale down mobile/tablet to fit nicely
    const maxWidth = 600;
    if (selectedDevice.width > maxWidth) {
      return maxWidth / selectedDevice.width;
    }
    return 1;
  };

  const getPreviewStyles = (): React.CSSProperties => {
    const scale = getPreviewScale();
    const isDesktop = selectedDevice.id === "desktop";

    return {
      width: isDesktop ? "100%" : selectedDevice.width,
      height: selectedDevice.height,
      maxHeight: "70vh",
      border: "1px solid var(--p-color-border)",
      borderRadius: "var(--p-border-radius-300)",
      overflow: "hidden",
      backgroundColor: "#F6F6F7",
      position: "relative",
      transform: isDesktop ? "none" : `scale(${scale})`,
      transformOrigin: "top center",
      margin: "0 auto",
    };
  };

  return (
    <div className={`${styles.previewPanel} ${sticky ? styles.sticky : ""}`}>
      <Card>
        <BlockStack gap="400">
          {/* Header */}
          <Box>
            <InlineStack align="space-between" blockAlign="center">
              <div>
                <Text as="h3" variant="headingMd">
                  Live Preview
                </Text>
                <Box paddingBlockStart="100">
                  <Text as="p" variant="bodySm" tone="subdued">
                    See your changes in real-time
                  </Text>
                </Box>
              </div>

              {showRefreshButton && (
                <Tooltip content="Refresh preview">
                  <Button
                    icon={RefreshIcon}
                    onClick={handleRefresh}
                    variant="plain"
                    accessibilityLabel="Refresh preview"
                  />
                </Tooltip>
              )}
            </InlineStack>
          </Box>

          {/* Device Toggle */}
          {showDeviceToggle && (
            <Box>
              <InlineStack gap="200" align="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Device:
                </Text>
                <ButtonGroup variant="segmented">
                  {DEVICES.map((device) => (
                    <Tooltip key={device.id} content={device.name}>
                      <Button
                        pressed={selectedDevice.id === device.id}
                        onClick={() => handleDeviceChange(device)}
                        icon={device.icon}
                        accessibilityLabel={device.name}
                      />
                    </Tooltip>
                  ))}
                </ButtonGroup>
                <Text as="span" variant="bodySm" tone="subdued">
                  {selectedDevice.width} × {selectedDevice.height}px
                </Text>
              </InlineStack>
            </Box>
          )}

          {/* Animation Controls */}
          {showAnimationControls && (
            <Box>
              <InlineStack gap="200" align="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Animation:
                </Text>
                <Button
                  icon={PlayIcon}
                  onClick={handleReplayAnimation}
                  loading={isAnimating}
                  disabled={isAnimating}
                  size="slim"
                >
                  Replay
                </Button>
              </InlineStack>
            </Box>
          )}

          {/* Preview Container */}
          <Box>
            <div className={styles.previewContainer}>
              <div className={styles.previewFrame} style={getPreviewStyles()}>
                {/* Simulated Website Background */}
                <div className={styles.websiteBackground}>
                  <div className={styles.websiteHeader}>
                    <div className={styles.websiteLogo}></div>
                    <div className={styles.websiteNav}>
                      <div className={styles.websiteNavItem}></div>
                      <div className={styles.websiteNavItem}></div>
                      <div className={styles.websiteNavItem}></div>
                    </div>
                  </div>
                  <div className={styles.websiteContent}>
                    <div className={styles.websiteContentBlock}></div>
                    <div className={styles.websiteContentBlock}></div>
                  </div>
                </div>

                {/* Popup Preview */}
                <PopupPreview
                  key={previewKey}
                  ref={previewRef}
                  config={debouncedConfig}
                  showControls={false}
                  autoShow={true}
                />
              </div>
            </div>
          </Box>

          {/* Preview Info */}
          <Box>
            <Text as="p" variant="bodyXs" tone="subdued" alignment="center">
              Preview updates automatically as you make changes
            </Text>
          </Box>
        </BlockStack>
      </Card>
    </div>
  );
}
