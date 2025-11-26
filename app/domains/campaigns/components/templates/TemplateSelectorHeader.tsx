/**
 * TemplateSelectorHeader - Header for Template Selector
 *
 * SOLID Compliance:
 * - Single Responsibility: Renders header with goal info
 * - <50 lines
 * - Extracted from TemplateSelector
 */

import { BlockStack, Text } from "@shopify/polaris";
import type { CampaignGoal } from "@prisma/client";
import { getGoalDisplayName } from "../../utils/goal-helpers";

interface TemplateSelectorHeaderProps {
  goal: CampaignGoal;
  isEditing: boolean;
  selectedTemplateName?: string;
}

export function TemplateSelectorHeader({
  goal,
  isEditing,
  selectedTemplateName,
}: TemplateSelectorHeaderProps) {
  return (
    <BlockStack gap="200">
      <Text as="h2" variant="headingLg">
        {isEditing ? "Current Template" : "Select a Template"}
      </Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Choose a template optimized for your goal: <strong>{getGoalDisplayName(goal)}</strong>
      </Text>
      {isEditing && selectedTemplateName && (
        <Text as="p" variant="bodyMd" tone="success">
          ✓ Currently using: <strong>{selectedTemplateName}</strong>
        </Text>
      )}
    </BlockStack>
  );
}
