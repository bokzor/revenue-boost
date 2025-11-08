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
import { EnhancedTriggersConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import type { AudienceTargetingConfig } from "~/domains/targeting/components/AudienceTargetingPanel";

// Import extracted modules for SOLID compliance
import { validateStep as validateStepFn, type ValidationResult } from "./wizard/validators";
import {
  createDefaultCampaignData,
  getPageTargetingDefaults,
} from "./wizard/defaults";
import { buildGoalUpdates, getRecommendedTemplateId } from "./wizard/goal-config";

// Core small unions
export type CampaignGoal =
  | "NEWSLETTER_SIGNUP"
  | "INCREASE_REVENUE"
  | "ENGAGEMENT";
export type TriggerType =
  | "page_load"
  | "exit_intent"
  | "scroll_depth"
  | "time_delay"
  | "custom_event"
  | (string & {});
export type TemplateType =
  | "cart_upsell"
  | "pdp_cross_sell"
  | "post_add_upsell"
  | "newsletter-elegant"
  | "flash-sale-modal"
  | "scratch_card"
  | "spin_to_win"
  | (string & {});

// Targeting and audience config
export interface PageTargetingConfig {
  enabled: boolean;
  pages: string[];
  customPatterns: string[];
  excludePages: string[];
}

export interface TargetRulesConfig {
  enabled?: boolean;
  segments?: string[];
  [key: string]: unknown;
}

// Design
type PopupDesignConfig = {
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

// Proper typed interfaces for campaign configuration
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
  popupDesign?: PopupDesignConfig;
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
  popupDesign?: PopupDesignConfig; // Legacy support - also available in designConfig.popupDesign
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
  const setTemplateType = useCallback(
    (templateType: TemplateType, templateObject?: { contentDefaults?: Record<string, unknown> }) => {
      console.log("[useWizardState] Setting template type:", templateType, {
        hasTemplateObject: !!templateObject,
        hasContentDefaults: !!templateObject?.contentDefaults,
      });

      // Use contentDefaults from the template object (from database)
      const templateDefaults = templateObject?.contentDefaults || {};

      console.log(
        "[useWizardState] Applying template defaults from database:",
        templateType,
      );

      // Get page targeting defaults for this template
      const pageTargetingDefaults = getPageTargetingDefaults(templateType);

      const next: Partial<CampaignFormData> = {
        templateType,
        // Apply content defaults from database template
        contentConfig: {
          ...state.data.contentConfig,
          ...templateDefaults,
        },
        // Apply page targeting defaults
        pageTargeting: pageTargetingDefaults,
        // Note: enhancedTriggers are now set by TemplateStep.tsx using convertDatabaseTriggersAuto
      };

      console.log("[useWizardState] Applied template configuration:", {
        contentFields: Object.keys(templateDefaults || {}),
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
      const recommendedTemplateId = getRecommendedTemplateId(goal);

      console.log("[useWizardState] Applying goal defaults for:", goal);
      console.log("[useWizardState] Recommended template ID:", recommendedTemplateId);

      // Build and apply goal-specific updates using extracted module
      const updates = buildGoalUpdates(goal, state.data);
      updateData(updates);

      console.log("[useWizardState] Goal defaults applied. Template ID set to:", recommendedTemplateId);
      console.log("[useWizardState] Note: Triggers, audience, and frequency will be applied by template");

      // Auto-load template type for immediate preview if we have a recommended template
      if (recommendedTemplateId) {
        console.log("[useWizardState] Using template ID as type for preview:", recommendedTemplateId);
        setTemplateType(recommendedTemplateId as TemplateType);
      }
    },
    [updateData, setTemplateType, state.data],
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
