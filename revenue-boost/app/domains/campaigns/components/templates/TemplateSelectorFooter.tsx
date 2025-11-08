/**
 * TemplateSelectorFooter - Footer for Template Selector
 * 
 * SOLID Compliance:
 * - Single Responsibility: Renders footer with template count
 * - <50 lines
 * - Extracted from TemplateSelector
 */

import { Text } from "@shopify/polaris";
import type { CampaignGoal } from "@prisma/client";
import { getGoalDisplayName } from "../../utils/goal-helpers";

interface TemplateSelectorFooterProps {
  goal: CampaignGoal;
  templateCount: number;
  hasGlobalTemplates: boolean;
  hasStoreTemplates: boolean;
}

export function TemplateSelectorFooter({
  goal,
  templateCount,
  hasGlobalTemplates,
  hasStoreTemplates,
}: TemplateSelectorFooterProps) {
  const templateTypeText =
    hasGlobalTemplates && hasStoreTemplates
      ? "(includes global and store-specific templates)"
      : hasGlobalTemplates
        ? "(global templates)"
        : "(store-specific templates)";

  return (
    <Text as="p" variant="bodySm" tone="subdued" alignment="center">
      Showing {templateCount} template{templateCount !== 1 ? "s" : ""} for{" "}
      {getGoalDisplayName(goal)} {templateTypeText}
    </Text>
  );
}

