/**
 * GoalOptionCard - Individual Goal Card Component
 *
 * SOLID Compliance:
 * - Single Responsibility: Renders a single goal option card
 * - <50 lines
 * - Extracted from GoalSelectorV2
 */

import { Text, Badge, Icon, InlineStack, BlockStack } from "@shopify/polaris";
import type { GoalOption } from "../../config/goal-options";
import { getDifficultyColor } from "../../config/goal-options";
import styles from "../GoalSelectorV2.module.css";

interface GoalOptionCardProps {
  option: GoalOption;
  isSelected: boolean;
  onClick: () => void;
}

export function GoalOptionCard({ option, isSelected, onClick }: GoalOptionCardProps) {
  const IconComponent = option.icon;

  return (
    <div className={styles.cardWrapper}>
      <button
        className={`${styles.goalCard} ${isSelected ? styles.selected : ""}`}
        onClick={onClick}
        aria-pressed={isSelected}
        data-testid={`goal-${option.id.toLowerCase().replace("_", "-")}`}
      >
        {isSelected && (
          <div className={styles.selectedBadge}>
            <span className={styles.checkmark}>✓</span>
          </div>
        )}

        {option.badge && (
          <div className={styles.bottomBadge}>
            <Badge tone="success">{option.badge}</Badge>
          </div>
        )}

        <BlockStack gap="400">
          <InlineStack gap="300" blockAlign="center">
            <div
              className={styles.iconWrapper}
              style={{ backgroundColor: `${option.iconColor}15` }}
            >
              <div style={{ color: option.iconColor }}>
                <Icon source={IconComponent as any} />
              </div>
            </div>
            <BlockStack gap="100">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                {option.title}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {option.subtitle}
              </Text>
            </BlockStack>
          </InlineStack>

          <Text as="p" variant="bodyMd">
            {option.description}
          </Text>

          <div className={styles.benefitsContainer}>
            {option.benefits.map((benefit, index) => (
              <div key={index} className={styles.benefitPill}>
                <Text as="span" variant="bodySm">
                  ✓ {benefit}
                </Text>
              </div>
            ))}
          </div>

          <InlineStack align="space-between" blockAlign="center">
            <div className={styles.metrics}>
              <Text as="span" variant="bodySm" fontWeight="semibold">
                📊 {option.metrics}
              </Text>
            </div>
            <Badge tone={getDifficultyColor(option.difficulty)} size="small">
              {option.difficulty}
            </Badge>
          </InlineStack>
        </BlockStack>
      </button>
    </div>
  );
}

