/**
 * GoalConfirmation - Goal Selection Confirmation Component
 *
 * SOLID Compliance:
 * - Single Responsibility: Shows confirmation of selected goal
 * - <50 lines
 * - Extracted from GoalSelectorV2
 */

import { Card, InlineStack, BlockStack, Text, Icon } from "@shopify/polaris";
import type { GoalOption } from "../../config/goal-options";
import styles from "../GoalSelectorV2.module.css";

interface GoalConfirmationProps {
  selectedGoal: GoalOption;
}

export function GoalConfirmation({ selectedGoal }: GoalConfirmationProps) {
  const IconComponent = selectedGoal.icon;

  return (
    <Card>
      <div className={styles.confirmationBox}>
        <InlineStack gap="400" blockAlign="center">
          <div
            className={styles.confirmationIcon}
            style={{ backgroundColor: selectedGoal.iconColor }}
          >
            <Icon source={IconComponent as any} />
          </div>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd" fontWeight="semibold">
              ✓ Goal Selected: {selectedGoal.title}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Perfect! We&apos;ve applied best practice defaults for{" "}
              <strong>{selectedGoal.title}</strong>. Continue to customize
              your campaign design and settings.
            </Text>
          </BlockStack>
        </InlineStack>
      </div>
    </Card>
  );
}

