/**
 * DesignStep - Template selection and design customization
 */

import { Card, BlockStack, Text } from "@shopify/polaris";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

interface DesignStepProps {
  data: Partial<CampaignFormData>;
  onChange: (updates: Partial<CampaignFormData>) => void;
  shopDomain?: string;
}

export function DesignStep({ data }: DesignStepProps) {
  if (!data.goal || !data.templateType) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="p" tone="subdued">
            Please select a goal first to continue with design customization.
          </Text>
        </BlockStack>
      </Card>
    );
  }

  // For now, just show a placeholder - we'll integrate the actual design editor later
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Design Configuration
        </Text>
        <Text as="p" tone="subdued">
          Design editor will be integrated here. Template type: {data.templateType}
        </Text>
      </BlockStack>
    </Card>
  );
}

