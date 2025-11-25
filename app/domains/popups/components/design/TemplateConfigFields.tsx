/**
 * TemplateConfigFields Component
 *
 * Renders template-specific configuration fields based on the selected template type.
 * Uses template-field-definitions.ts for field metadata.
 */

import { useState } from "react";
import {
  FormLayout,
  TextField,
  Checkbox,
  Select,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Collapsible,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { getFieldsForTemplate } from "~/lib/template-field-definitions";
import type { ContentFieldDefinition, TemplateSection } from "~/lib/content-config";
import { TEMPLATE_SECTIONS } from "~/lib/content-config";
import { PrizeListEditor, type PrizeItem } from "./PrizeListEditor";
import { WheelColorEditor } from "./WheelColorEditor";

export type TemplateConfigValue =
  | string
  | number
  | boolean
  | string[]
  | PrizeItem[]
  | Record<string, unknown>;

export interface TemplateConfigFieldsProps {
  templateType: string;
  config: Record<string, TemplateConfigValue>;
  onChange: (updates: Record<string, TemplateConfigValue>) => void;
}

export interface TemplateSectionData {
  key: string;
  title: string;
  description?: string;
  icon: string;
  defaultOpen: boolean;
  fields: ContentFieldDefinition[];
  hasAdvancedFields: boolean;
}

export const TemplateConfigFields: React.FC<TemplateConfigFieldsProps> = ({
  templateType,
  config,
  onChange,
}) => {
  // Get field definitions for this template type
  const fields = getFieldsForTemplate(templateType);

  // Track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Default open sections based on TEMPLATE_SECTIONS metadata
    const defaults: Record<string, boolean> = {};
    Object.entries(TEMPLATE_SECTIONS).forEach(([key, meta]) => {
      defaults[key] = meta.defaultOpen;
    });
    return defaults;
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  if (!fields || fields.length === 0) {
    return (
      <Text as="p" tone="subdued">
        No template-specific configuration available for this template.
      </Text>
    );
  }

  // Handle field value change
  const handleFieldChange = (fieldId: string, value: TemplateConfigValue) => {
    onChange({ [fieldId]: value });
  };

  // Check if field should be shown based on conditions
  const shouldShowField = (field: ContentFieldDefinition): boolean => {
    if (!field.conditions || field.conditions.length === 0) {
      return true;
    }

    return field.conditions.every((condition) => {
      const fieldValue = config[condition.field];
      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "not_equals":
          return fieldValue !== condition.value;
        case "contains":
          return Array.isArray(fieldValue) && fieldValue.some((item) => item === condition.value);
        case "not_contains":
          return Array.isArray(fieldValue) && fieldValue.every((item) => item !== condition.value);
        case "greater_than":
          return typeof fieldValue === "number" &&
            typeof condition.value === "number" &&
            fieldValue > condition.value;
        case "less_than":
          return typeof fieldValue === "number" &&
            typeof condition.value === "number" &&
            fieldValue < condition.value;
        default:
          return true;
      }
    });
  };

  // Render a single field based on its type
  const renderField = (field: ContentFieldDefinition) => {
    // Check if field should be shown
    if (!shouldShowField(field)) {
      return null;
    }

    const value = config[field.id] ?? field.defaultValue;

    switch (field.type) {
      case "text":
        return (
          <TextField
            key={field.id}
            label={field.label}
            value={String(value || "")}
            onChange={(newValue) => handleFieldChange(field.id, newValue)}
            placeholder={field.placeholder}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
            autoComplete="off"
            maxLength={field.validation?.maxLength}
            data-testid={field.id}
          />
        );

      case "textarea":
        return (
          <TextField
            key={field.id}
            label={field.label}
            value={String(value || "")}
            onChange={(newValue) => handleFieldChange(field.id, newValue)}
            placeholder={field.placeholder}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
            multiline={4}
            autoComplete="off"
            maxLength={field.validation?.maxLength}
            data-testid={field.id}
          />
        );

      case "boolean":
        return (
          <Checkbox
            key={field.id}
            label={field.label}
            checked={Boolean(value)}
            onChange={(newValue) => handleFieldChange(field.id, newValue)}
            helpText={field.description}
            data-testid={field.id}
          />
        );

      case "number":
        return (
          <TextField
            key={field.id}
            label={field.label}
            type="number"
            value={String(value !== undefined && value !== null ? value : field.defaultValue || "")}
            onChange={(newValue) => {
              // Allow empty string to clear the field completely
              if (newValue === "") {
                handleFieldChange(field.id, "");
              } else {
                const numValue = Number(newValue);
                // Only set to 0 if the field is required and the parsed value is NaN
                if (isNaN(numValue)) {
                  handleFieldChange(field.id, field.validation?.required ? 0 : "");
                } else {
                  handleFieldChange(field.id, numValue);
                }
              }
            }}
            placeholder={field.placeholder}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
            autoComplete="off"
            min={field.validation?.min}
            max={field.validation?.max}
            data-testid={field.id}
          />
        );

      case "select":
        return (
          <Select
            key={field.id}
            label={field.label}
            options={field.options || []}
            value={String(value || field.defaultValue || "")}
            onChange={(newValue) => handleFieldChange(field.id, newValue)}
            helpText={field.description}
            requiredIndicator={field.validation?.required}
          />
        );

      case "color":
        return (
          <div key={field.id} style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              {field.label}
              {field.validation?.required && <span style={{ color: "red" }}> *</span>}
            </label>
            <input
              type="color"
              value={String(value || field.defaultValue || "#000000")}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                border: "1px solid #c4cdd5",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            />
            {field.description && (
              <div
                style={{
                  marginTop: "0.25rem",
                  fontSize: "0.875rem",
                  color: "#6d7175",
                }}
              >
                {field.description}
              </div>
            )}
          </div>
        );

      case "product-picker":
        return (
          <div key={field.id} style={{ marginBottom: "1rem" }}>
            <BlockStack gap="200">
              <label style={{ display: "block", fontWeight: 500 }}>
                {field.label}
                {field.validation?.required && <span style={{ color: "red" }}> *</span>}
              </label>
              {field.description && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {field.description}
                </Text>
              )}
              <div
                style={{
                  padding: "16px",
                  border: "2px dashed #c4cdd5",
                  borderRadius: "8px",
                  textAlign: "center",
                  backgroundColor: "#f6f6f7",
                }}
              >
                <Text as="p" variant="bodySm" tone="subdued">
                  📦 Product picker will be available soon
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  For now, AI recommendations will be used
                </Text>
              </div>
            </BlockStack>
          </div>
        );

      case "collection-picker":
        return (
          <div key={field.id} style={{ marginBottom: "1rem" }}>
            <BlockStack gap="200">
              <label style={{ display: "block", fontWeight: 500 }}>
                {field.label}
                {field.validation?.required && <span style={{ color: "red" }}> *</span>}
              </label>
              {field.description && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {field.description}
                </Text>
              )}
              <div
                style={{
                  padding: "16px",
                  border: "2px dashed #c4cdd5",
                  borderRadius: "8px",
                  textAlign: "center",
                  backgroundColor: "#f6f6f7",
                }}
              >
                <Text as="p" variant="bodySm" tone="subdued">
                  📚 Collection picker will be available soon
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  For now, AI recommendations will be used
                </Text>
              </div>
            </BlockStack>
          </div>
        );

      case "prize-list": {
        return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {field.label}
            </label>
            {field.description && (
              <Text as="p" variant="bodySm" tone="subdued">
                {field.description}
              </Text>
            )}
            <PrizeListEditor
              value={value as string | PrizeItem[] | undefined}
              onChange={(next: PrizeItem[]) => handleFieldChange(field.id, next)}
            />
          </div>
        );
      }

      case "color-list": {
        return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              {field.label}
            </label>
            {field.description && (
              <Text as="p" variant="bodySm" tone="subdued">
                {field.description}
              </Text>
            )}
            <WheelColorEditor
              value={value as string | string[] | undefined}
              onChange={(next: string[]) => handleFieldChange(field.id, next)}
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Group fields by their section property (fallback to group for backwards compatibility)
  const groupedFields = fields.reduce(
    (acc, field) => {
      const section = field.section || field.group || "content";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(field);
      return acc;
    },
    {} as Record<string, ContentFieldDefinition[]>
  );

  // Render fields grouped by section with collapsible sections
  const renderGroupedFields = () => {
    const sections = Object.entries(groupedFields);

    // If only one section, render without collapsible
    if (sections.length === 1) {
      return <FormLayout>{fields.map((field) => renderField(field))}</FormLayout>;
    }

    // Render with collapsible section headers
    return (
      <BlockStack gap="400">
        {sections.map(([sectionKey, sectionFields]) => {
          const sectionMeta = TEMPLATE_SECTIONS[sectionKey as TemplateSection];
          const isOpen = openSections[sectionKey] ?? true;

          // Use metadata if available, otherwise format the key
          const sectionTitle = sectionMeta?.title || formatGroupName(sectionKey);
          const sectionIcon = sectionMeta?.icon || "📋";
          const sectionDescription = sectionMeta?.description;

          return (
            <div
              key={sectionKey}
              style={{
                border: "1px solid #E1E3E5",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {/* Section Header */}
              <button
                type="button"
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                }}
                onClick={() => toggleSection(sectionKey)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleSection(sectionKey);
                  }
                }}
              >
                <InlineStack gap="300" blockAlign="center">
                  <span style={{ fontSize: "20px" }}>{sectionIcon}</span>
                  <BlockStack gap="100">
                    <Text as="h4" variant="headingSm" fontWeight="semibold">
                      {sectionTitle}
                    </Text>
                    {sectionDescription && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {sectionDescription}
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>
                <InlineStack gap="200" blockAlign="center">
                  {sectionFields.some((f) => f.advanced) && <Badge tone="info">Advanced</Badge>}
                  {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </InlineStack>
              </button>

              {/* Section Content */}
              <Collapsible open={isOpen} id={`section-${sectionKey}`}>
                <div style={{ padding: "16px", borderTop: "1px solid #E1E3E5" }}>
                  <FormLayout>{sectionFields.map((field) => renderField(field))}</FormLayout>
                </div>
              </Collapsible>
            </div>
          );
        })}
      </BlockStack>
    );
  };

  return renderGroupedFields();
};

// Helper function to format group names
function formatGroupName(group: string): string {
  const groupNames: Record<string, string> = {
    content: "Content",
    behavior: "Behavior",
    privacy: "Privacy",
    step1: "Step 1: Email",
    step2: "Step 2: Name",
    step3: "Step 3: Preferences",
    products: "Product Settings",
    display: "Display Options",
    timing: "Timing",
    general: "General Settings",
  };

  return groupNames[group] || group.charAt(0).toUpperCase() + group.slice(1);
}

/**
 * Get template sections data for rendering in parent component
 * This allows PopupDesignEditorV2 to render sections as top-level instead of nested
 */
export function getTemplateSections(templateType: string): TemplateSectionData[] {
  const fields = getFieldsForTemplate(templateType);

  if (!fields || fields.length === 0) {
    return [];
  }

  // Group fields by their section property (fallback to group for backwards compatibility)
  const groupedFields = fields.reduce(
    (acc, field) => {
      const section = field.section || "content";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(field);
      return acc;
    },
    {} as Record<string, ContentFieldDefinition[]>
  );

  // Convert to array of section data
  return Object.entries(groupedFields).map(([sectionKey, sectionFields]) => {
    const sectionMeta = TEMPLATE_SECTIONS[sectionKey as TemplateSection];

    return {
      key: sectionKey,
      title: sectionMeta?.title || formatGroupName(sectionKey),
      description: sectionMeta?.description,
      icon: sectionMeta?.icon || "📋",
      defaultOpen: sectionMeta?.defaultOpen ?? true,
      fields: sectionFields,
      hasAdvancedFields: sectionFields.some((f) => f),
    };
  });
}
