import React, { useState, useCallback } from "react";
import {
  Card,
  Text,
  Box,
  Button,
  ButtonGroup,
  Badge,
  Divider,
  Banner,
  Tooltip,
  BlockStack,
  InlineStack,
  Grid,
} from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import type {
  UnifiedRecommendation,
  RecommendationContext,
} from "~/domains/popups/services/recommendations/unified-recommendations.server";
import type { PopupTemplate } from "./PopupTemplateLibrary";

export interface SmartUnifiedRecommendationsProps {
  campaignContext: RecommendationContext;
  onTemplateSelect: (
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
  ) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  selectedTemplate?: PopupTemplate | null;
  onPreviewVisibilityChange?: (visible: boolean) => void;
}

// Generate mock recommendations function - moved before component to avoid hoisting issues
const generateMockRecommendations = (): UnifiedRecommendation[] => {
  // Mock recommendations with diverse colors
  const mockRecommendations: UnifiedRecommendation[] = [
    {
      templateId: "template-flash-sale",
      templateName: "Flash Sale Alert",
      templateType: "FLASH_SALE",
      template: {
        templateId: "flash-sale-modal",
        name: "Flash Sale Alert",
        category: "FLASH_SALE",
        preview: "/templates/flash-sale-preview.png",
        isPopular: true,
        conversionRate: 8.5,
        id: "template-flash-sale",
        title: "🔥 Flash Sale - 30% OFF!",
        description:
          "Limited time offer! Get 30% off your entire order. Use code FLASH30 at checkout.",
        buttonText: "Shop Now & Save",
        backgroundColor: "#FF6B6B",
        textColor: "#FFFFFF",
        buttonColor: "#FFFFFF",
        buttonTextColor: "#FF6B6B",
        position: "center",
        size: "medium",
        showCloseButton: true,
        overlayOpacity: 0.8,
      },
      score: 0.92,
      confidence: "high",
      expectedPerformance: {
        conversionRate: 8.5,
        conversionLift: 67,
      },
      reasoning: [
        "Perfect match for sales goal",
        "High urgency messaging drives action",
        "Historical conversion rate: 8.5%",
        "Proven effective for flash sales",
      ],
      customizations: {
        suggestedTitle: "🔥 Flash Sale - 30% OFF!",
        suggestedDescription:
          "Limited time offer! Get 30% off your entire order. Use code FLASH30 at checkout.",
        suggestedButtonText: "Shop Now & Save",
        suggestedColors: {
          backgroundColor: "#FF6B6B",
          buttonColor: "#FFFFFF",
        },
      },
      source: "smart",
    },
    {
      templateId: "template-exit-intent-offer",
      templateName: "Last Chance Offer",
      templateType: "EXIT_INTENT",
      template: {
        templateId: "exit-intent-offer",
        name: "Last Chance Offer",
        category: "EXIT_INTENT",
        preview: "/templates/exit-intent-offer-preview.png",
        isPopular: true,
        conversionRate: 15.7,
        id: "template-exit-intent-offer",
        title: "Wait! Don't Leave Empty Handed",
        description:
          "Take 15% off your first order and join thousands of happy customers.",
        buttonText: "Claim My Discount",
        backgroundColor: "#6C5CE7",
        textColor: "#FFFFFF",
        buttonColor: "#FFFFFF",
        buttonTextColor: "#6C5CE7",
        position: "center",
        size: "medium",
        showCloseButton: true,
        overlayOpacity: 0.7,
      },
      score: 0.85,
      reasoning: [
        "Excellent for exit intent triggers",
        "High conversion rate: 15.7%",
        "Urgency messaging prevents abandonment",
        "Purple color creates premium feel",
      ],
      confidence: "high",
      expectedPerformance: {
        conversionRate: 15.7,
        conversionLift: 52,
      },
      customizations: {
        suggestedTitle: "Wait! Don't Leave Empty Handed",
        suggestedDescription:
          "Take 15% off your first order and join thousands of happy customers.",
        suggestedButtonText: "Claim My Discount",
        suggestedColors: {
          backgroundColor: "#6C5CE7",
          buttonColor: "#FFFFFF",
        },
      },
      source: "smart",
    },
    {
      templateId: "template-newsletter-signup",
      templateName: "Newsletter Signup",
      templateType: "NEWSLETTER",
      template: {
        templateId: "newsletter-minimal",
        name: "Minimal Newsletter",
        category: "NEWSLETTER",
        preview: "/templates/newsletter-minimal-preview.png",
        conversionRate: 9.8,
        id: "template-newsletter-minimal",
        title: "Stay in the loop",
        description:
          "Subscribe to our newsletter for updates and exclusive offers.",
        buttonText: "Subscribe",
        backgroundColor: "#F8F9FA",
        textColor: "#495057",
        buttonColor: "#28A745",
        buttonTextColor: "#FFFFFF",
        position: "center",
        size: "small",
        showCloseButton: true,
        overlayOpacity: 0.5,
      },
      score: 0.73,
      reasoning: [
        "Clean, minimal design",
        "Good for newsletter signups",
        "Green button creates trust",
        "Light background is non-intrusive",
      ],
      confidence: "medium",
      expectedPerformance: {
        conversionRate: 9.8,
        conversionLift: 35,
      },
      customizations: {
        suggestedTitle: "Stay in the loop",
        suggestedDescription:
          "Subscribe to our newsletter for updates and exclusive offers.",
        suggestedButtonText: "Subscribe",
        suggestedColors: {
          backgroundColor: "#F8F9FA",
          buttonColor: "#28A745",
        },
      },
      source: "smart",
    },
  ];

  return mockRecommendations;
};

export const SmartUnifiedRecommendations: React.FC<
  SmartUnifiedRecommendationsProps
> = ({
  campaignContext: _campaignContext,
  onTemplateSelect,
  onRefresh,
  isLoading = false,
  selectedTemplate = null,
  onPreviewVisibilityChange,
}) => {
  const [recommendations] = useState<UnifiedRecommendation[]>(() => {
    // Initialize with mock data immediately to avoid loading state
    return generateMockRecommendations();
  });
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<UnifiedRecommendation | null>(null);

  // Disable automatic loading to prevent loading spinners during template selection
  // useEffect(() => {
  //   loadRecommendations();
  // }, [loadRecommendations]);

  const getConfidenceBadge = (confidence: string) => {
    const badgeProps = {
      high: { status: "success" as const, children: "High Confidence" },
      medium: { status: "attention" as const, children: "Medium Confidence" },
      low: { status: "critical" as const, children: "Low Confidence" },
    };
    return (
      /* polaris-migrator: Unable to migrate the following expression. Please upgrade manually. */
      <Badge {...badgeProps[confidence as keyof typeof badgeProps]} />
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "warning";
    return "critical";
  };

  const handleTemplateSelect = useCallback(
    (recommendation: UnifiedRecommendation) => {
      if (recommendation.template) {
        onTemplateSelect(recommendation.template as PopupTemplate, recommendation.customizations);
        // Auto-show preview when template is selected
        onPreviewVisibilityChange?.(true);
      }
    },
    [onTemplateSelect, onPreviewVisibilityChange],
  );

  const handleQuickPreview = useCallback(
    (recommendation: UnifiedRecommendation) => {
      // Temporarily select template for preview without committing
      if (recommendation.template) {
        onTemplateSelect(recommendation.template as PopupTemplate, recommendation.customizations);
        onPreviewVisibilityChange?.(true);
      }
    },
    [onTemplateSelect, onPreviewVisibilityChange],
  );

  const handleViewDetails = useCallback(
    (recommendation: UnifiedRecommendation) => {
      setSelectedRecommendation(recommendation);
    },
    [],
  );

  // Removed loading state to improve UX - using mock data immediately
  // if (loadingRecommendations) {
  //   return (
  //     <Card>
  //       <Box padding="400">
  //         <BlockStack gap="400" align="center">
  //           <Spinner size="large" />
  //           <Text as="span" variant="bodyMd">Analyzing your campaign and finding the best templates...</Text>
  //         </BlockStack>
  //       </Box>
  //     </Card>
  //   );
  // }

  if (selectedRecommendation) {
    return (
      <Card>
        <Box padding="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">
              Template Analysis: {selectedRecommendation.template?.name || 'Unknown Template'}
            </Text>
            <Button onClick={() => setSelectedRecommendation(null)}>
              Back to Recommendations
            </Button>
          </InlineStack>
        </Box>

        <Divider />

        <Box padding="400">
          <BlockStack gap="400">
            {/* Score and Confidence */}
            <InlineStack align="space-between">
              <InlineStack gap="200" align="center">
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  Match Score:
                </Text>
                <Badge
                  tone={getScoreColor(selectedRecommendation.score) as "success" | "warning" | "critical"}
                >
                  {`${Math.round(selectedRecommendation.score * 100)}%`}
                </Badge>
              </InlineStack>
              {getConfidenceBadge(String(selectedRecommendation.confidence || "medium"))}
            </InlineStack>

            {/* Expected Impact */}
            {selectedRecommendation.expectedPerformance && (
              <Card background="bg-surface-secondary">
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Expected Impact
                    </Text>
                    <Text as="span" variant="headingMd">
                      +
                      {selectedRecommendation.expectedPerformance
                        .conversionLift || 0}
                      % conversion lift
                    </Text>
                    <Text as="span" variant="bodySm">
                      Based on{" "}
                      {selectedRecommendation.expectedPerformance.conversionRate}%
                      expected conversion rate
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {/* Reasoning */}
            {selectedRecommendation.reasoning && selectedRecommendation.reasoning.length > 0 && (
              <Box>
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  Why This Template?
                </Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="100">
                    {selectedRecommendation.reasoning.map((reason, index) => (
                      <Text as="span" key={index} variant="bodySm">
                        • {reason}
                      </Text>
                    ))}
                  </BlockStack>
                </Box>
              </Box>
            )}

            {/* Customizations */}
            {selectedRecommendation.customizations && (
              <Box>
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  Suggested Customizations
                </Text>
                <Box paddingBlockStart="200">
                  <BlockStack gap="200">
                    {selectedRecommendation.customizations.suggestedTitle && (
                      <Text as="span" variant="bodySm">
                        <strong>Title:</strong>{" "}
                        {selectedRecommendation.customizations.suggestedTitle}
                      </Text>
                    )}
                    {selectedRecommendation.customizations
                      .suggestedDescription && (
                      <Text as="span" variant="bodySm">
                        <strong>Description:</strong>{" "}
                        {
                          selectedRecommendation.customizations
                            .suggestedDescription
                        }
                      </Text>
                    )}
                    {selectedRecommendation.customizations
                      .suggestedButtonText && (
                      <Text as="span" variant="bodySm">
                        <strong>Button:</strong>{" "}
                        {
                          selectedRecommendation.customizations
                            .suggestedButtonText
                        }
                      </Text>
                    )}
                  </BlockStack>
                </Box>
              </Box>
            )}

            <Button
              variant="primary"
              onClick={() => {
                handleTemplateSelect(selectedRecommendation);
                setSelectedRecommendation(null); // Go back to recommendations list
              }}
            >
              Use This Template with Customizations
            </Button>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  return (
    <Box paddingInline="200">
      <InlineStack align="space-between">
        <Text as="h3" variant="headingMd">
          🤖 Smart Template Recommendations
        </Text>
        {onRefresh && (
          <Button onClick={onRefresh} loading={isLoading}>
            Refresh
          </Button>
        )}
      </InlineStack>

      <Box paddingBlockStart="400">
        <Text as="span" variant="bodyMd">
          AI-powered recommendations based on your campaign details, trigger
          type, and industry best practices.
        </Text>
      </Box>

      {recommendations.length === 0 ? (
        <Box paddingBlockStart="400">
          <Banner tone="info">
            <Text as="span" variant="bodyMd">
              No recommendations available. Try providing more campaign details
              for better suggestions.
            </Text>
          </Banner>
        </Box>
      ) : (
        <Box paddingBlockStart="400">
          <Grid>
            {recommendations.map((recommendation, index) => recommendation.template && (
              <Grid.Cell
                key={recommendation.template.templateId}
                columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
              >
                <Card>
                  <Box padding="400">
                    <BlockStack gap="200">
                      {/* Template Preview */}
                      <Box>
                        <div
                          style={{
                            width: "100%",
                            height: "120px",
                            backgroundColor:
                              recommendation.template.backgroundColor || "#FFFFFF",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                            border:
                              selectedTemplate?.templateId ===
                              recommendation.template.templateId
                                ? "2px solid #007BFF"
                                : "1px solid #E1E3E5",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            // Remove loading state - just select immediately
                            handleTemplateSelect(recommendation);
                          }}
                        >
                          <div
                            style={{
                              padding: "12px",
                              textAlign: "center",
                              color: recommendation.template.textColor || "#000000",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "bold",
                                fontSize: "14px",
                                marginBottom: "4px",
                              }}
                            >
                              {recommendation.customizations?.suggestedTitle ||
                                recommendation.template.title}
                            </div>
                            <div style={{ fontSize: "12px", opacity: 0.8 }}>
                              {recommendation.template.description?.substring(
                                0,
                                60,
                              ) || ""}
                              ...
                            </div>
                          </div>

                          {/* Selection indicator */}
                          {selectedTemplate?.templateId ===
                            recommendation.template.templateId && (
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                backgroundColor: "#007BFF",
                                color: "white",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                      </Box>

                      {/* Template Info */}
                      <BlockStack gap="100">
                        <InlineStack align="space-between" blockAlign="start">
                          <Text
                            as="span"
                            variant="bodyMd"
                            fontWeight="semibold"
                          >
                            {recommendation.template.name}
                          </Text>
                          <Badge
                            tone={getScoreColor(recommendation.score) as "success" | "warning" | "critical"}
                          >
                            {`${Math.round(recommendation.score * 100)}%`}
                          </Badge>
                        </InlineStack>

                        {/* Badges */}
                        <InlineStack gap="100" wrap>
                          {index === 0 && (
                            <Badge tone="success">Top Pick</Badge>
                          )}
                          {recommendation.template.isPopular && (
                            <Badge>Popular</Badge>
                          )}
                          {recommendation.source === "ai" && (
                            <Badge tone="info">🤖 AI Enhanced</Badge>
                          )}
                          {getConfidenceBadge(String(recommendation.confidence || "medium"))}
                        </InlineStack>

                        {/* Key Reasons */}
                        <Text as="span" variant="bodySm">
                          {recommendation.reasoning?.slice(0, 2).join(" • ") || ""}
                        </Text>
                      </BlockStack>

                      {/* Actions */}
                      <Box paddingBlockStart="200">
                        <BlockStack gap="200">
                          <ButtonGroup fullWidth>
                            <Button
                              variant={
                                selectedTemplate?.templateId ===
                                recommendation.template.templateId
                                  ? "primary"
                                  : "secondary"
                              }
                              onClick={() =>
                                handleTemplateSelect(recommendation)
                              }
                            >
                              {selectedTemplate?.templateId ===
                              recommendation.template.templateId
                                ? "Selected"
                                : "Use Template"}
                            </Button>
                            <Button
                              variant="tertiary"
                              icon={ViewIcon}
                              accessibilityLabel="Preview template"
                              onClick={() => handleQuickPreview(recommendation)}
                            />
                          </ButtonGroup>
                          <Button
                            size="slim"
                            onClick={() => handleViewDetails(recommendation)}
                          >
                            View Analysis
                          </Button>
                        </BlockStack>
                      </Box>
                    </BlockStack>
                  </Box>
                </Card>
              </Grid.Cell>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export const SmartTemplateRecommendations = SmartUnifiedRecommendations;
