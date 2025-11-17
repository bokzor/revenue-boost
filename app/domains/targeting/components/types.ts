/**
 * Trigger Types - Type definitions for conditional triggers
 *
 * Based on research from docs/ui-analysis/features/conditional-triggers.md
 */

export type LogicOperator = "AND" | "OR";

export type ConditionType =
  // Cart-based conditions (session behavior)
  | "cart-value"
  | "cart-item-count";

export type ConditionOperator =
  // Numeric operators
  | "greater-than"
  | "less-than"
  | "equal-to"
  | "between"

  // String operators
  | "contains"
  | "does-not-contain"
  | "is"
  | "is-not"
  | "is-in-list"

  // Boolean operators
  | "is-true"
  | "is-false";

export interface TriggerCondition {
  id: string;
  type: ConditionType;
  operator: ConditionOperator;
  value: string | number | string[] | number[];
  secondaryValue?: string | number; // For "between" operator
}

export interface ConditionTypeOption {
  value: ConditionType;
  label: string;
  category: "cart" | "customer" | "product" | "time" | "device";
  description?: string;
  operators: ConditionOperator[];
  valueType:
    | "text"
    | "number"
    | "select"
    | "multi-select"
    | "date"
    | "time"
    | "product"
    | "collection";
  valueOptions?: Array<{ value: string; label: string }>;
}

// Condition type definitions with available operators
export const CONDITION_TYPES: ConditionTypeOption[] = [
  // Cart-based (session behavior only)
  {
    value: "cart-value",
    label: "Cart value",
    category: "cart",
    description: "Total cart value in dollars",
    operators: ["greater-than", "less-than", "equal-to", "between"],
    valueType: "number",
  },
  {
    value: "cart-item-count",
    label: "Cart item count",
    category: "cart",
    description: "Number of items in cart",
    operators: ["greater-than", "less-than", "equal-to"],
    valueType: "number",
  },
];

// Operator labels
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  "greater-than": "is greater than",
  "less-than": "is less than",
  "equal-to": "is equal to",
  between: "is between",
  contains: "contains",
  "does-not-contain": "does not contain",
  is: "is",
  "is-not": "is not",
  "is-in-list": "is in list",
  "is-true": "is true",
  "is-false": "is false",
};

// Helper function to get condition type config
export function getConditionTypeConfig(
  type: ConditionType,
): ConditionTypeOption | undefined {
  return CONDITION_TYPES.find((ct) => ct.value === type);
}

// Helper function to get available operators for a condition type
export function getAvailableOperators(
  type: ConditionType,
): ConditionOperator[] {
  const config = getConditionTypeConfig(type);
  return config?.operators || [];
}
