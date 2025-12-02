/**
 * Recipe-based Campaign Creation Route
 *
 * Simplified flow for creating campaigns using styled recipes.
 * Route: /app/campaigns/recipe
 *
 * Flow:
 * 1. Pick a recipe (RecipePicker - full width with categories)
 * 2. Configure quick inputs (Modal)
 * 3. Redirect to full campaign form with pre-filled data
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import React, { useState, useCallback, useMemo } from "react";
import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Page, Modal, BlockStack, Text, Card, TextField, RangeSlider } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { RecipePicker } from "~/domains/campaigns/components/recipes";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import type {
  StyledRecipe,
  RecipeContext,
  QuickInput,
} from "~/domains/campaigns/recipes/styled-recipe-types";

interface LoaderData {
  recipes: StyledRecipe[];
}

// =============================================================================
// LOADER
// =============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  return data<LoaderData>({
    recipes: STYLED_RECIPES,
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RecipeCampaignCreation() {
  const { recipes } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Modal state
  const [selectedRecipe, setSelectedRecipe] = useState<StyledRecipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contextData, setContextData] = useState<RecipeContext>({});

  // Recipe selected - open configuration modal
  const handleRecipeSelect = useCallback((recipe: StyledRecipe) => {
    setSelectedRecipe(recipe);
    // Initialize default values for inputs
    const defaults: RecipeContext = {};
    recipe.inputs.forEach((input) => {
      if ("defaultValue" in input && input.defaultValue !== undefined) {
        defaults[input.key] = input.defaultValue;
      }
    });
    setContextData(defaults);
    setModalOpen(true);
  }, []);

  // Build from scratch - redirect to legacy flow
  const handleBuildFromScratch = useCallback(() => {
    navigate("/app/campaigns/new");
  }, [navigate]);

  // Close modal
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedRecipe(null);
    setContextData({});
  }, []);

  // Input change handler
  const handleInputChange = useCallback((key: string, value: unknown) => {
    setContextData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Build initial data for the campaign form from recipe + context
  const buildInitialData = useCallback(() => {
    if (!selectedRecipe) return {};

    const theme = (selectedRecipe.theme as NewsletterThemeKey) || "modern";
    const themeColors = NEWSLETTER_THEMES[theme] || NEWSLETTER_THEMES.modern;

    // Build content config from recipe defaults and apply context values
    const contentConfig = { ...selectedRecipe.defaults.contentConfig };

    // Apply discount value to content if present
    if (contextData.discountValue !== undefined) {
      // Update subheadline with discount value
      if (typeof contentConfig.subheadline === "string") {
        contentConfig.subheadline = contentConfig.subheadline.replace(
          /\d+%/,
          `${contextData.discountValue}%`
        );
      }
    }

    // Build design config
    let imageUrl: string | undefined;
    let backgroundImageMode: "none" | "preset" = "none";
    let backgroundImagePresetKey: string | undefined;

    if (selectedRecipe.backgroundPresetId) {
      const preset = getBackgroundById(selectedRecipe.backgroundPresetId);
      if (preset) {
        imageUrl = getBackgroundUrl(preset);
        backgroundImageMode = "preset";
        backgroundImagePresetKey = preset.id;
      }
    }

    const designConfig = {
      theme,
      layout: selectedRecipe.layout,
      position: selectedRecipe.defaults.designConfig?.position || "center",
      size: selectedRecipe.defaults.designConfig?.size || "medium",
      backgroundColor: themeColors.background,
      textColor: themeColors.text,
      primaryColor: themeColors.primary,
      buttonColor: themeColors.ctaBg || themeColors.primary,
      buttonTextColor: themeColors.ctaText || "#FFFFFF",
      backgroundImageMode,
      backgroundImagePresetKey,
      imageUrl,
      imagePosition: "full" as const,
      backgroundOverlayOpacity: 0.6,
      ...selectedRecipe.defaults.designConfig,
    };

    // Build discount config
    const discountValue = contextData.discountValue as number | undefined;
    const discountConfig = discountValue
      ? {
          enabled: true,
          type: "AUTOMATIC",
          valueType: "PERCENTAGE",
          value: discountValue,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        }
      : selectedRecipe.defaults.discountConfig;

    return {
      name: selectedRecipe.name,
      goal: selectedRecipe.goal,
      templateType: selectedRecipe.templateType,
      contentConfig,
      designConfig,
      targetRules: selectedRecipe.defaults.targetRules || {},
      discountConfig: discountConfig || {},
    };
  }, [selectedRecipe, contextData]);

  // Create campaign - navigate to full form with initial data
  const handleCreateCampaign = useCallback(() => {
    const initialData = buildInitialData();

    // Store initial data in sessionStorage for the form to pick up
    sessionStorage.setItem("recipeInitialData", JSON.stringify(initialData));

    // Navigate to the campaign form
    navigate("/app/campaigns/new?fromRecipe=true");
  }, [buildInitialData, navigate]);

  // Render input field based on type
  const renderInput = (input: QuickInput) => {
    const value = contextData[input.key];
    const defaultValue = "defaultValue" in input ? input.defaultValue : undefined;

    switch (input.type) {
      case "discount_percentage":
        return (
          <RangeSlider
            key={input.key}
            label={input.label}
            value={typeof value === "number" ? value : (defaultValue as number) || 10}
            min={5}
            max={50}
            step={5}
            onChange={(val) => handleInputChange(input.key, val)}
            output
            suffix={<Text as="span" variant="bodyMd">{typeof value === "number" ? value : defaultValue}%</Text>}
          />
        );

      case "currency_amount":
        return (
          <TextField
            key={input.key}
            label={input.label}
            type="number"
            value={String(value ?? defaultValue ?? "")}
            onChange={(val) => handleInputChange(input.key, Number(val))}
            autoComplete="off"
            prefix="$"
          />
        );

      case "text":
        return (
          <TextField
            key={input.key}
            label={input.label}
            value={String(value ?? defaultValue ?? "")}
            onChange={(val) => handleInputChange(input.key, val)}
            autoComplete="off"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Page
      title="Create Campaign"
      fullWidth={true}
      backAction={{ content: "Campaigns", url: "/app/campaigns" }}
    >
      <RecipePicker
        recipes={recipes}
        selectedRecipeId={selectedRecipe?.id}
        onSelect={handleRecipeSelect}
        onBuildFromScratch={handleBuildFromScratch}
        showPreviews={true}
      />

      {/* Recipe Configuration Modal */}
      {selectedRecipe && (
        <Modal
          open={modalOpen}
          onClose={handleModalClose}
          title={`Setup: ${selectedRecipe.name}`}
          primaryAction={{
            content: "Create Campaign",
            onAction: handleCreateCampaign,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleModalClose,
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              {/* Recipe description */}
              <Text as="p" tone="subdued">
                {selectedRecipe.description}
              </Text>

              {/* Quick inputs */}
              {selectedRecipe.inputs.length > 0 ? (
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingSm">
                      Configure your campaign
                    </Text>
                    {selectedRecipe.inputs.map((input) => renderInput(input))}
                  </BlockStack>
                </Card>
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">
                  This recipe is ready to go! Click "Create Campaign" to continue.
                </Text>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}

