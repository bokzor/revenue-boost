import React from "react";
import { InlineStack, Text } from "@shopify/polaris";

export interface BrowserChromeProps {
  children: React.ReactNode;
  url?: string;
  showControls?: boolean;
}

/**
 * BrowserChrome component wraps preview content in a realistic browser window frame
 * with address bar and window controls for better context.
 */
export const BrowserChrome: React.FC<BrowserChromeProps> = ({
  children,
  url = "https://your-store.myshopify.com",
  showControls = true,
}) => {
  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Browser Header */}
      {showControls && (
        <div
          style={{
            backgroundColor: "#f6f6f7",
            borderBottom: "1px solid #e1e3e5",
            padding: "8px 12px",
          }}
        >
          <InlineStack gap="200" blockAlign="center">
            {/* Window Controls (macOS style) */}
            <InlineStack gap="100">
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#ff5f57",
                }}
              />
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#ffbd2e",
                }}
              />
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#28ca42",
                }}
              />
            </InlineStack>

            {/* Address Bar */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#fff",
                border: "1px solid #e1e3e5",
                borderRadius: "4px",
                padding: "4px 12px",
                marginLeft: "12px",
              }}
            >
              <Text as="span" variant="bodySm" tone="subdued">
                🔒 {url}
              </Text>
            </div>
          </InlineStack>
        </div>
      )}

      {/* Browser Content */}
      <div
        style={{
          backgroundColor: "#fff",
          minHeight: "400px",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BrowserChrome;
