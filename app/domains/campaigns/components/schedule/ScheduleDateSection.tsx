/**
 * ScheduleDateSection - Campaign schedule date configuration
 *
 * SOLID Compliance:
 * - Single Responsibility: Only handles start/end date selection
 * - Includes date validation (no past dates, end >= start)
 * - Feature gated behind scheduledCampaigns plan feature
 */

import { useMemo } from "react";
import {
  Card,
  BlockStack,
  Text,
  FormLayout,
  TextField,
  InlineStack,
  Box,
  Banner,
} from "@shopify/polaris";
import { formatDateForInput, formatDateRange } from "../../utils/schedule-helpers";
import { UpgradeBanner } from "~/domains/billing/components/UpgradeBanner";
import { useFeatureAccess } from "~/domains/billing/components/UpgradeBanner";

interface ScheduleDateSectionProps {
  startDate?: string;
  endDate?: string;
  timezone?: string; // IANA timezone (e.g., "America/New_York")
  onStartDateChange: (date?: string) => void;
  onEndDateChange: (date?: string) => void;
}

/**
 * Get the minimum datetime value for date inputs (current time)
 */
function getMinDateTime(timezone?: string): string {
  const now = new Date();
  if (timezone) {
    // Format for the specified timezone
    const formatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  }
  return now.toISOString().slice(0, 16);
}

/**
 * Validate schedule dates
 */
function validateScheduleDates(
  startDate?: string,
  endDate?: string,
  timezone?: string
): { startDateError?: string; endDateError?: string } {
  const errors: { startDateError?: string; endDateError?: string } = {};
  const now = new Date();

  if (startDate) {
    const start = new Date(startDate);
    if (start < now) {
      errors.startDateError = "Start date cannot be in the past";
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (end < now) {
      errors.endDateError = "End date cannot be in the past";
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      errors.endDateError = "End date must be after start date";
    }
  }

  return errors;
}

export function ScheduleDateSection({
  startDate,
  endDate,
  timezone,
  onStartDateChange,
  onEndDateChange,
}: ScheduleDateSectionProps) {
  const { hasAccess } = useFeatureAccess("scheduledCampaigns");
  const dateRangeText = formatDateRange(startDate, endDate, timezone);
  const minDateTime = useMemo(() => getMinDateTime(timezone), [timezone]);
  const validationErrors = useMemo(
    () => validateScheduleDates(startDate, endDate, timezone),
    [startDate, endDate, timezone]
  );

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

        {/* Feature gate - show upgrade banner if not on appropriate plan */}
        {!hasAccess && <UpgradeBanner feature="scheduledCampaigns" />}

        {timezone && hasAccess && (
          <Banner tone="info">
            <Text as="p" variant="bodySm">
              All times are in your shop&apos;s timezone: <strong>{timezone}</strong> (Current time:{" "}
              {currentTime})
            </Text>
          </Banner>
        )}

        {hasAccess && (
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
                  min={minDateTime}
                  error={validationErrors.startDateError}
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
                  min={startDate ? formatDateForInput(startDate, timezone) : minDateTime}
                  error={validationErrors.endDateError}
                />
              </Box>
            </InlineStack>

            {dateRangeText && !validationErrors.startDateError && !validationErrors.endDateError && (
              <Banner tone="info">
                <p>{dateRangeText}</p>
              </Banner>
            )}
          </FormLayout>
        )}
      </BlockStack>
    </Card>
  );
}
