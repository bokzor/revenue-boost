/**
 * Schedule Step Content Component
 *
 * Extracted from CampaignFormWithABTesting to follow SOLID principles:
 * - Single Responsibility: Only renders schedule step content
 * - Separation of Concerns: Isolated from parent form logic
 */

import { ScheduleSettingsStep } from "../ScheduleSettingsStep";

interface ScheduleStepContentProps {
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  priority?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  onConfigChange: (config: {
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
    priority?: number;
    startDate?: string;
    endDate?: string;
    tags?: string[];
  }) => void;
}

export function ScheduleStepContent({
  status,
  priority,
  startDate,
  endDate,
  tags,
  onConfigChange,
}: ScheduleStepContentProps) {
  return (
    <ScheduleSettingsStep
      config={{
        status,
        priority,
        startDate,
        endDate,
        tags,
      }}
      onConfigChange={onConfigChange}
    />
  );
}
