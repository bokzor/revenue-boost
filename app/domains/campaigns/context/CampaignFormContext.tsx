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

import React, { createContext, useContext, ReactNode } from "react";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

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
export function useConfigField<TConfig extends Record<string, any>>(
  configName: keyof CampaignFormData,
  initialValue: TConfig = {} as TConfig
): [TConfig, (updates: Partial<TConfig> | TConfig) => void] {
  const { wizardState, updateWizardState } = useCampaignForm();

  const config = (wizardState[configName] as unknown as TConfig) || initialValue;

  const updateConfig = (updates: Partial<TConfig> | TConfig) => {
    const newConfig = { ...config, ...updates };
    updateWizardState({ [configName]: newConfig as any });
  };

  return [config, updateConfig];
}
