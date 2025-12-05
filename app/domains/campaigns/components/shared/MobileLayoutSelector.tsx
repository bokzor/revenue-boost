/**
 * MobileLayoutSelector - Visual layout picker for mobile popup designs
 * Uses phone-frame thumbnails to clearly indicate mobile context
 */

import React from "react";
import { BlockStack, Text } from "@shopify/polaris";

export type MobileLayoutOption = "content-only" | "stacked" | "overlay" | "fullscreen";

export interface MobileLayoutSelectorProps {
  selected: MobileLayoutOption;
  onSelect: (layout: MobileLayoutOption) => void;
  title?: string;
  helpText?: string;
}

interface MobileLayoutConfig {
  id: MobileLayoutOption;
  label: string;
  description: string;
}

const MOBILE_LAYOUTS: MobileLayoutConfig[] = [
  { id: "content-only", label: "Form Only", description: "Clean, fast loading" },
  { id: "stacked", label: "Stacked", description: "Image + form" },
  { id: "overlay", label: "Overlay", description: "Image behind" },
  { id: "fullscreen", label: "Fullscreen", description: "Immersive hero" },
];

const MobileThumbnail: React.FC<{ layout: MobileLayoutOption }> = ({ layout }) => {
  const imageStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const formStyle: React.CSSProperties = {
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: 3,
  };

  const inputStyle: React.CSSProperties = {
    width: "80%",
    height: 3,
    background: "#e5e7eb",
    borderRadius: 1,
  };
  const buttonStyle: React.CSSProperties = {
    width: "60%",
    height: 5,
    background: "#3b82f6",
    borderRadius: 2,
  };
  const headlineStyle: React.CSSProperties = {
    width: "70%",
    height: 3,
    background: "#374151",
    borderRadius: 1,
  };

  const contentStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: 3,
    overflow: "hidden",
  };

  switch (layout) {
    case "content-only":
      return (
        <div style={{ ...contentStyle, ...formStyle, background: "#f9fafb" }}>
          <div style={headlineStyle} />
          <div style={{ ...inputStyle, width: "90%" }} />
          <div style={buttonStyle} />
        </div>
      );
    case "stacked":
      return (
        <div style={contentStyle}>
          <div style={{ ...imageStyle, flex: "0 0 35%" }}>
            <span style={{ fontSize: 8, color: "white" }}>📷</span>
          </div>
          <div style={{ ...formStyle, flex: "0 0 65%" }}>
            <div style={headlineStyle} />
            <div style={inputStyle} />
            <div style={buttonStyle} />
          </div>
        </div>
      );
    case "overlay":
      return (
        <div style={{ ...contentStyle, position: "relative" }}>
          {/* Half purple - image only covers top half */}
          <div style={{ ...imageStyle, position: "absolute", top: 0, left: 0, right: 0, height: "50%" }}>
            <span style={{ fontSize: 8, color: "white" }}>📷</span>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.95) 50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 6,
              gap: 2,
            }}
          >
            <div style={{ ...headlineStyle, background: "#374151" }} />
            <div style={{ ...inputStyle, background: "#e5e7eb" }} />
            <div style={buttonStyle} />
          </div>
        </div>
      );
    case "fullscreen":
      return (
        <div style={{ ...contentStyle, position: "relative" }}>
          {/* Fully purple - image covers entire screen */}
          <div style={{ ...imageStyle, position: "absolute", inset: 0 }}>
            <span style={{ fontSize: 8, color: "white" }}>📷</span>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 6,
              gap: 2,
            }}
          >
            <div style={{ ...headlineStyle, background: "#fff" }} />
            <div style={{ ...inputStyle, background: "rgba(255,255,255,0.9)" }} />
            <div style={buttonStyle} />
          </div>
        </div>
      );
  }
};

export const MobileLayoutSelector: React.FC<MobileLayoutSelectorProps> = ({
  selected,
  onSelect,
  title = "Mobile Layout",
  helpText,
}) => {
  return (
    <BlockStack gap="300">
      <BlockStack gap="100">
        <Text as="h3" variant="headingSm">
          {title}
        </Text>
        {helpText && (
          <Text as="p" tone="subdued" variant="bodySm">
            {helpText}
          </Text>
        )}
      </BlockStack>

      <div style={{ display: "flex", gap: 16, justifyContent: "flex-start" }}>
        {MOBILE_LAYOUTS.map((layout) => {
          const isSelected = selected === layout.id;
          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => onSelect(layout.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {/* Phone Frame */}
              <div
                style={{
                  width: 48,
                  height: 80,
                  borderRadius: 8,
                  border: isSelected ? "2px solid #2563eb" : "2px solid #d1d5db",
                  boxShadow: isSelected
                    ? "0 0 0 2px rgba(37, 99, 235, 0.2)"
                    : "0 1px 3px rgba(0,0,0,0.1)",
                  background: "#1f2937",
                  padding: "6px 3px 8px 3px",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {/* Notch */}
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 16,
                    height: 3,
                    background: "#374151",
                    borderRadius: 2,
                  }}
                />
                {/* Screen */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 4,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <MobileThumbnail layout={layout.id} />
                </div>
              </div>
              {/* Label */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? "#2563eb" : "#374151",
                  }}
                >
                  {layout.label}
                </div>
                <div style={{ fontSize: 9, color: "#6b7280", marginTop: 1 }}>
                  {layout.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </BlockStack>
  );
};
