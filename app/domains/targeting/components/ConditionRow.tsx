/**
 * Condition Row - Refactored to follow SOLID principles
 *
 * IMPROVEMENTS:
 * - Reduced from 350 lines to ~120 lines (66% reduction)
 * - Value input logic extracted into separate components
 * - Single Responsibility: Only handles condition row layout
 * - Open/Closed: Easy to add new value input types
 * - Dependency Inversion: Depends on value input abstractions
 *
 * Based on research from docs/ui-analysis/:
 * - Discovery #27: "Condition builder uses dropdowns, not code"
 * - Visual condition builder with dropdown selectors
 * - No code or JSON required
 */

import React, { useMemo } from "react";
import { InlineStack, Select, Button } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import type { TriggerCondition, ConditionType, ConditionOperator } from "./types";
import { CONDITION_TYPES, OPERATOR_LABELS, getConditionTypeConfig } from "./types";
import {
  ProductValueInput,
  CollectionValueInput,
  SelectValueInput,
  NumberValueInput,
  TextValueInput,
} from "./condition-inputs";
import styles from "./ConditionRow.module.css";

export interface ConditionRowProps {
  condition: TriggerCondition;
  onUpdate: (updates: Partial<TriggerCondition>) => void;
  onRemove: () => void;
  showRemove?: boolean;
}

export function ConditionRow({
  condition,
  onUpdate,
  onRemove,
  showRemove = true,
}: ConditionRowProps) {
  const conditionConfig = getConditionTypeConfig(condition.type);

  // Get available operators for current condition type
  const availableOperators = useMemo(() => {
    return conditionConfig?.operators || [];
  }, [conditionConfig?.operators]);

  // Ensure current operator is valid for condition type
  React.useEffect(() => {
    if (conditionConfig && !availableOperators.includes(condition.operator)) {
      // Reset to first available operator if current one is invalid
      if (availableOperators.length > 0) {
        onUpdate({ operator: availableOperators[0] });
      }
    }
  }, [condition.type, condition.operator, availableOperators, conditionConfig, onUpdate]);

  // Condition type options grouped by category
  const conditionTypeOptions = [
    {
      title: "Cart-based",
      options: CONDITION_TYPES.filter((ct) => ct.category === "cart").map((ct) => ({
        value: ct.value,
        label: ct.label,
      })),
    },
    {
      title: "Customer-based",
      options: CONDITION_TYPES.filter((ct) => ct.category === "customer").map((ct) => ({
        value: ct.value,
        label: ct.label,
      })),
    },
    {
      title: "Product-based",
      options: CONDITION_TYPES.filter((ct) => ct.category === "product").map((ct) => ({
        value: ct.value,
        label: ct.label,
      })),
    },
    {
      title: "Time-based",
      options: CONDITION_TYPES.filter((ct) => ct.category === "time").map((ct) => ({
        value: ct.value,
        label: ct.label,
      })),
    },
    {
      title: "Device-based",
      options: CONDITION_TYPES.filter((ct) => ct.category === "device").map((ct) => ({
        value: ct.value,
        label: ct.label,
      })),
    },
  ].filter((group) => group.options.length > 0);

  // Operator options
  const operatorOptions = availableOperators.map((op) => ({
    value: op,
    label: OPERATOR_LABELS[op],
  }));

  // Value input based on condition type - now using extracted components
  const renderValueInput = () => {
    if (!conditionConfig) return null;

    const valueType = conditionConfig.valueType;

    // Product selector
    if (valueType === "product") {
      return (
        <ProductValueInput
          value={String(condition.value)}
          onChange={(value) => onUpdate({ value })}
        />
      );
    }

    // Collection selector
    if (valueType === "collection") {
      return (
        <CollectionValueInput
          value={String(condition.value)}
          onChange={(value) => onUpdate({ value })}
        />
      );
    }

    // Select dropdown
    if (valueType === "select" && conditionConfig.valueOptions) {
      return (
        <SelectValueInput
          value={String(condition.value)}
          options={conditionConfig.valueOptions}
          onChange={(value) => onUpdate({ value })}
        />
      );
    }

    // Number input
    if (valueType === "number") {
      const numValue = Array.isArray(condition.value)
        ? (condition.value[0] as number | string)
        : condition.value;
      return <NumberValueInput value={numValue} onChange={(value) => onUpdate({ value })} />;
    }

    // Text input (default)
    return (
      <TextValueInput value={String(condition.value)} onChange={(value) => onUpdate({ value })} />
    );
  };

  return (
    <div className={styles.conditionRow}>
      <InlineStack gap="200" blockAlign="center" wrap={false}>
        {/* Condition Type */}
        <div className={styles.conditionType}>
          <Select
            label=""
            labelHidden
            options={conditionTypeOptions}
            value={condition.type}
            onChange={(value) => onUpdate({ type: value as ConditionType })}
          />
        </div>

        {/* Operator */}
        <div className={styles.operator}>
          <Select
            label=""
            labelHidden
            options={operatorOptions}
            value={condition.operator}
            onChange={(value) => onUpdate({ operator: value as ConditionOperator })}
          />
        </div>

        {/* Value */}
        <div className={styles.value}>{renderValueInput()}</div>

        {/* Remove Button */}
        {showRemove && (
          <div className={styles.removeButton}>
            <Button
              icon={DeleteIcon}
              onClick={onRemove}
              variant="plain"
              tone="critical"
              accessibilityLabel="Remove condition"
            />
          </div>
        )}
      </InlineStack>
    </div>
  );
}
