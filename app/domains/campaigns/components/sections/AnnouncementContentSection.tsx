/**
 * Announcement Content Configuration Section
 *
 * Form section for configuring announcement banner popup content
 */

import { TextField, CheckboxField, FormGrid, SelectField } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export interface AnnouncementContent {
  headline?: string;
  subheadline?: string;
  sticky?: boolean;
  icon?: string;
  ctaUrl?: string;
  buttonText?: string;
  dismissLabel?: string;
  ctaOpenInNewTab?: boolean;
  colorScheme?: "urgent" | "success" | "info" | "custom";
}

export interface AnnouncementContentSectionProps {
  content: Partial<AnnouncementContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<AnnouncementContent>) => void;
}

export function AnnouncementContentSection({
  content,
  errors,
  onChange,
}: AnnouncementContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <>
      <TextField
        label="Headline"
        name="content.headline"
        value={content.headline || ""}
        error={errors?.headline}
        required
        placeholder="🎉 Flash Sale: 25% OFF Everything - Today Only!"
        helpText="Main announcement message"
        onChange={(value) => updateField("headline", value)}
      />

      <TextField
        label="Subheadline"
        name="content.subheadline"
        value={content.subheadline || ""}
        error={errors?.subheadline}
        placeholder="Use code FLASH25 at checkout"
        helpText="Additional details (optional)"
        onChange={(value) => updateField("subheadline", value)}
      />

      <h3>Visual Elements</h3>

      <FormGrid columns={2}>
        <TextField
          label="Icon/Emoji"
          name="content.icon"
          value={content.icon || ""}
          placeholder="🎉"
          helpText="Emoji or icon to display (optional)"
          onChange={(value) => updateField("icon", value)}
        />

        <SelectField
          label="Color Scheme"
          name="content.colorScheme"
          value={content.colorScheme || "custom"}
          options={[
            { label: "Urgent (Red)", value: "urgent" },
            { label: "Success (Green)", value: "success" },
            { label: "Info (Blue)", value: "info" },
            { label: "Custom (Use Design Colors)", value: "custom" },
          ]}
          helpText="Pre-defined color scheme or use custom colors"
          onChange={(value) =>
            updateField("colorScheme", value as AnnouncementContent["colorScheme"])
          }
        />
      </FormGrid>

      <h3>Call to Action</h3>

      <FormGrid columns={2}>
        <TextField
          label="Button Text"
          name="content.buttonText"
          value={content.buttonText || ""}
          error={errors?.buttonText}
          placeholder="Shop Now"
          helpText="CTA button text (optional)"
          onChange={(value) => updateField("buttonText", value)}
        />

        <TextField
          label="CTA URL"
          name="content.ctaUrl"
          value={content.ctaUrl || ""}
          error={errors?.ctaUrl}
          placeholder="/collections/sale"
          helpText="Where to send users when they click"
          onChange={(value) => updateField("ctaUrl", value)}
        />
      </FormGrid>

      <CheckboxField
        label="Open Link in New Tab"
        name="content.ctaOpenInNewTab"
        checked={content.ctaOpenInNewTab || false}
        helpText="Open CTA link in a new browser tab"
        onChange={(checked) => updateField("ctaOpenInNewTab", checked)}
      />

      <TextField
        label="Dismiss Button Text"
        name="content.dismissLabel"
        value={content.dismissLabel || ""}
        error={errors?.dismissLabel}
        placeholder="No thanks"
        helpText="Text for the dismiss action that closes the banner"
        onChange={(value) => updateField("dismissLabel", value)}
      />

      <h3>Behavior</h3>

      <CheckboxField
        label="Sticky Banner"
        name="content.sticky"
        checked={content.sticky !== false}
        helpText="Keep banner visible when scrolling"
        onChange={(checked) => updateField("sticky", checked)}
      />
    </>
  );
}
