import type { AudienceTargetingConfig } from "~/domains/campaigns/types/campaign";
import type {
  TriggerCondition,
  ConditionOperator,
} from "~/domains/targeting/components/types";

// DB operators use underscores; UI uses hyphenated strings
export type DbOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "does_not_contain"
  | "greater_than"
  | "less_than"
  | "between"
  | "in"
  | "not_in"
  | "is"
  | "is_not"
  | "is_true"
  | "is_false";

export interface DbCondition {
  field: string;
  operator: DbOperator;
  value: string | number | boolean | Array<string | number> | { min?: number; max?: number };
  secondaryValue?: string | number; // optional for UI convenience
}

export const operatorUiToDb: Record<ConditionOperator, DbOperator> = {
  "equal-to": "equals",
  "does-not-contain": "does_not_contain",
  contains: "contains",
  "greater-than": "greater_than",
  "less-than": "less_than",
  between: "between",
  "is-in-list": "in",
  is: "is",
  "is-not": "is_not",
  "is-true": "is_true",
  "is-false": "is_false",
};

export const operatorDbToUi: Record<DbOperator, ConditionOperator> = {
  equals: "equal-to",
  not_equals: "is-not", // best-effort mapping
  contains: "contains",
  does_not_contain: "does-not-contain",
  greater_than: "greater-than",
  less_than: "less-than",
  between: "between",
  in: "is-in-list",
  not_in: "is-not", // approximate
  is: "is",
  is_not: "is-not",
  is_true: "is-true",
  is_false: "is-false",
};

// UI -> DB
export function uiConditionsToDb(
  ui: TriggerCondition[],
): DbCondition[] {
  return ui.map((c) => {
    const op = operatorUiToDb[c.operator] ?? ("equals" as DbOperator);
    let value: DbCondition["value"] = c.value as any;
    if (c.operator === "between") {
      value = { min: Number(c.value), max: Number(c.secondaryValue) };
    }
    return {
      field: c.type,
      operator: op,
      value,
      secondaryValue: c.secondaryValue as any,
    };
  });
}

// DB -> UI
export function dbConditionsToUi(db?: DbCondition[]): TriggerCondition[] {
  if (!db) return [];
  return db.map((c, i) => ({
    id: `${c.field}-${i}`,
    type: (c.field as any),
    operator: operatorDbToUi[c.operator] ?? "equal-to",
    value: (c.operator === "between" && typeof c.value === "object" && c.value)
      ? (c.value as any).min ?? 0
      : (c.value as any),
    secondaryValue:
      c.operator === "between" && typeof c.value === "object" && c.value
        ? (c.value as any).max
        : undefined,
  }));
}

export function toUiConfig(config: AudienceTargetingConfig) {
  const custom = config.customRules;
  return {
    enabled: !!custom?.enabled,
    logicOperator: custom?.logicOperator ?? "AND",
    conditions: dbConditionsToUi(custom?.conditions as any),
  };
}

export function toDbConfig(
  ui: { enabled: boolean; logicOperator: "AND" | "OR"; conditions: TriggerCondition[] },
): AudienceTargetingConfig["customRules"] {
  return {
    enabled: ui.enabled,
    logicOperator: ui.logicOperator,
    conditions: uiConditionsToDb(ui.conditions) as any,
  } as any;
}

