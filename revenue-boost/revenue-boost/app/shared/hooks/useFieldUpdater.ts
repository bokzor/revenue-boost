/**
 * useFieldUpdater Hook
 * 
 * Utility hook for creating type-safe field update functions
 * Eliminates duplicate updateField patterns across form components
 * 
 * @example
 * const updateField = useFieldUpdater(config, onChange);
 * updateField("fieldName", newValue);
 */

import { useCallback } from "react";

/**
 * Creates a type-safe field updater function
 * 
 * @param currentState - Current state object
 * @param onChange - Callback to update the state
 * @returns A function to update individual fields
 */
export function useFieldUpdater<T extends Record<string, unknown>>(
  currentState: Partial<T>,
  onChange: (updated: Partial<T>) => void
) {
  return useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      onChange({ ...currentState, [field]: value });
    },
    [currentState, onChange]
  );
}

/**
 * Creates a type-safe nested field updater function
 * Useful for updating nested objects within a config
 * 
 * @param currentState - Current state object
 * @param onChange - Callback to update the state
 * @param nestedKey - Key of the nested object to update
 * @returns A function to update individual fields in the nested object
 * 
 * @example
 * const updateTrigger = useNestedFieldUpdater(
 *   targetRules,
 *   onChange,
 *   "enhancedTriggers"
 * );
 * updateTrigger("page_load", { enabled: true, delay: 1000 });
 */
export function useNestedFieldUpdater<
  T extends Record<string, unknown>,
  K extends keyof T
>(
  currentState: Partial<T>,
  onChange: (updated: Partial<T>) => void,
  nestedKey: K
) {
  return useCallback(
    <NK extends keyof NonNullable<T[K]>>(
      field: NK,
      updates: Partial<NonNullable<T[K]>[NK]>
    ) => {
      const currentNested = (currentState[nestedKey] as Record<string, unknown> | undefined) || {};
      const currentField = (currentNested[field as string] as Record<string, unknown> | undefined) || {};
      
      onChange({
        ...currentState,
        [nestedKey]: {
          ...currentNested,
          [field]: {
            ...currentField,
            ...updates,
          },
        },
      } as Partial<T>);
    },
    [currentState, onChange, nestedKey]
  );
}

