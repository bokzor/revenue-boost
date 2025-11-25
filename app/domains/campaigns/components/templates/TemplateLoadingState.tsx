/**
 * TemplateLoadingState - Loading State for Template Selector
 *
 * SOLID Compliance:
 * - Single Responsibility: Renders loading state
 * - <50 lines
 * - Extracted from TemplateSelector
 */

import { BlockStack, Text, Spinner } from "@shopify/polaris";
import type { CampaignGoal } from "@prisma/client";
import { getGoalDisplayName } from "../../utils/goal-helpers";

interface TemplateLoadingStateProps {
  goal: CampaignGoal;
}

export function TemplateLoadingState({ goal }: TemplateLoadingStateProps) {
  return (
    <BlockStack gap="400" data-testid="template-selector">
      <BlockStack gap="200">
        <Text as="h2" variant="headingLg">
          Select a Template
        </Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          Choose a template optimized for your goal: <strong>{getGoalDisplayName(goal)}</strong>
        </Text>
      </BlockStack>

      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <Spinner size="large" />
      </div>

      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
        Loading templates...
      </Text>
    </BlockStack>
  );
}
