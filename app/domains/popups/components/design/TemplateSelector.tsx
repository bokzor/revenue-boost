import React, { useState, useCallback, useEffect } from "react";
import { Text, Box, Badge, BlockStack } from "@shopify/polaris";
import { getPopupTemplates } from "./PopupTemplateLibrary";
import type { Template } from "~/domains/popups/services/templates.server";
import styles from "./TemplateSelector.module.css";
import { parseTemplateContentConfig } from "~/domains/templates/types/template";

import type { DesignConfig, BaseContentConfig } from "~/domains/campaigns/types/campaign";
import { NEWSLETTER_THEMES } from "~/config/color-presets";
import { getDefaultButtonText } from "~/domains/templates/registry/template-registry";

// Preview helpers: typed content mappers and theme-based color defaults
// Use NonNullable to handle the optional theme field
const THEME_DEFAULTS: Record<
  NonNullable<DesignConfig["theme"]>,
  { background: string; text: string; button: string }
> = {
  modern: {
    background: NEWSLETTER_THEMES.modern.background,
    text: NEWSLETTER_THEMES.modern.text,
    button: NEWSLETTER_THEMES.modern.primary,
  },
  minimal: {
    background: NEWSLETTER_THEMES.minimal.background,
    text: NEWSLETTER_THEMES.minimal.text,
    button: NEWSLETTER_THEMES.minimal.primary,
  },
  elegant: {
    background: NEWSLETTER_THEMES.elegant.background,
    text: NEWSLETTER_THEMES.elegant.text,
    button: NEWSLETTER_THEMES.elegant.primary,
  },
  bold: {
    background: NEWSLETTER_THEMES.bold.background,
    text: NEWSLETTER_THEMES.bold.text,
    button: NEWSLETTER_THEMES.bold.primary,
  },
  glass: {
    background: NEWSLETTER_THEMES.glass.background,
    text: NEWSLETTER_THEMES.glass.text,
    button: NEWSLETTER_THEMES.glass.primary,
  },
  dark: {
    background: NEWSLETTER_THEMES.dark.background,
    text: NEWSLETTER_THEMES.dark.text,
    button: NEWSLETTER_THEMES.dark.primary,
  },
  gradient: {
    background: NEWSLETTER_THEMES.gradient.background,
    text: NEWSLETTER_THEMES.gradient.text,
    button: NEWSLETTER_THEMES.gradient.primary,
  },
  luxury: {
    background: NEWSLETTER_THEMES.luxury.background,
    text: NEWSLETTER_THEMES.luxury.text,
    button: NEWSLETTER_THEMES.luxury.primary,
  },
  neon: {
    background: NEWSLETTER_THEMES.neon.background,
    text: NEWSLETTER_THEMES.neon.text,
    button: NEWSLETTER_THEMES.neon.primary,
  },
  ocean: {
    background: NEWSLETTER_THEMES.ocean.background,
    text: NEWSLETTER_THEMES.ocean.text,
    button: NEWSLETTER_THEMES.ocean.primary,
  },
  "summer-sale": {
    background: NEWSLETTER_THEMES["summer-sale"].background,
    text: NEWSLETTER_THEMES["summer-sale"].text,
    button: NEWSLETTER_THEMES["summer-sale"].primary,
  },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function pickReadableTextColor(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return "#FFFFFF";
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

function getDesignPreviewColors(design: DesignConfig | undefined) {
  const defaults = THEME_DEFAULTS[design?.theme ?? "modern"] ?? THEME_DEFAULTS["modern"];
  const backgroundColor = design?.backgroundColor ?? defaults.background;
  const textColor = design?.textColor ?? defaults.text;
  const buttonColor = design?.buttonColor ?? defaults.button;
  const buttonTextColor = pickReadableTextColor(buttonColor);
  return { backgroundColor, textColor, buttonColor, buttonTextColor };
}

// TODO: Refactor to not use any. Probably a better way to do it
function getPreviewTexts(template: Template) {
  const content = parseTemplateContentConfig(template.contentConfig, template.templateType);
  const c = content as BaseContentConfig;

  // Extract button text from various possible fields
  const buttonText =
    (c as { submitButtonText?: string }).submitButtonText ??
    (c as { spinButtonText?: string }).spinButtonText ??
    (c as { buttonText?: string }).buttonText ??
    (c as { ctaText?: string }).ctaText ??
    getDefaultButtonText(template.templateType);

  return {
    title: c.headline ?? template.name,
    button: buttonText,
    description: template.description,
  };
}

export interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
  storeId?: string;
  onPreviewVisibilityChange?: (visible: boolean) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  storeId,
  onPreviewVisibilityChange,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const loadAllTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const all = await getPopupTemplates(storeId);
      setTemplates(all);
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load all templates once (or when store changes)
  useEffect(() => {
    loadAllTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]); // loadAllTemplates is stable, no need to include

  // Auto-select first template if none is selected
  useEffect(() => {
    if (!selectedTemplate && templates.length > 0 && !isLoadingTemplates) {
      onTemplateSelect(templates[0]);
      onPreviewVisibilityChange?.(true);
    }
  }, [
    templates,
    selectedTemplate,
    onTemplateSelect,
    onPreviewVisibilityChange,
    isLoadingTemplates,
  ]);

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      onTemplateSelect(template);
      // Auto-show preview when template is selected
      onPreviewVisibilityChange?.(true);
    },
    [onTemplateSelect, onPreviewVisibilityChange]
  );

  return (
    <Box>
      <BlockStack gap="400">
        <div>
          <Text as="h2" variant="headingLg">
            Choose a Template
          </Text>
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodyMd" tone="subdued">
              Start with a professionally designed template and customize it to match your brand.
            </Text>
          </Box>
        </div>
      </BlockStack>

      <Box paddingBlockStart="400">
        {isLoadingTemplates ? (
          <div className={styles.loadingState}>
            <Text as="p" variant="bodyMd" tone="subdued">
              Loading templates...
            </Text>
          </div>
        ) : templates.length === 0 ? (
          <div className={styles.emptyState}>
            <Text as="p" variant="bodyMd" tone="subdued">
              No templates found.
            </Text>
          </div>
        ) : (
          <div className={styles.templateGrid}>
            {templates.map((template) => {
              const texts = getPreviewTexts(template);
              const colors = getDesignPreviewColors(template.designConfig);

              const isSelected = selectedTemplate?.id === template.id;

              return (
                <button
                  type="button"
                  key={template.id}
                  className={`${styles.templateCard} ${isSelected ? styles.selected : ""}`}
                  onClick={() => handleTemplateSelect(template)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleTemplateSelect(template);
                    }
                  }}
                  style={{ textAlign: "left" }}
                >
                  {/* Selected Badge */}
                  {isSelected && <div className={styles.selectedBadge}>✓</div>}

                  {/* Template Preview */}
                  <div
                    className={styles.templatePreview}
                    style={{ background: colors.backgroundColor }}
                  >
                    <div
                      className={styles.templatePreviewContent}
                      style={{ color: colors.textColor }}
                    >
                      <div className={styles.templateTitle}>{texts.title}</div>
                      <div className={styles.templatePreviewDescription}>
                        {template.description.substring(0, 60)}...
                      </div>
                      <div
                        className={styles.templateButton}
                        style={{
                          backgroundColor: colors.buttonColor,
                          color: colors.buttonTextColor,
                        }}
                      >
                        {texts.button}
                      </div>
                    </div>
                  </div>

                  {/* Template Info - Horizontal layout */}
                  <div className={styles.templateInfo}>
                    {/* Left side: Name and description */}
                    <div className={styles.templateHeader}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className={styles.templateName}>{template.name}</span>
                        {template.isDefault && (
                          <Badge tone="success" size="small">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className={styles.templateDescription}>{template.description}</p>
                    </div>

                    {/* Right side: Metadata */}
                    <div className={styles.templateMeta}>
                      <span className={styles.templateCategory}>{template.category}</span>

                      {template.conversionRate && (
                        <div className={styles.conversionRate}>
                          <span>📈</span>
                          <span>{template.conversionRate}% conversion</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Box>
    </Box>
  );
};
