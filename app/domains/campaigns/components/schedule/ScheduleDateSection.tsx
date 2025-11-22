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
  timezone?: string; // IANA timezone (e.g., "America/New_York")
  onStartDateChange: (date?: string) => void;
  onEndDateChange: (date?: string) => void;
}

export function ScheduleDateSection({
  startDate,
  endDate,
  timezone,
  onStartDateChange,
  onEndDateChange,
}: ScheduleDateSectionProps) {
  const dateRangeText = formatDateRange(startDate, endDate, timezone);
  const currentTime = timezone
    ? new Date().toLocaleString("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Campaign Schedule
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          Optionally set start and end dates for your campaign. Leave blank to run indefinitely.
        </Text>

        {timezone && (
          <Banner tone="info">
            <Text as="p" variant="bodySm">
              All times are in your shop's timezone: <strong>{timezone}</strong> (Current time: {currentTime})
            </Text>
          </Banner>
        )}

        <FormLayout>
          <InlineStack gap="400">
            <Box minWidth="200px">
              <TextField
                label="Start Date (Optional)"
                type="datetime-local"
                value={formatDateForInput(startDate, timezone)}
                onChange={(value) => onStartDateChange(value || undefined)}
                autoComplete="off"
                helpText="When the campaign becomes active"
              />
            </Box>
            <Box minWidth="200px">
              <TextField
                label="End Date (Optional)"
                type="datetime-local"
                value={formatDateForInput(endDate, timezone)}
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

