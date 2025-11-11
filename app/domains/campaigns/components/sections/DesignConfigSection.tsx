/**
 * Design Configuration Section
 *
 * Form section for configuring popup design and appearance
 */

import { TextField, SelectField, FormGrid, ColorField } from "../form";
import type { DesignConfig } from "../../types/campaign";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export interface DesignConfigSectionProps {
  design: Partial<DesignConfig>;
  errors?: Record<string, string>;
  onChange: (design: Partial<DesignConfig>) => void;
}

export function DesignConfigSection({
  design,
  onChange,
}: DesignConfigSectionProps) {
  const updateField = useFieldUpdater(design, onChange);

  return (
    <>
      <FormGrid columns={2}>
        <SelectField
          label="Theme"
          name="design.theme"
          value={design.theme || "professional-blue"}
          options={[
            { label: "Professional Blue", value: "professional-blue" },
            { label: "Vibrant Orange", value: "vibrant-orange" },
            { label: "Elegant Purple", value: "elegant-purple" },
            { label: "Minimal Gray", value: "minimal-gray" },
          ]}
          helpText="Pre-designed color scheme"
          onChange={(value) => updateField("theme", value as DesignConfig["theme"])}
        />

        <SelectField
          label="Position"
          name="design.position"
          value={design.position || "center"}
          options={[
            { label: "Center", value: "center" },
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
          ]}
          helpText="Popup position on screen"
          onChange={(value) => updateField("position", value as DesignConfig["position"])}
        />
      </FormGrid>

      <FormGrid columns={2}>
        <SelectField
          label="Size"
          name="design.size"
          value={design.size || "medium"}
          options={[
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ]}
          helpText="Popup size"
          onChange={(value) => updateField("size", value as DesignConfig["size"])}
        />

        <SelectField
          label="Animation"
          name="design.animation"
          value={design.animation || "fade"}
          options={[
            { label: "Fade", value: "fade" },
            { label: "Slide", value: "slide" },
            { label: "Bounce", value: "bounce" },
            { label: "None", value: "none" },
          ]}
          helpText="Entry animation"
          onChange={(value) => updateField("animation", value as DesignConfig["animation"])}
        />
      </FormGrid>

      <TextField
        label="Border Radius"
        name="design.borderRadius"
        value={design.borderRadius?.toString() || "8"}
        placeholder="8"
        helpText="Corner roundness in pixels (0-50)"
        onChange={(value) => updateField("borderRadius", parseInt(value) || 8)}
      />

      <h3>Custom Colors (Optional)</h3>
      <p>Override theme colors with custom values. Leave empty to use theme defaults.</p>

      <h4>Main Colors</h4>
      <FormGrid columns={3}>
        <ColorField
          label="Background Color"
          name="design.backgroundColor"
          value={design.backgroundColor || ""}
          placeholder="#FFFFFF"
          helpText="Popup background"
          onChange={(value) => updateField("backgroundColor", value || undefined)}
        />

        <ColorField
          label="Text Color"
          name="design.textColor"
          value={design.textColor || ""}
          placeholder="#000000"
          helpText="Main text color"
          onChange={(value) => updateField("textColor", value || undefined)}
        />

        <ColorField
          label="Accent Color"
          name="design.accentColor"
          value={design.accentColor || ""}
          placeholder="#3B82F6"
          helpText="Highlights & accents"
          onChange={(value) => updateField("accentColor", value || undefined)}
        />
      </FormGrid>

      <h4>Button Colors</h4>
      <FormGrid columns={2}>
        <ColorField
          label="Button Background"
          name="design.buttonColor"
          value={design.buttonColor || ""}
          placeholder="#3B82F6"
          helpText="Button background color"
          onChange={(value) => updateField("buttonColor", value || undefined)}
        />

        <ColorField
          label="Button Text"
          name="design.buttonTextColor"
          value={design.buttonTextColor || ""}
          placeholder="#FFFFFF"
          helpText="Button text color"
          onChange={(value) => updateField("buttonTextColor", value || undefined)}
        />
      </FormGrid>

      <h4>Input Field Colors</h4>
      <FormGrid columns={3}>
        <ColorField
          label="Input Background"
          name="design.inputBackgroundColor"
          value={design.inputBackgroundColor || ""}
          placeholder="#FFFFFF"
          helpText="Input field background"
          onChange={(value) => updateField("inputBackgroundColor", value || undefined)}
        />

        <ColorField
          label="Input Text"
          name="design.inputTextColor"
          value={design.inputTextColor || ""}
          placeholder="#000000"
          helpText="Input field text"
          onChange={(value) => updateField("inputTextColor", value || undefined)}
        />

        <ColorField
          label="Input Border"
          name="design.inputBorderColor"
          value={design.inputBorderColor || ""}
          placeholder="#D1D5DB"
          helpText="Input field border"
          onChange={(value) => updateField("inputBorderColor", value || undefined)}
        />
      </FormGrid>

      <h4>Overlay Colors</h4>
      <FormGrid columns={2}>
        <ColorField
          label="Overlay Color"
          name="design.overlayColor"
          value={design.overlayColor || ""}
          placeholder="#000000"
          helpText="Background overlay color"
          onChange={(value) => updateField("overlayColor", value || undefined)}
        />

        <TextField
          label="Overlay Opacity"
          name="design.overlayOpacity"
          value={design.overlayOpacity?.toString() || "0.5"}
          placeholder="0.5"
          helpText="Overlay transparency (0-1)"
          onChange={(value) => updateField("overlayOpacity", parseFloat(value) || 0.5)}
        />
      </FormGrid>

      <h3>Advanced Customization</h3>

      <TextField
        label="Custom CSS"
        name="design.customCSS"
        value={design.customCSS || ""}
        placeholder=".popup { /* custom styles */ }"
        helpText="Advanced: Add custom CSS for fine-tuned styling"
        multiline
        rows={4}
        onChange={(value) => updateField("customCSS", value || undefined)}
      />
    </>
  );
}

