/**
 * LayoutSelector - Visual layout picker for popup designs
 *
 * Shows visual diagrams of each layout option:
 * - split-left: Image left, form right (stacks on mobile)
 * - split-right: Image right, form left (stacks on mobile)
 * - hero: Image top, form bottom
 * - full: Full background image with overlay
 * - minimal: No image, clean form only
 */

import React from "react";
import { BlockStack, Text } from "@shopify/polaris";

export type LayoutOption = "split-left" | "split-right" | "hero" | "full" | "minimal";

export interface LayoutSelectorProps {
  selected: LayoutOption;
  onSelect: (layout: LayoutOption) => void;
  title?: string;
  helpText?: string;
}

interface LayoutConfig {
  id: LayoutOption;
  label: string;
  description: string;
}

const LAYOUTS: LayoutConfig[] = [
  { id: "split-left", label: "Split Left", description: "Image left, form right" },
  { id: "split-right", label: "Split Right", description: "Image right, form left" },
  { id: "hero", label: "Hero", description: "Image top, form below" },
  { id: "full", label: "Full Background", description: "Image covers popup" },
  { id: "minimal", label: "Minimal", description: "No image, clean form" },
];

const LayoutThumbnail: React.FC<{ layout: LayoutOption }> = ({ layout }) => {
  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    borderRadius: 4,
    overflow: "hidden",
  };

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
    gap: 3,
    padding: 4,
  };

  const inputStyle: React.CSSProperties = {
    width: "80%",
    height: 4,
    background: "#e5e7eb",
    borderRadius: 2,
  };

  const buttonStyle: React.CSSProperties = {
    width: "60%",
    height: 6,
    background: "#3b82f6",
    borderRadius: 2,
  };

  const headlineStyle: React.CSSProperties = {
    width: "70%",
    height: 4,
    background: "#374151",
    borderRadius: 2,
  };

  switch (layout) {
    case "split-left":
      return (
        <div style={{ ...baseStyle, flexDirection: "row" }}>
          <div style={{ ...imageStyle, flex: "0 0 45%" }}>
            <span style={{ fontSize: 10, color: "white" }}>📷</span>
          </div>
          <div style={{ ...formStyle, flex: "0 0 55%" }}>
            <div style={headlineStyle} />
            <div style={inputStyle} />
            <div style={buttonStyle} />
          </div>
        </div>
      );

    case "split-right":
      return (
        <div style={{ ...baseStyle, flexDirection: "row" }}>
          <div style={{ ...formStyle, flex: "0 0 55%" }}>
            <div style={headlineStyle} />
            <div style={inputStyle} />
            <div style={buttonStyle} />
          </div>
          <div style={{ ...imageStyle, flex: "0 0 45%" }}>
            <span style={{ fontSize: 10, color: "white" }}>📷</span>
          </div>
        </div>
      );

    case "hero":
      return (
        <div style={{ ...baseStyle, flexDirection: "column" }}>
          <div style={{ ...imageStyle, flex: "0 0 40%" }}>
            <span style={{ fontSize: 10, color: "white" }}>📷</span>
          </div>
          <div style={{ ...formStyle, flex: "0 0 60%" }}>
            <div style={headlineStyle} />
            <div style={inputStyle} />
            <div style={buttonStyle} />
          </div>
        </div>
      );

    case "full":
      return (
        <div style={{ ...baseStyle, position: "relative" }}>
          <div style={{ ...imageStyle, position: "absolute", inset: 0 }}>
            <span style={{ fontSize: 10, color: "white" }}>📷</span>
          </div>
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}>
            <div style={{ ...headlineStyle, background: "#fff" }} />
            <div style={{ ...inputStyle, background: "rgba(255,255,255,0.8)" }} />
            <div style={buttonStyle} />
          </div>
        </div>
      );

    case "minimal":
      return (
        <div style={{ ...baseStyle, ...formStyle, background: "#f9fafb" }}>
          <div style={headlineStyle} />
          <div style={{ ...inputStyle, width: "90%" }} />
          <div style={buttonStyle} />
        </div>
      );
  }
};

export const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  selected,
  onSelect,
  title = "Layout",
  helpText,
}) => {
  return (
    <BlockStack gap="300">
      <BlockStack gap="100">
        <Text as="h3" variant="headingSm">{title}</Text>
        {helpText && <Text as="p" tone="subdued" variant="bodySm">{helpText}</Text>}
      </BlockStack>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 12,
        }}
      >
        {LAYOUTS.map((layout) => {
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
                gap: 8,
                padding: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  width: 100,
                  height: 70,
                  borderRadius: 8,
                  border: isSelected ? "2px solid #2563eb" : "2px solid #e5e7eb",
                  boxShadow: isSelected
                    ? "0 0 0 2px rgba(37, 99, 235, 0.2)"
                    : "0 1px 3px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                  padding: 4,
                  background: "#f3f4f6",
                }}
              >
                <LayoutThumbnail layout={layout.id} />
              </div>

              {/* Label */}
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? "#2563eb" : "#374151",
                  }}
                >
                  {layout.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
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

