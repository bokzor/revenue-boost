/**
 * Recipe-based Campaign Creation Route
 *
 * New simplified flow for creating campaigns using styled recipes.
 * Route: /app/campaigns/recipe
 *
 * Steps:
 * 1. Pick a recipe (RecipePicker)
 * 2. Quick setup (RecipeQuickSetup) - 1-3 essential inputs
 * 3. Customize (RecipeEditor) - full editor with editable fields
 * 4. Save → redirect to campaign detail
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import React, { useState, useCallback } from "react";
import { data, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSubmit } from "react-router";
import { Page, Layout, Card } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import {
  RecipePicker,
  RecipeQuickSetup,
  RecipeEditor,
} from "~/domains/campaigns/components/recipes";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import type {
  StyledRecipe,
  RecipeContext,
  RecipeOutput,
} from "~/domains/campaigns/recipes/styled-recipe-types";

// =============================================================================
// TYPES
// =============================================================================

type RecipeFlowStep = "pick" | "setup" | "edit";

interface LoaderData {
  recipes: StyledRecipe[];
  storeId: string;
}

// =============================================================================
// LOADER
// =============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Get store ID
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shopDomain },
    select: { id: true },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  return data<LoaderData>({
    recipes: STYLED_RECIPES,
    storeId: store.id,
  });
}

// =============================================================================
// ACTION
// =============================================================================

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const formData = await request.formData();

  const recipeOutput = JSON.parse(formData.get("recipeOutput") as string) as RecipeOutput;
  const templateType = formData.get("templateType") as string;
  const goal = formData.get("goal") as string;

  // Get store
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shopDomain },
    select: { id: true },
  });

  if (!store) {
    return data({ error: "Store not found" }, { status: 404 });
  }

  try {
    // Create the campaign
    // Note: Discount codes are created at runtime when customers interact with the popup,
    // not during campaign creation. The discountConfig just stores the configuration
    // (type, value, valueType, etc.) that will be used to generate codes later.
    const campaign = await prisma.campaign.create({
      data: {
        storeId: store.id,
        name: recipeOutput.name,
        description: `Created from recipe`,
        goal: goal as "NEWSLETTER_SIGNUP" | "INCREASE_REVENUE" | "ENGAGEMENT",
        status: "DRAFT",
        templateType: templateType as Parameters<typeof prisma.campaign.create>[0]["data"]["templateType"],
        contentConfig: recipeOutput.contentConfig as object,
        designConfig: recipeOutput.designConfig as object,
        targetRules: (recipeOutput.targetRules || {}) as object,
        discountConfig: (recipeOutput.discountConfig || {}) as object,
      },
    });

    return redirect(`/app/campaigns/${campaign.id}`);
  } catch (error) {
    console.error("Error creating campaign from recipe:", error);
    return data(
      { error: error instanceof Error ? error.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RecipeCampaignCreation() {
  const { recipes } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  // Flow state
  const [step, setStep] = useState<RecipeFlowStep>("pick");
  const [selectedRecipe, setSelectedRecipe] = useState<StyledRecipe | null>(null);
  const [context, setContext] = useState<RecipeContext>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Step 1: Recipe selected
  const handleRecipeSelect = useCallback((recipe: StyledRecipe) => {
    setSelectedRecipe(recipe);
    setStep("setup");
  }, []);

  // Build from scratch - redirect to legacy flow
  const handleBuildFromScratch = useCallback(() => {
    navigate("/app/campaigns/new");
  }, [navigate]);

  // Step 2: Quick setup complete
  const handleQuickSetupContinue = useCallback((ctx: RecipeContext) => {
    setContext(ctx);
    setStep("edit");
  }, []);

  // Step 2: Skip to edit with defaults
  const handleQuickSetupSkip = useCallback(() => {
    setStep("edit");
  }, []);

  // Step 3: Save campaign
  const handleSave = useCallback(
    (output: RecipeOutput) => {
      if (!selectedRecipe) return;

      setIsSaving(true);
      setError(undefined);

      const formData = new FormData();
      formData.append("recipeOutput", JSON.stringify(output));
      formData.append("templateType", selectedRecipe.templateType);
      formData.append("goal", selectedRecipe.goal);

      submit(formData, { method: "post" });
    },
    [selectedRecipe, submit]
  );

  // Back navigation
  const handleBackToRecipes = useCallback(() => {
    setStep("pick");
    setSelectedRecipe(null);
    setContext({});
  }, []);

  const handleBackToSetup = useCallback(() => {
    setStep("setup");
  }, []);

  // Render current step (setup and edit only - pick is handled separately)
  const renderStep = () => {
    switch (step) {
      case "setup":
        if (!selectedRecipe) return null;
        return (
          <RecipeQuickSetup
            recipe={selectedRecipe}
            initialContext={context}
            onBack={handleBackToRecipes}
            onContinue={handleQuickSetupContinue}
            onSkip={handleQuickSetupSkip}
          />
        );

      case "edit":
        if (!selectedRecipe) return null;
        return (
          <RecipeEditor
            recipe={selectedRecipe}
            context={context}
            onBack={handleBackToSetup}
            onSave={handleSave}
            isSaving={isSaving}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  // Page title based on step
  const getPageTitle = () => {
    switch (step) {
      case "pick":
        return "Create Campaign";
      case "setup":
        return selectedRecipe?.name || "Quick Setup";
      case "edit":
        return `Customize: ${selectedRecipe?.name}`;
      default:
        return "Create Campaign";
    }
  };

  // Render content based on step
  const renderContent = () => {
    if (step === "pick") {
      // RecipePicker has its own sidebar layout, no wrapper needed
      return (
        <RecipePicker
          recipes={recipes}
          selectedRecipeId={selectedRecipe?.id}
          onSelect={handleRecipeSelect}
          onBuildFromScratch={handleBuildFromScratch}
          showPreviews={true}
        />
      );
    }

    // Setup and Edit steps have their own Layout with left/right columns
    return renderStep();
  };

  return (
    <Page
      title={getPageTitle()}
      fullWidth={true}
      backAction={
        step === "pick"
          ? { content: "Campaigns", url: "/app/campaigns" }
          : undefined
      }
    >
      {renderContent()}
    </Page>
  );
}

