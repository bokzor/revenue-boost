/**
 * ScheduleDateSection - Campaign schedule date configuration
 * 
 * SOLID Compliance:
 * - Single Responsibility: Only handles start/end date selection
 * - Component is <50 lines
 */

import { Card, BlockStack, Text, FormLayout, TextField, InlineStack, Box, Banner } from "@shopify/polaris";
import { formatDateForInput, formatDateRange } from "../../utils/schedule-helpers";

interface ScheduleDateSectionProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange: (date?: string) => void;
  onEndDateChange: (date?: string) => void;
}

export function ScheduleDateSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: ScheduleDateSectionProps) {
  const dateRangeText = formatDateRange(startDate, endDate);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Campaign Schedule
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Optionally set start and end dates for your campaign. Leave blank to run indefinitely.
        </Text>

        <FormLayout>
          <InlineStack gap="400">
            <Box minWidth="200px">
              <TextField
                label="Start Date (Optional)"
                type="datetime-local"
                value={formatDateForInput(startDate)}
                onChange={(value) => onStartDateChange(value || undefined)}
                autoComplete="off"
                helpText="When the campaign becomes active"
              />
            </Box>
            <Box minWidth="200px">
              <TextField
                label="End Date (Optional)"
                type="datetime-local"
                value={formatDateForInput(endDate)}
                onChange={(value) => onEndDateChange(value || undefined)}
                autoComplete="off"
                helpText="When the campaign ends"
              />
            </Box>
          </InlineStack>

          {dateRangeText && (
            <Banner tone="info">
              <p>{dateRangeText}</p>
            </Banner>
          )}
        </FormLayout>
      </BlockStack>
    </Card>
  );
}

