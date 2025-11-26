/**
 * DeviceTargetingTrigger - Device targeting configuration
 *
 * Single Responsibility: Configure device-based targeting
 */

import { FormLayout, ChoiceList } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface DeviceTargetingTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

const DEVICE_TYPE_OPTIONS = [
  { label: "Desktop", value: "desktop" },
  { label: "Tablet", value: "tablet" },
  { label: "Mobile", value: "mobile" },
];

const OS_OPTIONS = [
  { label: "Windows", value: "windows" },
  { label: "macOS", value: "macos" },
  { label: "iOS", value: "ios" },
  { label: "Android", value: "android" },
  { label: "Linux", value: "linux" },
];

const BROWSER_OPTIONS = [
  { label: "Chrome", value: "chrome" },
  { label: "Firefox", value: "firefox" },
  { label: "Safari", value: "safari" },
  { label: "Edge", value: "edge" },
  { label: "Opera", value: "opera" },
];

const CONNECTION_OPTIONS = [
  { label: "WiFi", value: "wifi" },
  { label: "4G", value: "4g" },
  { label: "3G", value: "3g" },
  { label: "2G", value: "2g" },
  { label: "Slow 2G", value: "slow-2g" },
];

export function DeviceTargetingTrigger({ config, onChange }: DeviceTargetingTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      device_targeting: {
        enabled: false,
        ...(typeof config.device_targeting === "object" && config.device_targeting !== null
          ? config.device_targeting
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Device Targeting"
      enabled={config.device_targeting?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <FormLayout>
        <ChoiceList
          title="Device types"
          allowMultiple
          choices={DEVICE_TYPE_OPTIONS}
          selected={config.device_targeting?.device_types || ["desktop", "tablet", "mobile"]}
          onChange={(selected) => updateConfig({ device_types: selected })}
        />

        <ChoiceList
          title="Operating systems (optional)"
          allowMultiple
          choices={OS_OPTIONS}
          selected={config.device_targeting?.operating_systems || []}
          onChange={(selected) => updateConfig({ operating_systems: selected })}
        />

        <ChoiceList
          title="Browsers (optional)"
          allowMultiple
          choices={BROWSER_OPTIONS}
          selected={config.device_targeting?.browsers || []}
          onChange={(selected) => updateConfig({ browsers: selected })}
        />

        <ChoiceList
          title="Connection types (optional)"
          allowMultiple
          choices={CONNECTION_OPTIONS}
          selected={config.device_targeting?.connection_type || []}
          onChange={(selected) => updateConfig({ connection_type: selected })}
        />
      </FormLayout>
    </TriggerCard>
  );
}
