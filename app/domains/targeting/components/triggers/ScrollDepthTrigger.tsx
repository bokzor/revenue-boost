/**
 * ScrollDepthTrigger - Scroll depth tracking configuration
 *
 * Single Responsibility: Configure scroll depth trigger settings
 */

import {
  Text,
  FormLayout,
  Box,
  RangeSlider,
  ChoiceList,
  TextField,
  Checkbox,
} from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface ScrollDepthTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function ScrollDepthTrigger({ config, onChange }: ScrollDepthTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      scroll_depth: {
        enabled: false,
        ...(typeof config.scroll_depth === "object" && config.scroll_depth !== null
          ? config.scroll_depth
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Scroll Depth Tracking"
      enabled={config.scroll_depth?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <FormLayout>
        <Box>
          <Text as="p" variant="bodyMd">
            Scroll Depth: {config.scroll_depth?.depth_percentage || 50}%
          </Text>
          <RangeSlider
            label="Trigger at scroll depth"
            value={config.scroll_depth?.depth_percentage || 50}
            onChange={(value) => updateConfig({ depth_percentage: value })}
            output
            min={10}
            max={100}
            step={5}
          />
        </Box>

        <ChoiceList
          title="Scroll direction"
          choices={[
            { label: "Scrolling down", value: "down" },
            { label: "Scrolling up", value: "up" },
            { label: "Both directions", value: "both" },
          ]}
          selected={[config.scroll_depth?.direction || "down"]}
          onChange={(selected) => updateConfig({ direction: selected[0] })}
        />

        <TextField
          autoComplete="off"
          label="Debounce time (milliseconds)"
          type="number"
          value={config.scroll_depth?.debounce_time?.toString() ?? ""}
          onChange={(value) => updateConfig({ debounce_time: value === "" ? undefined : parseInt(value) })}
          helpText="Delay between scroll events to prevent excessive triggering"
          placeholder="500"
        />

        <Checkbox
          label="Require user engagement first"
          checked={config.scroll_depth?.require_engagement || false}
          onChange={(checked) => updateConfig({ require_engagement: checked })}
          helpText="Only trigger after user has interacted with the page"
        />
      </FormLayout>
    </TriggerCard>
  );
}
