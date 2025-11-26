import React from "react";
import {
  Text,
  Box,
  TextField,
  Select,
  RangeSlider,
  ButtonGroup,
  Button,
  FormLayout,
} from "@shopify/polaris";
import type { PopupDesignConfig } from "./PopupDesignEditor";

export interface StyleCustomizationPanelProps {
  config: PopupDesignConfig;
  onStyleChange: (updates: Partial<PopupDesignConfig>) => void;
}

export const StyleCustomizationPanel: React.FC<StyleCustomizationPanelProps> = ({
  config,
  onStyleChange,
}) => {
  const [activeSection, setActiveSection] = React.useState<
    "content" | "layout" | "colors" | "typography"
  >("content");

  type SectionId = "content" | "layout" | "colors" | "typography";

  const sectionButtons: Array<{ id: SectionId; label: string; icon: string }> = [
    { id: "content", label: "Content", icon: "📝" },
    { id: "layout", label: "Layout", icon: "📐" },
    { id: "colors", label: "Colors", icon: "🎨" },
    { id: "typography", label: "Typography", icon: "🔤" },
  ];

  const positionOptions = [
    { label: "Center", value: "center" },
    { label: "Top", value: "top" },
    { label: "Bottom", value: "bottom" },
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ];

  const sizeOptions = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" },
  ];

  const slideDirectionOptions = [
    { label: "From Right", value: "right" },
    { label: "From Left", value: "left" },
    { label: "From Bottom", value: "bottom" },
  ];

  const fontFamilyOptions = [
    { label: "System Default", value: "system-ui, -apple-system, sans-serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Helvetica", value: "Helvetica, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times New Roman", value: "Times New Roman, serif" },
  ];

  const fontWeightOptions = [
    { label: "Normal", value: "normal" },
    { label: "Medium", value: "500" },
    { label: "Semi Bold", value: "600" },
    { label: "Bold", value: "bold" },
  ];

  return (
    <Box>
      <Text as="h3" variant="headingMd">
        Customize Your Popup
      </Text>

      <Box paddingBlockStart="400">
        <ButtonGroup variant="segmented">
          {sectionButtons.map((section) => (
            <Button
              key={section.id}
              pressed={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
              size="medium"
            >
              {section.icon} {section.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Box paddingBlockStart="600">
        {activeSection === "content" && (
          <FormLayout>
            <TextField
              autoComplete="off"
              label="Headline"
              value={config.headline || ""}
              onChange={(value) => onStyleChange({ headline: value })}
              helpText="The main headline of your popup"
            />

            <TextField
              autoComplete="off"
              label="Subheadline"
              value={config.subheadline || ""}
              onChange={(value) => onStyleChange({ subheadline: value })}
              multiline={3}
              helpText="Supporting text below the headline"
            />

            <TextField
              autoComplete="off"
              label="Button Text"
              value={config.buttonText || ""}
              onChange={(value) => onStyleChange({ buttonText: value })}
              helpText="Call-to-action button text"
            />

            <TextField
              autoComplete="off"
              label="Button URL (Optional)"
              value={config.buttonUrl || ""}
              onChange={(value) => onStyleChange({ buttonUrl: value })}
              helpText="Where to redirect when button is clicked"
            />

            <TextField
              autoComplete="off"
              label="Image URL (Optional)"
              value={config.imageUrl || ""}
              onChange={(value) => onStyleChange({ imageUrl: value })}
              helpText="Add an image to make your popup more engaging"
            />
          </FormLayout>
        )}

        {activeSection === "layout" && (
          <FormLayout>
            <Select
              label="Position"
              options={positionOptions}
              value={config.position || "center"}
              onChange={(value) =>
                onStyleChange({ position: value as PopupDesignConfig["position"] })
              }
            />

            <Select
              label="Size"
              options={sizeOptions}
              value={config.size || "medium"}
              onChange={(value) => onStyleChange({ size: value as PopupDesignConfig["size"] })}
            />

            <Select
              label="Slide Direction"
              options={slideDirectionOptions}
              value={config.slideDirection || "right"}
              onChange={(value) =>
                onStyleChange({ slideDirection: value as PopupDesignConfig["slideDirection"] })
              }
            />

            <TextField
              autoComplete="off"
              label="Border Radius"
              value={String(config.borderRadius ?? "8px")}
              onChange={(value) => onStyleChange({ borderRadius: value })}
              helpText="Controls how rounded the corners are (e.g., 8px, 16px)"
            />

            <TextField
              autoComplete="off"
              label="Padding"
              value={String(config.padding ?? "24px")}
              onChange={(value) => onStyleChange({ padding: value })}
              helpText="Internal spacing (e.g., 24px, 32px)"
            />

            <Box>
              <Text as="span" variant="bodyMd">
                Overlay Opacity: {Math.round((config.overlayOpacity || 0.6) * 100)}%
              </Text>
              <Box paddingBlockStart="200">
                <RangeSlider
                  label="Overlay Opacity"
                  value={config.overlayOpacity || 0.6}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={(value) =>
                    onStyleChange({
                      overlayOpacity: Array.isArray(value) ? value[0] : value,
                    })
                  }
                />
              </Box>
            </Box>
          </FormLayout>
        )}

        {activeSection === "colors" && (
          <FormLayout>
            <TextField
              autoComplete="off"
              label="Background Color"
              value={config.backgroundColor}
              onChange={(value) => onStyleChange({ backgroundColor: value })}
              helpText="Popup background color (hex code)"
            />

            <TextField
              autoComplete="off"
              label="Text Color"
              value={config.textColor}
              onChange={(value) => onStyleChange({ textColor: value })}
              helpText="Main text color (hex code)"
            />

            <TextField
              autoComplete="off"
              label="Button Color"
              value={config.buttonColor || "#007BFF"}
              onChange={(value) => onStyleChange({ buttonColor: value })}
              helpText="Button background color (hex code)"
            />

            <TextField
              autoComplete="off"
              label="Button Text Color"
              value={config.buttonTextColor || "#FFFFFF"}
              onChange={(value) => onStyleChange({ buttonTextColor: value })}
              helpText="Button text color (hex code)"
            />
          </FormLayout>
        )}

        {activeSection === "typography" && (
          <FormLayout>
            <Select
              label="Font Family"
              options={fontFamilyOptions}
              value={config.fontFamily || "system-ui, -apple-system, sans-serif"}
              onChange={(value) => onStyleChange({ fontFamily: value })}
            />

            <TextField
              autoComplete="off"
              label="Font Size"
              value={config.fontSize || "14px"}
              onChange={(value) => onStyleChange({ fontSize: value })}
              helpText="Base font size (e.g., 14px, 16px)"
            />

            <Select
              label="Font Weight"
              options={fontWeightOptions}
              value={config.fontWeight || "normal"}
              onChange={(value) => onStyleChange({ fontWeight: value })}
            />
          </FormLayout>
        )}
      </Box>
    </Box>
  );
};
