/**
 * Campaign Form Context
 *
 * Provides centralized state management for campaign forms
 * Eliminates prop drilling through multiple component levels
 *
 * BENEFITS:
 * - No more passing storeId, shopDomain through 3+ levels
 * - Centralized form state management
 * - Easy access to form data from any nested component
 * - Type-safe context with TypeScript
 */

import { createContext, useContext, ReactNode, useMemo } from "react";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { BackgroundPreset } from "~/config/background-presets";

/**
 * Campaign Form Context Value
 */
export interface CampaignFormContextValue {
  // Store information
  storeId: string;
  shopDomain?: string;
  campaignId?: string;

  // Form state
  wizardState: Partial<CampaignFormData>;
  updateWizardState: (updates: Partial<CampaignFormData>) => void;

  // A/B Testing state
  abTestingEnabled: boolean;
  selectedVariant: string;
  isControl: boolean;

  // Utility functions
  setTemplateType?: (templateType: string) => void;
  applyGoalDefaults?: () => void;

  /**
   * Map of layout -> proven background presets.
   * Loaded once from recipe service, filtered by current layout in components.
   */
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
}

/**
 * Create the context
 */
const CampaignFormContext = createContext<CampaignFormContextValue | undefined>(undefined);

/**
 * Campaign Form Provider Props
 */
export interface CampaignFormProviderProps {
  children: ReactNode;
  value: CampaignFormContextValue;
}

/**
 * Campaign Form Provider
 * Wraps the form and provides context to all children
 */
export function CampaignFormProvider({ children, value }: CampaignFormProviderProps) {
  return <CampaignFormContext.Provider value={value}>{children}</CampaignFormContext.Provider>;
}

/**
 * Hook to use Campaign Form Context
 * Throws error if used outside provider
 */
export function useCampaignForm(): CampaignFormContextValue {
  const context = useContext(CampaignFormContext);

  if (context === undefined) {
    throw new Error("useCampaignForm must be used within a CampaignFormProvider");
  }

  return context;
}

/**
 * Hook to get store information
 * Convenience hook for components that only need store data
 */
export function useStoreInfo() {
  const { storeId, shopDomain } = useCampaignForm();
  return { storeId, shopDomain };
}

/**
 * Hook to get form state
 * Convenience hook for components that only need form data
 */
export function useFormState() {
  const { wizardState, updateWizardState } = useCampaignForm();
  return { wizardState, updateWizardState };
}

/**
 * Hook to get A/B testing state
 * Convenience hook for components that only need A/B testing data
 */
export function useABTestingState() {
  const { abTestingEnabled, selectedVariant, isControl } = useCampaignForm();
  return { abTestingEnabled, selectedVariant, isControl };
}

/**
 * Hook to update specific form field
 * Convenience hook for updating a single field
 */
export function useFormField<K extends keyof CampaignFormData>(
  fieldName: K
): [CampaignFormData[K] | undefined, (value: CampaignFormData[K]) => void] {
  const { wizardState, updateWizardState } = useCampaignForm();

  const value = wizardState[fieldName];
  const setValue = (newValue: CampaignFormData[K]) => {
    updateWizardState({ [fieldName]: newValue } as Partial<CampaignFormData>);
  };

  return [value, setValue];
}

/**
 * Hook to update nested config objects
 * Convenience hook for updating contentConfig, designConfig, etc.
 */
export function useConfigField<TConfig extends Record<string, unknown>>(
  configName: keyof CampaignFormData,
  initialValue: TConfig = {} as TConfig
): [TConfig, (updates: Partial<TConfig> | TConfig) => void] {
  const { wizardState, updateWizardState } = useCampaignForm();

  const config = (wizardState[configName] as unknown as TConfig) || initialValue;

  const updateConfig = (updates: Partial<TConfig> | TConfig) => {
    const newConfig = { ...config, ...updates };
    updateWizardState({ [configName]: newConfig as CampaignFormData[typeof configName] });
  };

  return [config, updateConfig];
}

/**
 * Hook to get available backgrounds for the current layout.
 * Uses the backgroundsByLayout map from context and filters by current design layout.
 */
export function useAvailableBackgrounds(): BackgroundPreset[] {
  const { wizardState, backgroundsByLayout } = useCampaignForm();

  return useMemo(() => {
    if (!backgroundsByLayout) return [];

    const currentLayout = (
      wizardState.designConfig as { leadCaptureLayout?: { desktop?: string } } | undefined
    )?.leadCaptureLayout?.desktop;

    if (!currentLayout) return [];

    return backgroundsByLayout[currentLayout] || [];
  }, [backgroundsByLayout, wizardState.designConfig]);
}
