/**
 * Targeting Step Content Component
 * 
 * Extracted from CampaignFormWithABTesting to follow SOLID principles:
 * - Single Responsibility: Only renders targeting step content
 * - Separation of Concerns: Isolated from parent form logic
 */

import { Card, BlockStack, Text } from "@shopify/polaris";
import { AdvancedTriggersEditor } from "~/domains/targeting/components/AdvancedTriggersEditor";
import { AudienceTargetingPanel } from "~/domains/targeting/components/AudienceTargetingPanel";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import type { AudienceTargetingConfig } from "~/domains/targeting/components/AudienceTargetingPanel";

interface TargetingStepContentProps {
  storeId: string;
  enhancedTriggers: EnhancedTriggerConfig;
  audienceTargeting: AudienceTargetingConfig;
  onTriggersChange: (config: EnhancedTriggerConfig) => void;
  onAudienceChange: (config: AudienceTargetingConfig) => void;
}

export function TargetingStepContent({
  storeId,
  enhancedTriggers,
  audienceTargeting,
  onTriggersChange,
  onAudienceChange,
}: TargetingStepContentProps) {
  return (
    <BlockStack gap="600">
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            When to Show (Triggers)
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Configure when your campaign should appear to visitors.
          </Text>
          <AdvancedTriggersEditor
            config={enhancedTriggers || {}}
            onChange={onTriggersChange}
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Who to Show To (Audience)
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Define who should see your campaign based on behavior, location, and other criteria.
          </Text>
          <AudienceTargetingPanel
            storeId={storeId}
            config={audienceTargeting}
            onConfigChange={onAudienceChange}
          />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

