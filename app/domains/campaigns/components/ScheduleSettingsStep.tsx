/**
 * Schedule & Settings Step - Campaign management settings (Refactored)
 *
 * SOLID Compliance:
 * - Extracted helper functions to schedule-helpers.ts
 * - Extracted tag management to TagManager component
 * - Extracted sections to focused components
 * - Main component now orchestrates sub-components
 */

import { Card, Text, BlockStack } from "@shopify/polaris";
import { type CampaignStatus } from "../utils/schedule-helpers";
import { StatusSection } from "./schedule/StatusSection";
import { PrioritySection } from "./schedule/PrioritySection";
import { ScheduleDateSection } from "./schedule/ScheduleDateSection";
import { TagManager } from "./TagManager";

interface ScheduleSettingsConfig {
  status?: CampaignStatus;
  priority?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

interface ScheduleSettingsStepProps {
  config?: ScheduleSettingsConfig;
  onConfigChange: (config: ScheduleSettingsConfig) => void;
}

export function ScheduleSettingsStep({ config, onConfigChange }: ScheduleSettingsStepProps) {
  // Initialize with defaults if not provided
  const settings: ScheduleSettingsConfig = config || {
    status: "DRAFT",
    priority: 0,
    startDate: undefined,
    endDate: undefined,
    tags: [],
  };

  const updateSettings = (updates: Partial<ScheduleSettingsConfig>) => {
    onConfigChange({ ...settings, ...updates });
  };

  return (
    <BlockStack gap="600">
      {/* Header */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Campaign Schedule & Settings
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Configure when your campaign runs, its priority, and organizational tags.
          </Text>
        </BlockStack>
      </Card>

      {/* Status Settings */}
      <StatusSection
        status={settings.status || "DRAFT"}
        onStatusChange={(status) => updateSettings({ status })}
      />

      {/* Priority Settings */}
      <PrioritySection
        priority={settings.priority || 0}
        onPriorityChange={(priority) => updateSettings({ priority })}
      />

      {/* Schedule Settings */}
      <ScheduleDateSection
        startDate={settings.startDate}
        endDate={settings.endDate}
        onStartDateChange={(startDate) => updateSettings({ startDate })}
        onEndDateChange={(endDate) => updateSettings({ endDate })}
      />

      {/* Tags Settings */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Campaign Tags
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Add tags to organize and filter your campaigns. Press Enter or click Add to create a
            tag.
          </Text>

          <TagManager tags={settings.tags} onTagsChange={(tags) => updateSettings({ tags })} />
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
