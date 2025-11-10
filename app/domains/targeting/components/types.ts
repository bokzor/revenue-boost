/**
 * Trigger Types - Type definitions for conditional triggers
 *
 * Based on research from docs/ui-analysis/features/conditional-triggers.md
 */

export type LogicOperator = "AND" | "OR";

export type ConditionType =
  // Cart-based conditions
  | "cart-value"
  | "cart-item-count"
  | "cart-contains-product"
  | "cart-contains-tag"
  | "cart-contains-collection"

  // Customer-based conditions
  | "customer-tag"
  | "customer-type"
  | "customer-order-count"
  | "customer-location"

  // Product-based conditions
  | "product-tag"
  | "product-collection"
  | "product-type"

  // Time-based conditions
  | "date-range"
  | "day-of-week"
  | "time-of-day"

  // Device-based conditions
  | "device-type"
  | "browser-type";

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
  // Cart-based
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
  {
    value: "cart-contains-product",
    label: "Cart contains product",
    category: "cart",
    description: "Specific product in cart",
    operators: ["contains", "does-not-contain"],
    valueType: "product",
  },
  {
    value: "cart-contains-tag",
    label: "Cart contains product tag",
    category: "cart",
    description: "Product with specific tag",
    operators: ["contains", "does-not-contain"],
    valueType: "text",
  },
  {
    value: "cart-contains-collection",
    label: "Cart contains collection",
    category: "cart",
    description: "Product from collection",
    operators: ["contains", "does-not-contain"],
    valueType: "collection",
  },

  // Customer-based
  {
    value: "customer-tag",
    label: "Customer tag",
    category: "customer",
    description: "Customer has specific tag",
    operators: ["contains", "does-not-contain"],
    valueType: "text",
  },
  {
    value: "customer-type",
    label: "Customer type",
    category: "customer",
    description: "New or returning customer",
    operators: ["is"],
    valueType: "select",
    valueOptions: [
      { value: "new", label: "New customer" },
      { value: "returning", label: "Returning customer" },
    ],
  },
  {
    value: "customer-order-count",
    label: "Customer order count",
    category: "customer",
    description: "Number of previous orders",
    operators: ["greater-than", "less-than", "equal-to"],
    valueType: "number",
  },
  {
    value: "customer-location",
    label: "Customer location",
    category: "customer",
    description: "Shipping country",
    operators: ["is", "is-not", "is-in-list"],
    valueType: "select",
  },

  // Product-based
  {
    value: "product-tag",
    label: "Product tag",
    category: "product",
    description: "Product has specific tag",
    operators: ["contains", "does-not-contain"],
    valueType: "text",
  },
  {
    value: "product-collection",
    label: "Product collection",
    category: "product",
    description: "Product in collection",
    operators: ["is", "is-not"],
    valueType: "collection",
  },

  // Time-based
  {
    value: "date-range",
    label: "Date range",
    category: "time",
    description: "Specific date range",
    operators: ["between"],
    valueType: "date",
  },
  {
    value: "day-of-week",
    label: "Day of week",
    category: "time",
    description: "Specific day(s) of week",
    operators: ["is", "is-in-list"],
    valueType: "multi-select",
    valueOptions: [
      { value: "monday", label: "Monday" },
      { value: "tuesday", label: "Tuesday" },
      { value: "wednesday", label: "Wednesday" },
      { value: "thursday", label: "Thursday" },
      { value: "friday", label: "Friday" },
      { value: "saturday", label: "Saturday" },
      { value: "sunday", label: "Sunday" },
    ],
  },

  // Device-based
  {
    value: "device-type",
    label: "Device type",
    category: "device",
    description: "Desktop, mobile, or tablet",
    operators: ["is"],
    valueType: "select",
    valueOptions: [
      { value: "desktop", label: "Desktop" },
      { value: "mobile", label: "Mobile" },
      { value: "tablet", label: "Tablet" },
    ],
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
