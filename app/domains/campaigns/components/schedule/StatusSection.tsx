/**
 * StatusSection - Campaign status configuration
 * 
 * SOLID Compliance:
 * - Single Responsibility: Only handles status selection and display
 * - Component is <50 lines
 */

import { Card, BlockStack, Text, FormLayout, Select, Banner } from "@shopify/polaris";
import { getStatusOptions, getStatusDescription, type CampaignStatus } from "../../utils/schedule-helpers";

interface StatusSectionProps {
  status: CampaignStatus;
  onStatusChange: (status: CampaignStatus) => void;
}

export function StatusSection({ status, onStatusChange }: StatusSectionProps) {
  const statusInfo = getStatusDescription(status);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Campaign Status
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Control whether your campaign is live, paused, or in draft mode.
        </Text>

        <FormLayout>
          <Select
            label="Status"
            options={getStatusOptions()}
            value={status}
            onChange={(value) => onStatusChange(value as CampaignStatus)}
            helpText="Choose the current state of your campaign"
          />

          <Banner tone={statusInfo.tone} title={statusInfo.title}>
            <p>{statusInfo.description}</p>
          </Banner>
        </FormLayout>
      </BlockStack>
    </Card>
  );
}

