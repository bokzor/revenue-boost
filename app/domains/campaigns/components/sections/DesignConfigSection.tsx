/**
 * Design Configuration Section
 *
 * Handles all design and color settings for campaigns.
 * This component works with the DesignConfig type and is reusable across all templates.
 */

import { Card, BlockStack, Text, Divider, FormLayout, Select } from "@shopify/polaris";
import { ColorField, FormGrid } from "../form";
import type { DesignConfig } from "~/domains/campaigns/types/campaign";

export interface DesignConfigSectionProps {
  design: Partial<DesignConfig>;
  errors?: Record<string, string>;
  onChange: (design: Partial<DesignConfig>) => void;
}

export function DesignConfigSection({
  design,
  errors,
  onChange,
}: DesignConfigSectionProps) {
  const updateField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    onChange({ ...design, [field]: value });
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Design & Colors
        </Text>
        <Text as="p" tone="subdued">
          Customize the visual appearance of your campaign
        </Text>
        <Divider />

        {/* Theme & Layout */}
        <FormGrid columns={3}>
          <Select
            label="Theme"
            value={design.theme || "professional-blue"}
            options={[
              { label: "Professional Blue", value: "professional-blue" },
              { label: "Vibrant Orange", value: "vibrant-orange" },
              { label: "Elegant Purple", value: "elegant-purple" },
              { label: "Minimal Gray", value: "minimal-gray" },
            ]}
            onChange={(value) => updateField("theme", value as DesignConfig["theme"])}
          />

          <Select
            label="Position"
            value={design.position || "center"}
            options={[
              { label: "Center", value: "center" },
              { label: "Top", value: "top" },
              { label: "Bottom", value: "bottom" },
              { label: "Left", value: "left" },
              { label: "Right", value: "right" },
            ]}
            onChange={(value) => updateField("position", value as DesignConfig["position"])}
          />

          <Select
            label="Size"
            value={design.size || "medium"}
            options={[
              { label: "Small", value: "small" },
              { label: "Medium", value: "medium" },
              { label: "Large", value: "large" },
            ]}
            onChange={(value) => updateField("size", value as DesignConfig["size"])}
          />
        </FormGrid>

        <Divider />

        {/* Main Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Main Colors
          </Text>

          <FormGrid columns={3}>
            <ColorField
              label="Background Color"
              name="design.backgroundColor"
              value={design.backgroundColor || "#FFFFFF"}
              error={errors?.backgroundColor}
              helpText="Popup background color"
              onChange={(value) => updateField("backgroundColor", value)}
            />

            <ColorField
              label="Text Color"
              name="design.textColor"
              value={design.textColor || "#333333"}
              error={errors?.textColor}
              helpText="Main text color"
              onChange={(value) => updateField("textColor", value)}
            />

            <ColorField
              label="Accent Color"
              name="design.accentColor"
              value={design.accentColor || "#007BFF"}
              error={errors?.accentColor}
              helpText="Accent and highlight color"
              onChange={(value) => updateField("accentColor", value)}
            />
          </FormGrid>
        </BlockStack>

        <Divider />

        {/* Button Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Button Colors
          </Text>

          <FormGrid columns={2}>
            <ColorField
              label="Button Background"
              name="design.buttonColor"
              value={design.buttonColor || "#007BFF"}
              error={errors?.buttonColor}
              helpText="CTA button background"
              onChange={(value) => updateField("buttonColor", value)}
            />

            <ColorField
              label="Button Text"
              name="design.buttonTextColor"
              value={design.buttonTextColor || "#FFFFFF"}
              error={errors?.buttonTextColor}
              helpText="CTA button text color"
              onChange={(value) => updateField("buttonTextColor", value)}
            />
          </FormGrid>
        </BlockStack>

        <Divider />

        {/* Input Field Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Input Field Colors
          </Text>

          <FormGrid columns={3}>
            <ColorField
              label="Input Background"
              name="design.inputBackgroundColor"
              value={design.inputBackgroundColor || "#FFFFFF"}
              error={errors?.inputBackgroundColor}
              helpText="Email/form input background"
              onChange={(value) => updateField("inputBackgroundColor", value)}
            />

            <ColorField
              label="Input Text"
              name="design.inputTextColor"
              value={design.inputTextColor || "#333333"}
              error={errors?.inputTextColor}
              helpText="Email/form input text"
              onChange={(value) => updateField("inputTextColor", value)}
            />

            <ColorField
              label="Input Border"
              name="design.inputBorderColor"
              value={design.inputBorderColor || "#D1D5DB"}
              error={errors?.inputBorderColor}
              helpText="Email/form input border"
              onChange={(value) => updateField("inputBorderColor", value)}
            />
          </FormGrid>
        </BlockStack>

        <Divider />

        {/* Overlay Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Overlay Settings
          </Text>

          <FormGrid columns={2}>
            <ColorField
              label="Overlay Color"
              name="design.overlayColor"
              value={design.overlayColor || "#000000"}
              error={errors?.overlayColor}
              helpText="Background overlay color"
              onChange={(value) => updateField("overlayColor", value)}
            />

            <Select
              label="Overlay Opacity"
              value={String(design.overlayOpacity || 0.5)}
              options={[
                { label: "0% (Transparent)", value: "0" },
                { label: "10%", value: "0.1" },
                { label: "20%", value: "0.2" },
                { label: "30%", value: "0.3" },
                { label: "40%", value: "0.4" },
                { label: "50%", value: "0.5" },
                { label: "60%", value: "0.6" },
                { label: "70%", value: "0.7" },
                { label: "80%", value: "0.8" },
                { label: "90%", value: "0.9" },
                { label: "100% (Opaque)", value: "1" },
              ]}
              onChange={(value) => updateField("overlayOpacity", parseFloat(value))}
            />
          </FormGrid>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}


