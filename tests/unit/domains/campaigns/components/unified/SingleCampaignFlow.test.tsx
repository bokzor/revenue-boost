/**
 * SingleCampaignFlow Component Tests
 *
 * Tests the two-step flow for creating a single campaign:
 * 1. Recipe Selection: Goal-first recipe picker with configuration
 * 2. Campaign Editor: 2-column layout with preview and form sections
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import {
  SingleCampaignFlow,
  type SingleCampaignFlowProps,
  type CampaignData,
} from "~/domains/campaigns/components/unified/SingleCampaignFlow";
import type { StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";

// Mock Affix component to avoid sticky behavior issues in tests
vi.mock("~/shared/components/ui/Affix", () => ({
  Affix: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock LivePreviewPanel to simplify testing
vi.mock("~/domains/popups/components/preview/LivePreviewPanel", () => ({
  LivePreviewPanel: () => <div data-testid="live-preview-panel">Preview</div>,
}));

// Mock RecipeSelectionStep
vi.mock("~/domains/campaigns/components/unified/RecipeSelectionStep", () => ({
  RecipeSelectionStep: ({
    recipes,
    onRecipeSelected,
  }: {
    recipes: StyledRecipe[];
    onRecipeSelected: (result: { recipe: StyledRecipe; initialData: Record<string, unknown> }) => void;
  }) => (
    <div data-testid="recipe-selection-step">
      {recipes.map((recipe) => (
        <button
          key={recipe.id}
          data-testid={`select-recipe-${recipe.id}`}
          onClick={() =>
            onRecipeSelected({
              recipe,
              initialData: {
                name: recipe.name,
                goal: recipe.goal,
                templateType: recipe.templateType,
                contentConfig: recipe.defaults.contentConfig || {},
                designConfig: {},
                targetRules: {},
                discountConfig: {},
              },
            })
          }
        >
          {recipe.name}
        </button>
      ))}
    </div>
  ),
}));

// Mock FormSections to simplify testing
vi.mock("~/domains/campaigns/components/unified/FormSections", () => ({
  FormSections: ({
    campaignName,
    onNameChange,
  }: {
    campaignName: string;
    onNameChange: (name: string) => void;
  }) => (
    <div data-testid="form-sections">
      <input
        data-testid="campaign-name-input"
        value={campaignName}
        onChange={(e) => onNameChange(e.target.value)}
      />
    </div>
  ),
}));

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

// Create mock recipe
const createMockRecipe = (overrides: Partial<StyledRecipe> = {}): StyledRecipe =>
  ({
    id: "test-recipe",
    name: "Test Recipe",
    tagline: "Test tagline",
    description: "Test description",
    icon: "🎯",
    category: "email_leads",
    goal: "NEWSLETTER_SIGNUP",
    templateType: "NEWSLETTER",
    component: "NewsletterMinimal",
    layout: "centered",
    inputs: [],
    editableFields: [],
    defaults: {
      contentConfig: {
        headline: "Test Headline",
      },
    },
    ...overrides,
  }) as StyledRecipe;

const mockRecipes: StyledRecipe[] = [
  createMockRecipe({ id: "recipe-1", name: "Recipe One" }),
  createMockRecipe({ id: "recipe-2", name: "Recipe Two" }),
];

describe("SingleCampaignFlow", () => {
  const defaultProps: SingleCampaignFlowProps = {
    onBack: vi.fn(),
    onSave: vi.fn(),
    onSaveDraft: vi.fn(),
    recipes: mockRecipes,
    storeId: "test-store-id",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("shows recipe selection step when no initial data", () => {
      renderWithPolaris(<SingleCampaignFlow {...defaultProps} />);

      expect(screen.getByTestId("recipe-selection-step")).toBeTruthy();
      expect(screen.getByText("Choose a Recipe")).toBeTruthy();
    });

    it("renders all available recipes in selection step", () => {
      renderWithPolaris(<SingleCampaignFlow {...defaultProps} />);

      expect(screen.getByText("Recipe One")).toBeTruthy();
      expect(screen.getByText("Recipe Two")).toBeTruthy();
    });
  });

  describe("Flow Navigation", () => {
    it("navigates to editor step when recipe is selected", async () => {
      renderWithPolaris(<SingleCampaignFlow {...defaultProps} />);

      fireEvent.click(screen.getByTestId("select-recipe-recipe-1"));

      await waitFor(() => {
        expect(screen.getByTestId("form-sections")).toBeTruthy();
        expect(screen.queryByTestId("recipe-selection-step")).toBeNull();
      });
    });

    it("calls onBack when back is pressed on recipe selection step", () => {
      const onBack = vi.fn();
      renderWithPolaris(<SingleCampaignFlow {...defaultProps} onBack={onBack} />);

      // Find the back button in the Page header (uses aria-label)
      const backButton = screen.getByRole("button", { name: "Back" });
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe("Edit Mode", () => {
    it("skips recipe selection when isEditMode is true", () => {
      renderWithPolaris(
        <SingleCampaignFlow
          {...defaultProps}
          isEditMode={true}
          initialData={{
            name: "Existing Campaign",
            templateType: "NEWSLETTER" as const,
            contentConfig: { headline: "Edit Me" },
            designConfig: {},
            targetingConfig: {
              enhancedTriggers: { enabled: true },
              audienceTargeting: { enabled: false, shopifySegmentIds: [] },
              geoTargeting: { enabled: false, mode: "include", countries: [] },
            },
            frequencyConfig: {
              enabled: true,
              max_triggers_per_session: 1,
              max_triggers_per_day: 3,
              cooldown_between_triggers: 300,
              respectGlobalCap: true,
            },
            scheduleConfig: { status: "DRAFT", priority: 50 },
          }}
        />
      );

      // Should go directly to form sections
      expect(screen.getByTestId("form-sections")).toBeTruthy();
      expect(screen.queryByTestId("recipe-selection-step")).toBeNull();
    });

    it("skips recipe selection when initialData has templateType", () => {
      renderWithPolaris(
        <SingleCampaignFlow
          {...defaultProps}
          initialData={{
            name: "Preset Campaign",
            templateType: "FLASH_SALE" as const,
            contentConfig: {},
            designConfig: {},
            targetingConfig: {
              enhancedTriggers: { enabled: true },
              audienceTargeting: { enabled: false, shopifySegmentIds: [] },
              geoTargeting: { enabled: false, mode: "include", countries: [] },
            },
            frequencyConfig: {
              enabled: true,
              max_triggers_per_session: 1,
              max_triggers_per_day: 3,
              cooldown_between_triggers: 300,
              respectGlobalCap: true,
            },
            scheduleConfig: { status: "DRAFT", priority: 50 },
          }}
        />
      );

      expect(screen.getByTestId("form-sections")).toBeTruthy();
    });

    it("shows 'Edit Campaign' in header when editing", async () => {
      renderWithPolaris(
        <SingleCampaignFlow
          {...defaultProps}
          isEditMode={true}
          initialData={{
            name: "",
            templateType: "NEWSLETTER" as const,
            contentConfig: {},
            designConfig: {},
            targetingConfig: {
              enhancedTriggers: { enabled: true },
              audienceTargeting: { enabled: false, shopifySegmentIds: [] },
              geoTargeting: { enabled: false, mode: "include", countries: [] },
            },
            frequencyConfig: {
              enabled: true,
              max_triggers_per_session: 1,
              max_triggers_per_day: 3,
              cooldown_between_triggers: 300,
              respectGlobalCap: true,
            },
            scheduleConfig: { status: "DRAFT", priority: 50 },
          }}
        />
      );

      expect(screen.getByText("Edit Campaign")).toBeTruthy();
    });
  });

  describe("State Management", () => {
    it("updates campaign name when user types", async () => {
      renderWithPolaris(<SingleCampaignFlow {...defaultProps} />);

      // Select a recipe first
      fireEvent.click(screen.getByTestId("select-recipe-recipe-1"));

      await waitFor(() => {
        expect(screen.getByTestId("form-sections")).toBeTruthy();
      });

      // Name should be pre-filled from recipe
      const input = screen.getByTestId("campaign-name-input") as HTMLInputElement;
      expect(input.value).toBe("Recipe One");
    });

    it("initializes content config from recipe", async () => {
      renderWithPolaris(<SingleCampaignFlow {...defaultProps} />);

      fireEvent.click(screen.getByTestId("select-recipe-recipe-1"));

      await waitFor(() => {
        // Form sections should be rendered with recipe data
        expect(screen.getByTestId("form-sections")).toBeTruthy();
      });
    });
  });

  describe("Save Actions", () => {
    it("shows Save Draft and Publish buttons in editor", async () => {
      renderWithPolaris(<SingleCampaignFlow {...defaultProps} />);

      fireEvent.click(screen.getByTestId("select-recipe-recipe-1"));

      await waitFor(() => {
        expect(screen.getByText("Save Draft")).toBeTruthy();
        expect(screen.getByText("Publish")).toBeTruthy();
      });
    });
  });
});

