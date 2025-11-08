/**
 * TargetingStep - Audience targeting and triggers
 */

import { Card, BlockStack, Text } from "@shopify/polaris";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

interface TargetingStepProps {
  data: Partial<CampaignFormData>;
  onChange: (updates: Partial<CampaignFormData>) => void;
}

export function TargetingStep(): JSX.Element {
  // Placeholder for targeting configuration
  // TODO: Integrate targeting editors
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Targeting Configuration
        </Text>
        <Text as="p" tone="subdued">
          Targeting editors will be integrated here.
        </Text>
      </BlockStack>
    </Card>
  );
}

