/**
 * GoalCard - Reusable goal selection card
 */

import React from "react";
import { Card, Text, Badge, Icon, InlineStack, BlockStack } from "@shopify/polaris";
import type { GoalOption } from "../config/goal-options.config";
import { getDifficultyColor } from "../config/goal-options.config";
import styles from "./GoalCard.module.css";

interface GoalCardProps {
  goal: GoalOption;
  isSelected: boolean;
  onSelect: () => void;
}

export function GoalCard({ goal, isSelected, onSelect }: GoalCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Select ${goal.title} goal`}
    >
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="start">
            <InlineStack gap="300" blockAlign="center">
              <div className={styles.icon} style={{ backgroundColor: `${goal.iconColor}15` }}>
                <Icon source={goal.icon} tone="base" />
              </div>
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd" fontWeight="semibold">
                  {goal.title}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {goal.subtitle}
                </Text>
              </BlockStack>
            </InlineStack>

            <InlineStack gap="200">
              {goal.badge && <Badge tone="info">{goal.badge}</Badge>}
              <Badge tone={getDifficultyColor(goal.difficulty)}>{goal.difficulty}</Badge>
            </InlineStack>
          </InlineStack>

          <Text as="p" variant="bodyMd">
            {goal.description}
          </Text>

          <InlineStack gap="200" wrap>
            {goal.benefits.map((benefit) => (
              <div key={benefit} className={styles.benefit}>
                <Text as="span" variant="bodySm">
                  ✓ {benefit}
                </Text>
              </div>
            ))}
          </InlineStack>

          <Text as="span" variant="bodySm" tone="subdued">
            Expected: {goal.metrics}
          </Text>

          {isSelected && (
            <div className={styles.selectedBadge}>
              <InlineStack gap="200" blockAlign="center">
                <div className={styles.checkmark}>✓</div>
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  Selected
                </Text>
              </InlineStack>
            </div>
          )}
        </BlockStack>
      </Card>
    </div>
  );
}

