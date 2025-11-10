import type { AudienceTargetingConfig } from "~/domains/campaigns/types/campaign";
import type {
  TriggerCondition,
  ConditionOperator,
  LogicOperator,
  ConditionType,
} from "../components/types";

// DB layer operator type from AudienceTargetingConfigSchema
export type DbOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";

export interface DbCondition {
  field: string;
  operator: DbOperator;
  value: string | number | boolean | string[];
}

// Operator mappings between UI (hyphen) and DB (underscore)
export const operatorUiToDb: Record<ConditionOperator, DbOperator> = {
  // numeric
  "greater-than": "greater_than",
  "less-than": "less_than",
  "equal-to": "equals",
  "between": "greater_than", // NOTE: UI has secondaryValue; DB has no "between" -> approximate lower-bound only

  // string
  contains: "contains",
  "does-not-contain": "not_equals", // best-effort
  is: "equals",
  "is-not": "not_equals",
  "is-in-list": "in",

  // boolean
  "is-true": "equals",
  "is-false": "equals",
};

export const operatorDbToUi: Record<DbOperator, ConditionOperator> = {
  equals: "is",
  not_equals: "is-not",
  contains: "contains",
  greater_than: "greater-than",
  less_than: "less-than",
  in: "is-in-list",
  not_in: "is-not",
};

// Simple passthrough for field/type mapping.
// If an unknown field is encountered, default to a generic cart-value condition
const toUiType = (field: string): ConditionType => {
  // Narrow to our known UI types where possible
  const known: ConditionType[] = [
    "cart-value",
    "cart-item-count",
    "cart-contains-product",
    "cart-contains-tag",
    "cart-contains-collection",
    "customer-tag",
    "customer-type",
    "customer-order-count",
    "customer-location",
    "product-tag",
    "product-collection",
    "product-type",
    "date-range",
    "day-of-week",
    "time-of-day",
    "device-type",
    "browser-type",
  ];
  if ((known as string[]).includes(field)) return field as ConditionType;
  return "cart-value";
};

export function uiConditionsToDb(ui: TriggerCondition[]): DbCondition[] {
  return (ui ?? []).map((c) => {
    const op = operatorUiToDb[c.operator] ?? "equals";
    // Coerce boolean operators to boolean values when possible
    let value: string | number | boolean | string[] = c.value as any;
    if (c.operator === "is-true") value = true;
    if (c.operator === "is-false") value = false;

    // For "between", store the lower bound only as best-effort
    if (c.operator === "between") {
      value = Array.isArray(c.value) ? Number(c.value[0]) : Number(c.value);
    }

    return {
      field: c.type,
      operator: op,
      value,
    };
  });
}

export function dbConditionsToUi(db?: DbCondition[]): TriggerCondition[] {
  return (db ?? []).map((d, idx) => ({
    id: `db_${idx}`,
    type: toUiType(d.field),
    operator: operatorDbToUi[d.operator] ?? "is",
    value: d.value as any,
  }));
}

export function toUiConfig(config: AudienceTargetingConfig) {
  const cr = config?.customRules;
  return {
    enabled: cr?.enabled ?? false,
    conditions: dbConditionsToUi(cr?.conditions ?? []),
    logicOperator: (cr?.logicOperator ?? "AND") as LogicOperator,
  };
}

export function toDbConfig(ui: {
  enabled: boolean;
  conditions: TriggerCondition[];
  logicOperator: LogicOperator;
}): AudienceTargetingConfig["customRules"] {
  return {
    enabled: !!ui.enabled,
    conditions: uiConditionsToDb(ui.conditions ?? []),
    logicOperator: ui.logicOperator,
  };
}

