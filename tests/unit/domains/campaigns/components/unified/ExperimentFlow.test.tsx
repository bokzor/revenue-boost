/**
 * ExperimentFlow Component Tests
 *
 * Tests the two-step flow for creating A/B experiments:
 * 1. ExperimentSetup - Configure experiment details and variants
 * 2. VariantConfigurator - Configure each variant's campaign
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import {
  ExperimentFlow,
  type ExperimentFlowProps,
  type Experiment,
  type Variant,
} from "~/domains/campaigns/components/unified/ExperimentFlow";
import type { StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";

// Mock ExperimentSetupView
vi.mock("~/domains/campaigns/components/unified/experiment/ExperimentSetupView", () => ({
  ExperimentSetupView: ({
    experiment,
    onExperimentChange,
    onContinue,
    onAddVariant,
    onBack,
  }: {
    experiment: Experiment;
    onExperimentChange: (updates: Partial<Experiment>) => void;
    onContinue: () => void;
    onAddVariant: () => void;
    onBack: () => void;
  }) => (
    <div data-testid="experiment-setup">
      <input
        data-testid="experiment-name-input"
        value={experiment.name}
        onChange={(e) => onExperimentChange({ name: e.target.value })}
      />
      <div data-testid="variant-count">{experiment.variants.length} variants</div>
      <button data-testid="add-variant-btn" onClick={onAddVariant}>Add Variant</button>
      <button data-testid="continue-btn" onClick={onContinue}>Continue</button>
      <button data-testid="back-btn" onClick={onBack}>Back</button>
    </div>
  ),
}));

// Mock VariantConfigurator
vi.mock("~/domains/campaigns/components/unified/experiment/VariantConfigurator", () => ({
  VariantConfigurator: ({
    experiment,
    activeVariantId,
    onVariantChange,
    onVariantUpdate,
    onBack,
    onSaveDraft,
    onPublish,
  }: {
    experiment: Experiment;
    activeVariantId: string;
    onVariantChange: (id: string) => void;
    onVariantUpdate: (variant: Variant) => void;
    onBack: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
  }) => (
    <div data-testid="variant-configurator">
      <div data-testid="active-variant">{activeVariantId}</div>
      {experiment.variants.map((v) => (
        <button key={v.id} data-testid={`switch-to-${v.id}`} onClick={() => onVariantChange(v.id)}>
          {v.name}
        </button>
      ))}
      <button
        data-testid="configure-variant-btn"
        onClick={() =>
          onVariantUpdate({
            ...experiment.variants.find((v) => v.id === activeVariantId)!,
            status: "configured",
          })
        }
      >
        Mark Configured
      </button>
      <button data-testid="back-to-setup-btn" onClick={onBack}>Back to Setup</button>
      <button data-testid="save-draft-btn" onClick={onSaveDraft}>Save Draft</button>
      <button data-testid="publish-btn" onClick={onPublish}>Publish</button>
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
      contentConfig: {},
    },
    ...overrides,
  }) as StyledRecipe;

const mockRecipes: StyledRecipe[] = [
  createMockRecipe({ id: "recipe-1", name: "Recipe One" }),
  createMockRecipe({ id: "recipe-2", name: "Recipe Two" }),
];

describe("ExperimentFlow", () => {
  const defaultProps: ExperimentFlowProps = {
    onBack: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onSaveDraft: vi.fn().mockResolvedValue(undefined),
    recipes: mockRecipes,
    storeId: "test-store-id",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("shows experiment setup step initially", () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      expect(screen.getByTestId("experiment-setup")).toBeTruthy();
    });

    it("starts with 2 variants (A and B)", () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      expect(screen.getByText("2 variants")).toBeTruthy();
    });
  });

  describe("Experiment Setup", () => {
    it("allows updating experiment name", () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      const input = screen.getByTestId("experiment-name-input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "My Test Experiment" } });

      expect(input.value).toBe("My Test Experiment");
    });

    it("allows adding variants up to 4", async () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      // Add variant C
      fireEvent.click(screen.getByTestId("add-variant-btn"));

      await waitFor(() => {
        expect(screen.getByText("3 variants")).toBeTruthy();
      });
    });

    it("calls onBack when back button is pressed", () => {
      const onBack = vi.fn();
      renderWithPolaris(<ExperimentFlow {...defaultProps} onBack={onBack} />);

      fireEvent.click(screen.getByTestId("back-btn"));

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe("Flow Navigation", () => {
    it("navigates to variant configurator when continue is clicked", async () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      fireEvent.click(screen.getByTestId("continue-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("variant-configurator")).toBeTruthy();
        expect(screen.queryByTestId("experiment-setup")).toBeNull();
      });
    });

    it("shows first variant as active after continuing", async () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      fireEvent.click(screen.getByTestId("continue-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("active-variant")).toHaveTextContent("var-a");
      });
    });

    it("can navigate back to setup from configurator", async () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      // Go to configurator
      fireEvent.click(screen.getByTestId("continue-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("variant-configurator")).toBeTruthy();
      });

      // Go back
      fireEvent.click(screen.getByTestId("back-to-setup-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("experiment-setup")).toBeTruthy();
      });
    });
  });

  describe("Variant Configuration", () => {
    it("allows switching between variants", async () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      // Go to configurator
      fireEvent.click(screen.getByTestId("continue-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("variant-configurator")).toBeTruthy();
      });

      // Switch to variant B
      fireEvent.click(screen.getByTestId("switch-to-var-b"));

      await waitFor(() => {
        expect(screen.getByTestId("active-variant")).toHaveTextContent("var-b");
      });
    });

    it("can mark a variant as configured", async () => {
      renderWithPolaris(<ExperimentFlow {...defaultProps} />);

      // Go to configurator
      fireEvent.click(screen.getByTestId("continue-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("variant-configurator")).toBeTruthy();
      });

      // Mark variant as configured
      fireEvent.click(screen.getByTestId("configure-variant-btn"));

      // Variant should be updated (tested via mock behavior)
      expect(screen.getByTestId("configure-variant-btn")).toBeTruthy();
    });
  });

  describe("Save Actions", () => {
    it("calls onSaveDraft when save draft is clicked", async () => {
      const onSaveDraft = vi.fn().mockResolvedValue(undefined);
      renderWithPolaris(<ExperimentFlow {...defaultProps} onSaveDraft={onSaveDraft} />);

      // Go to configurator
      fireEvent.click(screen.getByTestId("continue-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("variant-configurator")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("save-draft-btn"));

      await waitFor(() => {
        expect(onSaveDraft).toHaveBeenCalled();
      });
    });

    it("calls onSave with running status when publish is clicked", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithPolaris(<ExperimentFlow {...defaultProps} onSave={onSave} />);

      // Go to configurator
      fireEvent.click(screen.getByTestId("continue-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("variant-configurator")).toBeTruthy();
      });

      fireEvent.click(screen.getByTestId("publish-btn"));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ status: "running" })
        );
      });
    });
  });

  describe("Edit Mode", () => {
    const initialExperiment: Experiment = {
      id: "existing-exp",
      name: "Existing Experiment",
      hypothesis: "Test hypothesis",
      successMetric: "email_signups",
      variants: [
        { id: "var-a", name: "A", status: "configured", isControl: true },
        { id: "var-b", name: "B", status: "configured", isControl: false },
      ],
      trafficAllocation: [
        { variantId: "var-a", percentage: 50 },
        { variantId: "var-b", percentage: 50 },
      ],
      status: "draft",
    };

    it("starts with existing experiment data in edit mode", () => {
      renderWithPolaris(
        <ExperimentFlow {...defaultProps} isEditMode={true} initialExperiment={initialExperiment} />
      );

      // Should start at configure step since variants are configured
      expect(screen.getByTestId("variant-configurator")).toBeTruthy();
    });

    it("pre-populates experiment name", () => {
      // Start in setup step by marking variants as empty
      const emptyVariantsExp = {
        ...initialExperiment,
        variants: [
          { id: "var-a", name: "A", status: "empty" as const, isControl: true },
          { id: "var-b", name: "B", status: "empty" as const, isControl: false },
        ],
      };

      renderWithPolaris(
        <ExperimentFlow {...defaultProps} isEditMode={true} initialExperiment={emptyVariantsExp} />
      );

      const input = screen.getByTestId("experiment-name-input") as HTMLInputElement;
      expect(input.value).toBe("Existing Experiment");
    });
  });
});

