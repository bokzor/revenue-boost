import React, { useState, useCallback, useEffect } from "react";
import { Text, Box, Badge, BlockStack } from "@shopify/polaris";
import {
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  getPopularTemplates,
  getRecommendedTemplates,
  searchTemplates,
  type PopupTemplate,
} from "./PopupTemplateLibrary";
import { SmartTemplateRecommendations } from "./SmartTemplateRecommendations";
import type { CampaignContext } from "~/domains/popups/services/recommendations/recommendations.server";
import styles from "./TemplateSelector.module.css";

export interface TemplateSelectorProps {
  selectedTemplate: PopupTemplate | null;
  onTemplateSelect: (template: PopupTemplate) => void;
  campaignContext?: CampaignContext;
  showRecommendations?: boolean;
  designConfig?: Record<string, unknown>;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
  isPreviewVisible?: boolean;
  onPreviewVisibilityChange?: (visible: boolean) => void;
  suggestedTemplateIds?: string[]; // Template IDs suggested for the goal
  campaignGoal?: string; // The campaign goal (e.g., "NEWSLETTER_SIGNUP")
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  campaignContext,
  showRecommendations = true,
  onPreviewVisibilityChange,
  suggestedTemplateIds = [],
  campaignGoal,
}) => {
  // Show "Suggested" tab if we have suggested templates
  const hasSuggestedTemplates = suggestedTemplateIds.length > 0;

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (hasSuggestedTemplates) return "suggested";
    if (showRecommendations && campaignContext) return "recommendations";
    return "popular";
  });
  const [searchQuery] = useState("");
  const [templates, setTemplates] = useState<PopupTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const loadTemplatesForCategory = async (category: string) => {
    setIsLoadingTemplates(true);
    try {
      let loadedTemplates: PopupTemplate[] = [];

      if (category === "suggested") {
        // Get all templates first, then filter by suggested IDs
        const allTemplates = await getPopularTemplates(); // Use popular as fallback
        loadedTemplates = allTemplates.filter((t: PopupTemplate) =>
          suggestedTemplateIds.includes(t.templateId),
        );

        // Sort to match the order of suggestedTemplateIds
        loadedTemplates.sort((a: PopupTemplate, b: PopupTemplate) => {
          return (
            suggestedTemplateIds.indexOf(a.templateId) -
            suggestedTemplateIds.indexOf(b.templateId)
          );
        });
      } else if (category === "recommendations") {
        loadedTemplates = await getRecommendedTemplates(campaignContext?.storeId);
      } else if (category === "popular") {
        loadedTemplates = await getPopularTemplates();
      } else if (category === "search") {
        loadedTemplates = await searchTemplates(searchQuery);
      } else {
        loadedTemplates = await getTemplatesByCategory(
          category as PopupTemplate["category"],
        );
      }

      setTemplates(loadedTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load templates when category changes
  useEffect(() => {
    loadTemplatesForCategory(activeCategory);
  }, [activeCategory, searchQuery, campaignContext]);

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
    (template: PopupTemplate) => {
      onTemplateSelect(template);
      // Auto-show preview when template is selected
      onPreviewVisibilityChange?.(true);
    },
    [onTemplateSelect, onPreviewVisibilityChange],
  );

  const handleRecommendationSelect = useCallback(
    (
      template: PopupTemplate,
      customizations?: {
        suggestedTitle?: string;
        suggestedDescription?: string;
        suggestedButtonText?: string;
        suggestedColors?: {
          backgroundColor?: string;
          buttonColor?: string;
        };
      },
    ) => {
      // Apply customizations to template if provided
      if (customizations) {
        const customizedTemplate = {
          ...template,
          title: customizations.suggestedTitle || template.title,
          description:
            customizations.suggestedDescription || template.description,
          buttonText: customizations.suggestedButtonText || template.buttonText,
          backgroundColor:
            customizations.suggestedColors?.backgroundColor ||
            template.backgroundColor,
          buttonColor:
            customizations.suggestedColors?.buttonColor || template.buttonColor,
        };
        onTemplateSelect(customizedTemplate);
      } else {
        onTemplateSelect(template);
      }
    },
    [onTemplateSelect],
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
              Start with a professionally designed template and customize it to
              match your brand.
            </Text>
          </Box>
        </div>

        {/* Category Tabs */}
        <div className={styles.categoryTabs}>
          {hasSuggestedTemplates && (
            <button
              className={`${styles.categoryTab} ${styles.suggested} ${activeCategory === "suggested" ? styles.active : ""}`}
              onClick={() => setActiveCategory("suggested")}
            >
              ✨ Suggested
            </button>
          )}
          {showRecommendations && campaignContext && (
            <button
              className={`${styles.categoryTab} ${activeCategory === "recommendations" ? styles.active : ""}`}
              onClick={() => setActiveCategory("recommendations")}
            >
              🤖 Smart Picks
            </button>
          )}
          <button
            className={`${styles.categoryTab} ${activeCategory === "popular" ? styles.active : ""}`}
            onClick={() => setActiveCategory("popular")}
          >
            ⭐ Popular
          </button>
          {(TEMPLATE_CATEGORIES as Array<{ id: string; name: string; icon: string }>).map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryTab} ${activeCategory === category.id ? styles.active : ""}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </BlockStack>

      <Box paddingBlockStart="400">
        {activeCategory === "recommendations" && campaignContext ? (
          <SmartTemplateRecommendations
            campaignContext={{
              goal: campaignContext.goal,
              previousCampaigns: campaignContext.previousCampaigns,
            }}
            onTemplateSelect={handleRecommendationSelect}
            selectedTemplate={selectedTemplate}
            onPreviewVisibilityChange={onPreviewVisibilityChange}
          />
        ) : (
          <>
            {/* Suggested templates banner */}
            {activeCategory === "suggested" && campaignGoal && (
              <div className={styles.suggestedBanner}>
                <div className={styles.bannerHeader}>
                  <span className={styles.bannerTitle}>
                    ✨ Optimized for{" "}
                    {campaignGoal.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <Badge tone="success">Recommended</Badge>
                </div>
                <p className={styles.bannerDescription}>
                  These templates are specifically designed to help you achieve
                  your campaign goal with proven layouts and best practices.
                </p>
              </div>
            )}
            {/* Template List - One per line */}
            {isLoadingTemplates ? (
              <div className={styles.loadingState}>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Loading templates...
                </Text>
              </div>
            ) : templates.length === 0 ? (
              <div className={styles.emptyState}>
                <Text as="p" variant="bodyMd" tone="subdued">
                  No templates found for this category.
                </Text>
              </div>
            ) : (
              <div className={styles.templateGrid}>
                {templates.map((template: any) => {
                  const isSelected =
                    selectedTemplate?.templateId === template.templateId;

                  return (
                    <div
                      key={template.templateId}
                      className={`${styles.templateCard} ${isSelected ? styles.selected : ""}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {/* Selected Badge */}
                      {isSelected && (
                        <div className={styles.selectedBadge}>✓</div>
                      )}

                      {/* Template Preview */}
                      <div
                        className={styles.templatePreview}
                        style={{ backgroundColor: template.backgroundColor }}
                      >
                        <div
                          className={styles.templatePreviewContent}
                          style={{ color: template.textColor }}
                        >
                          <div className={styles.templateTitle}>
                            {template.title}
                          </div>
                          <div className={styles.templatePreviewDescription}>
                            {template.description.substring(0, 60)}...
                          </div>
                          <div
                            className={styles.templateButton}
                            style={{
                              backgroundColor: template.buttonColor,
                              color: template.buttonTextColor,
                            }}
                          >
                            {template.buttonText}
                          </div>
                        </div>
                      </div>

                      {/* Template Info - Horizontal layout */}
                      <div className={styles.templateInfo}>
                        {/* Left side: Name and description */}
                        <div className={styles.templateHeader}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span className={styles.templateName}>
                              {template.name}
                            </span>
                            {template.isPopular && (
                              <Badge tone="success" size="small">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className={styles.templateDescription}>
                            {template.description}
                          </p>
                        </div>

                        {/* Right side: Metadata */}
                        <div className={styles.templateMeta}>
                          <span className={styles.templateCategory}>
                            {template.category}
                          </span>

                          {template.conversionRate && (
                            <div className={styles.conversionRate}>
                              <span>📈</span>
                              <span>{template.conversionRate}% conversion</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
