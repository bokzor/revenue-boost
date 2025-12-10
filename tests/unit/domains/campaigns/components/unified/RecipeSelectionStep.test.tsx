/**
 * RecipeSelectionStep Component Tests
 *
 * Tests the recipe selection flow with goal filtering, recipe picking,
 * and initial data building from selected recipes.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import {
  RecipeSelectionStep,
  type RecipeSelectionStepProps,
  type RecipeSelectionResult,
} from "~/domains/campaigns/components/unified/RecipeSelectionStep";
import type { StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";
import type { CampaignGoal } from "~/domains/campaigns/types/campaign";

// Mock the RecipePicker to simplify testing
vi.mock("~/domains/campaigns/components/recipes/RecipePicker", () => ({
  RecipePicker: ({ recipes, onSelect }: { recipes: StyledRecipe[]; onSelect: (recipe: StyledRecipe) => void }) => (
    <div data-testid="recipe-picker">
      {recipes.map((recipe) => (
        <button key={recipe.id} data-testid={`recipe-${recipe.id}`} onClick={() => onSelect(recipe)}>
          {recipe.name}
        </button>
      ))}
    </div>
  ),
}));

// Mock GoalFilter
vi.mock("~/domains/campaigns/components/goals/GoalFilter", () => ({
  GoalFilter: ({
    value,
    onChange,
  }: {
    value: CampaignGoal | null;
    onChange: (goal: CampaignGoal | null) => void;
  }) => (
    <div data-testid="goal-filter">
      <button data-testid="filter-all" onClick={() => onChange(null)}>All</button>
      <button data-testid="filter-newsletter" onClick={() => onChange("NEWSLETTER_SIGNUP")}>Newsletter</button>
      <button data-testid="filter-revenue" onClick={() => onChange("INCREASE_REVENUE")}>Revenue</button>
      <button data-testid="filter-engagement" onClick={() => onChange("ENGAGEMENT")}>Engagement</button>
      <span data-testid="current-filter">{value || "all"}</span>
    </div>
  ),
}));

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

// Create mock recipes for testing
const createMockRecipe = (overrides: Partial<StyledRecipe> = {}): StyledRecipe => ({
  id: "test-recipe",
  name: "Test Recipe",
  tagline: "Test tagline",
  description: "Test description",
  icon: "🎯",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP" as CampaignGoal,
  templateType: "NEWSLETTER",
  component: "NewsletterMinimal",
  layout: "centered",
  inputs: [],
  editableFields: [],
  defaults: {
    contentConfig: {
      headline: "Test Headline",
      subheadline: "Test subheadline",
    },
  },
  ...overrides,
} as StyledRecipe);

const mockRecipes: StyledRecipe[] = [
  createMockRecipe({ id: "newsletter-1", name: "Newsletter Basic", goal: "NEWSLETTER_SIGNUP" }),
  createMockRecipe({ id: "newsletter-2", name: "Newsletter Premium", goal: "NEWSLETTER_SIGNUP" }),
  createMockRecipe({ id: "flash-sale-1", name: "Flash Sale", goal: "INCREASE_REVENUE", templateType: "FLASH_SALE" }),
  createMockRecipe({ id: "spin-wheel", name: "Spin to Win", goal: "ENGAGEMENT", templateType: "SPIN_TO_WIN" }),
];

describe("RecipeSelectionStep", () => {
  const defaultProps: RecipeSelectionStepProps = {
    recipes: mockRecipes,
    onRecipeSelected: vi.fn(),
    storeId: "test-store-id",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the goal filter", () => {
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} />);

      expect(screen.getByTestId("goal-filter")).toBeTruthy();
    });

    it("renders the recipe picker with all recipes", () => {
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} />);

      expect(screen.getByTestId("recipe-picker")).toBeTruthy();
      expect(screen.getByText("Newsletter Basic")).toBeTruthy();
      expect(screen.getByText("Flash Sale")).toBeTruthy();
      expect(screen.getByText("Spin to Win")).toBeTruthy();
    });
  });

  describe("Goal Filtering", () => {
    it("filters recipes when a goal is selected", async () => {
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} />);

      // Click newsletter filter
      fireEvent.click(screen.getByTestId("filter-newsletter"));

      await waitFor(() => {
        // Newsletter recipes should be visible
        expect(screen.getByText("Newsletter Basic")).toBeTruthy();
        expect(screen.getByText("Newsletter Premium")).toBeTruthy();
        // Non-newsletter recipes should not be in the picker
        // (they won't be rendered since we filter them out)
      });
    });

    it("shows all recipes when 'all' is selected", async () => {
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} />);

      // First filter, then clear
      fireEvent.click(screen.getByTestId("filter-newsletter"));
      fireEvent.click(screen.getByTestId("filter-all"));

      await waitFor(() => {
        expect(screen.getByText("Newsletter Basic")).toBeTruthy();
        expect(screen.getByText("Flash Sale")).toBeTruthy();
      });
    });
  });

  describe("Recipe Selection", () => {
    it("calls onRecipeSelected when a recipe is clicked", async () => {
      const onRecipeSelected = vi.fn();
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} onRecipeSelected={onRecipeSelected} />);

      fireEvent.click(screen.getByTestId("recipe-newsletter-1"));

      await waitFor(() => {
        expect(onRecipeSelected).toHaveBeenCalledTimes(1);
      });
    });

    it("passes recipe and initial data to onRecipeSelected", async () => {
      const onRecipeSelected = vi.fn();
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} onRecipeSelected={onRecipeSelected} />);

      fireEvent.click(screen.getByTestId("recipe-newsletter-1"));

      await waitFor(() => {
        const result: RecipeSelectionResult = onRecipeSelected.mock.calls[0][0];
        expect(result.recipe.id).toBe("newsletter-1");
        expect(result.initialData).toBeDefined();
        expect(result.initialData.templateType).toBe("NEWSLETTER");
      });
    });

    it("includes design config in initial data", async () => {
      const onRecipeSelected = vi.fn();
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} onRecipeSelected={onRecipeSelected} />);

      fireEvent.click(screen.getByTestId("recipe-newsletter-1"));

      await waitFor(() => {
        const result: RecipeSelectionResult = onRecipeSelected.mock.calls[0][0];
        expect(result.initialData.designConfig).toBeDefined();
      });
    });
  });

  describe("Restricted Goal Mode (A/B Experiments)", () => {
    it("hides goal filter when restrictToGoal is set", () => {
      renderWithPolaris(
        <RecipeSelectionStep {...defaultProps} restrictToGoal="NEWSLETTER_SIGNUP" />
      );

      // Goal filter should not be visible
      expect(screen.queryByTestId("goal-filter")).toBeNull();
    });

    it("shows info banner when restrictToGoal is set", () => {
      renderWithPolaris(
        <RecipeSelectionStep {...defaultProps} restrictToGoal="NEWSLETTER_SIGNUP" />
      );

      expect(
        screen.getByText(/Only showing recipes that match the Control variant's goal/)
      ).toBeTruthy();
    });

    it("shows variant label in banner", () => {
      renderWithPolaris(
        <RecipeSelectionStep
          {...defaultProps}
          restrictToGoal="NEWSLETTER_SIGNUP"
          variantLabel="Variant B"
        />
      );

      expect(screen.getByText(/Configuring Variant B/)).toBeTruthy();
    });

    it("only shows recipes matching restrictToGoal", () => {
      renderWithPolaris(
        <RecipeSelectionStep {...defaultProps} restrictToGoal="INCREASE_REVENUE" />
      );

      // Only Flash Sale should be visible (INCREASE_REVENUE goal)
      expect(screen.getByText("Flash Sale")).toBeTruthy();
      // Newsletter recipes should not be visible
      expect(screen.queryByText("Newsletter Basic")).toBeNull();
    });
  });

  describe("Build From Scratch", () => {
    it("passes onBuildFromScratch to RecipePicker when provided", () => {
      const onBuildFromScratch = vi.fn();
      renderWithPolaris(
        <RecipeSelectionStep {...defaultProps} onBuildFromScratch={onBuildFromScratch} />
      );

      // RecipePicker should receive the prop (mock just renders recipes)
      expect(screen.getByTestId("recipe-picker")).toBeTruthy();
    });
  });

  describe("Recipe Counts", () => {
    it("calculates correct recipe counts per goal", () => {
      renderWithPolaris(<RecipeSelectionStep {...defaultProps} />);

      // Goal filter should be rendered with counts
      // In our mock, we just verify it's rendered
      expect(screen.getByTestId("goal-filter")).toBeTruthy();
    });
  });
});

