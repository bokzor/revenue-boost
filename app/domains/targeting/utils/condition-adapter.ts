import type { TriggerCondition, ConditionOperator, LogicOperator, ConditionType } from "../components/types";

// Server-side audience condition used in AudienceTargetingConfig.sessionRules
export type AudienceOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin";

export interface AudienceCondition {
  field: string;
  operator: AudienceOperator;
  value: string | number | boolean | string[];
}

// Operator mappings between UI (hyphen) and server (short codes)
export const operatorUiToAudience: Record<ConditionOperator, AudienceOperator> = {
  // numeric
  "greater-than": "gt",
  "less-than": "lt",
  "equal-to": "eq",
  "between": "gt", // NOTE: UI has secondaryValue; server has no explicit between -> approximate lower-bound only

  // string
  contains: "in", // best-effort mapping when value is a list
  "does-not-contain": "ne",
  is: "eq",
  "is-not": "ne",
  "is-in-list": "in",

  // boolean
  "is-true": "eq",
  "is-false": "eq",
};

export const operatorAudienceToUi: Record<AudienceOperator, ConditionOperator> = {
  eq: "is",
  ne: "is-not",
  gt: "greater-than",
  gte: "greater-than",
  lt: "less-than",
  lte: "less-than",
  in: "is-in-list",
  nin: "is-not",
};

// Simple passthrough for field/type mapping.
// If an unknown field is encountered, default to a generic cart-value condition
const toUiType = (field: string): ConditionType => {
  const known: ConditionType[] = ["cart-value", "cart-item-count"];
  if ((known as string[]).includes(field)) return field as ConditionType;
  return "cart-value";
};

// UI -> server AudienceCondition[]
export function uiConditionsToAudience(ui: TriggerCondition[]): AudienceCondition[] {
  return (ui ?? []).map((c) => {
    const op = operatorUiToAudience[c.operator] ?? "eq";
    let value: string | number | boolean | string[] = c.value as any;

    if (c.operator === "is-true") value = true;
    if (c.operator === "is-false") value = false;

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

// Server AudienceCondition[] -> UI
export function audienceConditionsToUi(db?: AudienceCondition[]): TriggerCondition[] {
  return (db ?? []).map((d, idx) => ({
    id: `aud_${idx}`,
    type: toUiType(d.field),
    operator: operatorAudienceToUi[d.operator] ?? "is",
    value: d.value as any,
  }));
}
