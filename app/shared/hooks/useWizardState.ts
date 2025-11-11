/**
 * useWizardState Hook - State management for goal-first campaign wizard
 *
 * Provides comprehensive state management for the multi-step campaign creation process:
 * - Goal-based validation and step progression
 * - Real-time validation with detailed feedback
 * - Session storage persistence
 * - Step dependency management
 * - Auto-save functionality
 */

import { useState, useCallback, useEffect } from "react";
import type { FrequencyCappingConfig } from "~/domains/targeting/components";
import type { DiscountConfig } from "~/domains/commerce/services/discounts/discount.server";

// Import comprehensive enhanced triggers types
import type {
  EnhancedTriggersConfig,
  AudienceTargetingConfig,
  PageTargetingConfig,
  CampaignGoal,
  TriggerType as CampaignTriggerType,
  TemplateType,
} from "~/domains/campaigns/types/campaign";

// Import extracted modules for SOLID compliance
import { validateStep as validateStepFn, type ValidationResult } from "./wizard/validators";
import { createDefaultCampaignData } from "./wizard/defaults";
import { buildGoalUpdates } from "./wizard/goal-config";

// Re-export types from canonical source
export type { CampaignGoal, TemplateType };

// Wizard-specific TriggerType (extends canonical with string for flexibility)
export type TriggerType = CampaignTriggerType | (string & {});

// Re-export types for convenience
export type { PageTargetingConfig, AudienceTargetingConfig, EnhancedTriggersConfig };

// Simplified TargetRulesConfig for wizard state (legacy compatibility)
export interface TargetRulesConfig {
  enabled?: boolean;
  segments?: string[];
  [key: string]: unknown;
}

// ============================================================================
// WIZARD-SPECIFIC FORM STATE TYPES
// ============================================================================
// Note: These types are specific to the wizard form state and differ from
// the canonical domain types in ~/domains/campaigns/types/campaign.ts
// They represent form data structure, not the final domain model.

/**
 * Wizard-specific popup design form data
 * This is a simplified subset used in the wizard form state,
 * distinct from the full PopupDesignConfig in design-editor.types.ts
 */
export type PopupDesignFormData = {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: string;
  size: string;
  showCloseButton: boolean;
  overlayOpacity: number;
};

/**
 * Campaign content configuration for wizard form state
 * Maps to ContentConfig in the domain model but with wizard-specific fields
 */
export interface CampaignContentConfig {
  headline?: string;
  subheadline?: string;
  description?: string;
  buttonText?: string;
  emailPlaceholder?: string;
  emailLabel?: string;
  emailRequired?: boolean;
  emailErrorMessage?: string;
  nameFieldEnabled?: boolean;
  nameFieldRequired?: boolean;
  nameFieldPlaceholder?: string;
  consentFieldEnabled?: boolean;
  consentFieldRequired?: boolean;
  consentFieldText?: string;
  submitButtonText?: string;
  successMessage?: string;
  failureMessage?: string;
  [key: string]: unknown; // Allow additional fields for template-specific content
}

export interface CampaignTemplateConfig {
  discountPercentage?: number;
  showCountdown?: boolean;
  countdownDuration?: number;
  urgencyMessage?: string;
  showStockCounter?: boolean;
  stockCount?: number;
  productIds?: string[];
  upsellType?: "related" | "complementary" | "bundle";
  notificationInterval?: number;
  maxNotifications?: number;
  [key: string]: unknown; // Allow additional fields for template-specific config
}

export interface CampaignDesignConfig {
  popupDesign?: PopupDesignFormData;
  goal?: string;
  frequencyCapping?: FrequencyCappingConfig;
  budget?: number;
  tags?: string[];
  pageTargeting?: PageTargetingConfig;
  [key: string]: unknown; // Allow additional design-related fields
}

// Campaign form data structure
export interface CampaignFormData {
  id?: string;
  goal?: CampaignGoal;
  contentConfig: CampaignContentConfig; // ✅ Properly typed
  templateId?: string;
  templateType?: TemplateType; // Template type for template-specific configuration
  experimentId?: string; // A/B Testing experiment ID
  templateConfig?: CampaignTemplateConfig; // ✅ Properly typed
  targetRules: TargetRulesConfig;
  designConfig: CampaignDesignConfig; // ✅ Properly typed
  isSaving: boolean;
  // Basic campaign info
  name?: string;
  description?: string;
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  priority?: number;
  // Additional settings
  startDate?: string;
  endDate?: string;
  budget?: number;
  tags?: string[];

  // CampaignForm integration fields
  triggerType: TriggerType;
  triggerConfig?: {
    delay?: number;
    scrollDepth?: number;
    exitIntentSensitivity?: "low" | "medium" | "high";
    conditions?: unknown[];
  }; // Trigger configuration (delay, frequencyCapping, etc.)
  // popupDesign is available both at top level (legacy) and nested in designConfig.popupDesign
  popupDesign?: PopupDesignFormData; // Legacy support - also available in designConfig.popupDesign
  enhancedTriggers: EnhancedTriggersConfig;
  audienceTargeting: AudienceTargetingConfig;
  pageTargeting?: PageTargetingConfig;
  frequencyCapping: FrequencyCappingConfig;
  discountConfig: DiscountConfig;
  // A/B Testing variant fields
  abTestingEnabled?: boolean;
  variantKey?: "A" | "B" | "C" | "D";
  isControl?: boolean;
  variantName?: string;
  variantDescription?: string;
}

// Re-export ValidationResult from validators module
export type { ValidationResult } from "./wizard/validators";

// Wizard state interface
interface WizardState {
  data: CampaignFormData;
  currentStep: number;
  validationResults: Record<number, ValidationResult>;
  isValid: Record<number, boolean>;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
}

const MAX_STEP_INDEX = 7 as const;

export function useWizardState(initialData?: Partial<CampaignFormData>) {
  // Initialize state with fresh data (no sessionStorage persistence)
  const [state, setState] = useState<WizardState>(() => {
    console.log("[USE_WIZARD_STATE] 🌱 Initializing with data:", {
      hasInitialData: !!initialData,
      hasInitialEnhancedTriggers: !!initialData?.enhancedTriggers,
      initialEnhancedTriggers: initialData?.enhancedTriggers,
    });

    return {
      data: createDefaultCampaignData(initialData),
      currentStep: 0,
      validationResults: {},
      isValid: {},
      hasUnsavedChanges: false,
      lastSavedAt: null,
    };
  });

  // Removed sessionStorage persistence for better UX
  // Users get fresh form state when creating new campaigns

  // Step management
  const setStep = useCallback((step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, MAX_STEP_INDEX)), // Clamp to valid range
    }));
  }, []);

  // Data management
  const updateData = useCallback(
    (
      updates:
        | Partial<CampaignFormData>
        | ((prev: CampaignFormData) => Partial<CampaignFormData>),
    ) => {
      setState((prev) => {
        const patch =
          typeof updates === "function" ? updates(prev.data) : updates;
        return {
          ...prev,
          data: { ...prev.data, ...patch },
          hasUnsavedChanges: true,
        };
      });
    },
    [],
  );

  // Set template type and apply template-specific defaults
  // Narrow unknown targetRules.pageTargeting to PageTargetingConfig
  function isPageTargetingConfig(value: unknown): value is PageTargetingConfig {
    if (!value || typeof value !== "object") return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v.enabled === "boolean" &&
      Array.isArray(v.pages) &&
      Array.isArray(v.customPatterns) &&
      Array.isArray(v.excludePages)
    );
  }

  const setTemplateType = useCallback(
    (
      templateType: TemplateType,
      templateObject?: {
        contentDefaults?: Record<string, unknown>;
        targetRules?: Record<string, unknown>;
        design?: Record<string, unknown>;
      }
    ) => {
      console.log("[useWizardState] Setting template type:", templateType, {
        hasTemplateObject: !!templateObject,
        hasContentDefaults: !!templateObject?.contentDefaults,
        hasTargetRules: !!templateObject?.targetRules,
      });

      // Use configuration from the template object (from database)
      const templateDefaults = templateObject?.contentDefaults || {};
      const templateTargetRules = (templateObject?.targetRules as Record<string, unknown>) || {};

      console.log(
        "[useWizardState] Applying template configuration from database:",
        templateType,
      );

      // Extract page targeting from template's targetRules (if available)
      const pageTargetingFromTemplate = (templateTargetRules as { pageTargeting?: unknown })?.pageTargeting;

      const pageTargetingPatch: Partial<CampaignFormData> = isPageTargetingConfig(pageTargetingFromTemplate)
        ? { pageTargeting: pageTargetingFromTemplate }
        : {};

      const next: Partial<CampaignFormData> = {
        templateType,
        // Apply content defaults from database template
        contentConfig: {
          ...state.data.contentConfig,
          ...templateDefaults,
        },
        // Apply page targeting from template's targetRules (from database) if valid
        ...pageTargetingPatch,
        // Note: enhancedTriggers are now set by TemplateStep.tsx using convertDatabaseTriggersAuto
      };

      console.log("[useWizardState] Applied template configuration:", {
        contentFields: Object.keys(templateDefaults || {}),
        hasPageTargeting: !!pageTargetingFromTemplate,
        source: templateObject ? "database" : "none",
      });

      updateData(next);
    },
    [updateData, state.data.contentConfig],
  );

  // Apply goal-based defaults when goal is selected
  // NOTE: Triggers, audience, and frequency are now handled by templates via setTemplateType()
  const applyGoalDefaults = useCallback(
    (goal: CampaignGoal) => {
      console.log("[useWizardState] Applying goal defaults for:", goal);

      // Build and apply goal-specific updates using extracted module
      const updates = buildGoalUpdates(goal, state.data);
      updateData(updates);

      console.log("[useWizardState] Goal defaults applied");
      console.log("[useWizardState] Note: User must select template in Design step");

      // Don't auto-load template - let user select in Design step
      // This ensures preview only shows after explicit template selection
    },
    [updateData, state.data],
  );

  // Goal-based validation engine - now uses extracted validators
  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      // Use extracted validation function
      const result = validateStepFn(stepIndex, state.data);

      // Update state with validation results
      setState((prev) => ({
        ...prev,
        validationResults: { ...prev.validationResults, [stepIndex]: result },
        isValid: { ...prev.isValid, [stepIndex]: result.isValid },
      }));

      return result.isValid;
    },
    [state.data],
  );

  // Validation helpers
  const isStepValid = useCallback(
    (stepIndex: number): boolean => {
      return state.isValid[stepIndex] || false;
    },
    [state.isValid],
  );

  const getStepErrors = useCallback(
    (stepIndex: number) => {
      return (
        state.validationResults[stepIndex]?.errors?.filter(
          (e) => e.severity === "error",
        ) || []
      );
    },
    [state.validationResults],
  );

  const getStepWarnings = useCallback(
    (stepIndex: number) => {
      return state.validationResults[stepIndex]?.warnings || [];
    },
    [state.validationResults],
  );

  const getStepSuggestions = useCallback(
    (stepIndex: number) => {
      return state.validationResults[stepIndex]?.suggestions || [];
    },
    [state.validationResults],
  );

  // Auto-validate current step when data changes
  useEffect(() => {
    if (state.currentStep >= 0) {
      // Debounce validation to avoid excessive calls
      const timeoutId = setTimeout(() => {
        validateStep(state.currentStep);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [state.data, state.currentStep, validateStep]);

  // Save state management
  const setSaving = useCallback((isSaving: boolean) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, isSaving },
    }));
  }, []);

  const markAsSaved = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasUnsavedChanges: false,
      lastSavedAt: new Date().toISOString(),
    }));
  }, []);

  // Update entire state (for variant switching)
  const updateEntireState = useCallback(
    (newData: Partial<CampaignFormData>) => {
      setState((prev) => ({
        ...prev,
        data: { ...prev.data, ...newData },
        hasUnsavedChanges: true,
      }));
    },
    [],
  );

  // Clear state (no sessionStorage to clear) - now uses extracted factory
  const clearState = useCallback(() => {
    setState({
      data: createDefaultCampaignData(initialData),
      currentStep: 0,
      validationResults: {},
      isValid: {},
      hasUnsavedChanges: false,
      lastSavedAt: null,
    });
  }, [initialData]);

  return {
    // State
    wizardState: state.data,
    currentStep: state.currentStep,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSavedAt: state.lastSavedAt,

    // Actions
    setStep,
    updateData,
    updateEntireState, // NEW: Update entire state for variant switching
    applyGoalDefaults,
    setTemplateType, // NEW: Set template type and apply template-specific defaults
    validateStep,
    setSaving,
    markAsSaved,
    clearState,

    // Validation helpers
    isStepValid,
    getStepErrors,
    getStepWarnings,
    getStepSuggestions,
  };
}
