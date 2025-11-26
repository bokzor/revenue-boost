import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Box, Button, Text, InlineStack } from "@shopify/polaris";
import type { PopupDesignConfig } from "./PopupDesignEditor";

export interface PopupPreviewProps {
  config: PopupDesignConfig;
  showControls?: boolean;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
  autoShow?: boolean;
}

export interface PopupPreviewRef {
  triggerPreview: () => void;
}

export const PopupPreview = forwardRef<PopupPreviewRef, PopupPreviewProps>(
  ({ config, showControls = true, onPreviewElementReady, autoShow = false }, ref) => {
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const popupElementRef = useRef<HTMLDivElement>(null);

    // Always use desktop mode since device toggle is removed
    const previewMode = "desktop";

    // Expose triggerPreview method to parent component
    useImperativeHandle(
      ref,
      () => ({
        triggerPreview: () => {
          setIsPreviewVisible(true);
        },
      }),
      []
    );

    // Auto-show popup when autoShow prop is true
    useEffect(() => {
      if (autoShow) {
        setIsPreviewVisible(true);
      }
    }, [autoShow]);

    // Notify parent when popup element is ready for animations
    useEffect(() => {
      if (onPreviewElementReady && popupElementRef.current && isPreviewVisible) {
        onPreviewElementReady(popupElementRef.current);
      } else if (onPreviewElementReady && !isPreviewVisible) {
        onPreviewElementReady(null);
      }
    }, [onPreviewElementReady, isPreviewVisible]);

    const getPopupStyles = (): React.CSSProperties => {
      const baseStyles: React.CSSProperties = {
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        borderRadius: config.borderRadius || "12px",
        boxShadow: config.boxShadow || "0 8px 32px rgba(0, 0, 0, 0.12)",
        fontFamily: config.fontFamily || "system-ui, -apple-system, sans-serif",
        fontSize: config.fontSize || "14px",
        fontWeight: config.fontWeight || "normal",
        padding: config.padding || "32px",
        position: "relative",
        maxWidth: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      };

      // Use modal-style sizing universally (popupType removed)
      const sizeMap = {
        small: { width: "300px", minHeight: "200px" },
        medium: { width: "400px", minHeight: "280px" },
        large: { width: "500px", minHeight: "350px" },
      };
      const size = sizeMap[config.size || "medium"];
      return {
        ...baseStyles,
        ...size,
        maxHeight: "80vh",
      };
    };

    const getButtonStyles = (): React.CSSProperties => {
      return {
        backgroundColor: config.buttonColor || "#007BFF",
        color: config.buttonTextColor || "#FFFFFF",
        border: "none",
        borderRadius: "6px",
        padding: "14px 28px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
        minWidth: "140px",
        alignSelf: "flex-start",
      };
    };

    const getCloseButtonStyles = (): React.CSSProperties => {
      return {
        position: "absolute",
        top: "12px",
        right: "12px",
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
        color: config.textColor,
        opacity: 0.7,
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        transition: "all 0.2s ease",
      };
    };

    const getContainerStyles = (): React.CSSProperties => {
      const isMobile = previewMode !== "desktop";
      return {
        width: "100%",
        maxWidth: isMobile ? "375px" : "none",
        height: isMobile ? "667px" : "600px",
        border: "1px solid #E1E3E5",
        borderRadius: "8px",
        position: "relative",
        // Allow vertical scrolling inside the preview frame so long popups
        // and content can be inspected, while keeping horizontal overflow hidden.
        overflowX: "hidden",
        overflowY: "auto",
        backgroundColor: "#F6F6F7",
        backgroundImage: `
        linear-gradient(45deg, #F0F0F0 25%, transparent 25%),
        linear-gradient(-45deg, #F0F0F0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #F0F0F0 75%),
        linear-gradient(-45deg, transparent 75%, #F0F0F0 75%)
      `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        margin: isMobile ? "0 auto" : "0",
      };
    };

    const getOverlayStyles = (): React.CSSProperties => {
      const baseStyles: React.CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: `rgba(0, 0, 0, ${config.overlayOpacity || 0.6})`,
        display: "flex",
        zIndex: 1000,
      };

      // Alignment based on position (popupType removed)
      const alignMap: Record<string, string> = {
        top: "flex-start",
        bottom: "flex-end",
        center: "center",
        left: "center",
        right: "center",
      };
      const justifyMap: Record<string, string> = {
        left: "flex-start",
        right: "flex-end",
        center: "center",
        top: "center",
        bottom: "center",
      };
      const position = config.position || "center";
      return {
        ...baseStyles,
        alignItems: alignMap[position] || "center",
        justifyContent: justifyMap[position] || "center",
      };
    };

    const renderPopupContent = () => {
      const popupId = `popup-preview-${config.id}`;

      return (
        <>
          {/* Inject custom CSS into document head with scoped selectors */}
          {config.customCSS && (
            <style
              dangerouslySetInnerHTML={{
                __html: `
              /* Custom CSS scoped to this popup preview */
              #${popupId} {
                ${config.customCSS}
              }
              /* Also allow targeting child elements */
              ${config.customCSS.includes("{") ? config.customCSS : ""}
            `,
              }}
            />
          )}

          <div id={popupId} ref={popupElementRef} data-popup-preview style={getPopupStyles()}>
            {config.showCloseButton && <button style={getCloseButtonStyles()}>×</button>}

            {config.position === "top" || config.position === "bottom" ? (
              // Banner layout: horizontal
              <>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {config.imageUrl && (
                    <img
                      src={config.imageUrl}
                      alt={config.headline || "Popup"}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "6px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "18px",
                        fontWeight: "700",
                        color: config.textColor,
                        lineHeight: "1.3",
                      }}
                    >
                      {config.headline}
                    </h3>
                    {config.subheadline && (
                      <p
                        style={{
                          margin: 0,
                          lineHeight: "1.4",
                          color: config.textColor,
                          opacity: 0.85,
                          fontSize: "14px",
                        }}
                      >
                        {config.subheadline}
                      </p>
                    )}
                  </div>
                </div>
                <button style={getButtonStyles()}>{config.buttonText}</button>
              </>
            ) : (
              // Modal/Slide-in layout: vertical
              <>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  {config.imageUrl && (
                    <div style={{ marginBottom: "20px", textAlign: "center" }}>
                      <img
                        src={config.imageUrl}
                        alt={config.headline || "Popup"}
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                          borderRadius: "6px",
                          maxHeight: "120px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <h3
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "22px",
                      fontWeight: "700",
                      color: config.textColor,
                      paddingRight: config.showCloseButton ? "30px" : "0",
                      lineHeight: "1.3",
                      textAlign: "left",
                    }}
                  >
                    {config.headline}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 24px 0",
                      lineHeight: "1.6",
                      color: config.textColor,
                      opacity: 0.85,
                      fontSize: "15px",
                      textAlign: "left",
                      flex: 1,
                    }}
                  >
                    {config.subheadline}
                  </p>
                </div>

                {/* Button area */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    marginTop: "8px",
                    paddingTop: "16px",
                    borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <button style={getButtonStyles()}>{config.buttonText}</button>
                </div>
              </>
            )}
          </div>
        </>
      );
    };

    return (
      <Box>
        {showControls && (
          <Box paddingBlockEnd="400">
            <InlineStack align="end">
              <Button variant="primary" onClick={() => setIsPreviewVisible(!isPreviewVisible)}>
                {isPreviewVisible ? "Hide Preview" : "Show Preview"}
              </Button>
            </InlineStack>
          </Box>
        )}

        <Box>
          <div style={getContainerStyles()}>
            {/* Simulated website content */}
            <div
              style={{
                padding: previewMode !== "desktop" ? "16px" : "24px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  width: "100%",
                  maxWidth: previewMode !== "desktop" ? "100%" : "90%",
                  boxSizing: "border-box",
                }}
              >
                <h1
                  style={{
                    margin: "0 0 16px 0",
                    color: "#333",
                    fontSize: previewMode !== "desktop" ? "24px" : "32px",
                  }}
                >
                  Your Store
                </h1>
                <p
                  style={{
                    margin: "0 0 24px 0",
                    color: "#666",
                    fontSize: previewMode !== "desktop" ? "14px" : "16px",
                  }}
                >
                  This is a preview of how your popup will appear on your website.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      previewMode !== "desktop"
                        ? "repeat(2, 1fr)"
                        : "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: previewMode !== "desktop" ? "12px" : "16px",
                    marginTop: "24px",
                  }}
                >
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: "#F8F9FA",
                        padding: previewMode !== "desktop" ? "12px" : "16px",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: previewMode !== "desktop" ? "60px" : "80px",
                          backgroundColor: "#E9ECEF",
                          borderRadius: "4px",
                          marginBottom: "8px",
                        }}
                      />
                      <div
                        style={{
                          fontSize: previewMode !== "desktop" ? "11px" : "12px",
                          color: "#666",
                        }}
                      >
                        Product {i}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popup overlay */}
            {isPreviewVisible && <div style={getOverlayStyles()}>{renderPopupContent()}</div>}
          </div>
        </Box>

        <Box paddingBlockStart="400">
          <Text as="p" variant="bodySm" tone="subdued">
            Preview shows how your popup will appear to customers. The actual popup will be
            responsive and adapt to different screen sizes.
          </Text>
        </Box>
      </Box>
    );
  }
);

PopupPreview.displayName = "PopupPreview";
