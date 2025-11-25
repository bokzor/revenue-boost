/**
 * GoalSelectorV2 - Improved 2-column goal selection (Refactored for SOLID)
 *
 * SOLID Improvements:
 * - Extracted goal options configuration to separate file
 * - Extracted GoalOptionCard component for card rendering
 * - Extracted GoalConfirmation component
 * - Main component now <100 lines (down from 251)
 * - Better separation of concerns
 */

import { Card, Text, BlockStack, InlineGrid } from "@shopify/polaris";
import type { CampaignGoal } from "@prisma/client";
import { GOAL_OPTIONS } from "../config/goal-options";
import { GoalOptionCard } from "./goals/GoalOptionCard";
import { GoalConfirmation } from "./goals/GoalConfirmation";
import styles from "./GoalSelectorV2.module.css";

interface GoalSelectorProps {
  value?: CampaignGoal;
  onChange: (goal: CampaignGoal) => void;
  storeId: string;
}

export function GoalSelectorV2({ value, onChange }: GoalSelectorProps) {
  const selectedGoal = GOAL_OPTIONS.find((g) => g.id === value);

  return (
    <BlockStack gap="600">
      {/* Header */}
      <div className={styles.header}>
        <Text as="h2" variant="heading2xl" alignment="center">
          What&apos;s your primary goal?
        </Text>
        <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
          Choose the main objective for this campaign. We&apos;ll optimize everything for your goal.
        </Text>
      </div>

      {/* Goal Cards - 2 Column Grid */}
      <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }} gap="400">
        {GOAL_OPTIONS.map((option) => (
          <GoalOptionCard
            key={option.id}
            option={option}
            isSelected={value === option.id}
            onClick={() => onChange(option.id)}
          />
        ))}
      </InlineGrid>

      {/* Selection Confirmation */}
      {selectedGoal && <GoalConfirmation selectedGoal={selectedGoal} />}

      {/* Pro Tip */}
      <Card>
        <div className={styles.proTip}>
          <BlockStack gap="200">
            <Text as="h4" variant="headingSm" fontWeight="semibold">
              💡 Pro Tip
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Focus on one goal per campaign for maximum impact. Create separate campaigns for
              different objectives to track performance accurately and optimize each one
              independently.
            </Text>
          </BlockStack>
        </div>
      </Card>
    </BlockStack>
  );
}
