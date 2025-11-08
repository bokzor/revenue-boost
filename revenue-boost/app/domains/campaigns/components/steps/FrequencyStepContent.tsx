/**
 * Frequency Step Content Component
 * 
 * Extracted from CampaignFormWithABTesting to follow SOLID principles:
 * - Single Responsibility: Only renders frequency capping step content
 * - Separation of Concerns: Isolated from parent form logic
 */

import { FrequencyCappingPanel } from "~/domains/targeting/components/FrequencyCappingPanel";
import type { FrequencyCappingConfig } from "~/domains/targeting/components";

interface FrequencyStepContentProps {
  config: FrequencyCappingConfig;
  onConfigChange: (config: FrequencyCappingConfig) => void;
}

export function FrequencyStepContent({
  config,
  onConfigChange,
}: FrequencyStepContentProps) {
  return (
    <FrequencyCappingPanel
      config={config}
      onConfigChange={onConfigChange}
    />
  );
}

