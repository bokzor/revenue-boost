import React, { useState } from "react";
import { BlockStack } from "@shopify/polaris";
import { TriggerModeSelector } from "./TriggerModeSelector";
import { QuickTriggerSetup } from "./QuickTriggerSetup";
import { AdvancedTriggersEditor } from "./AdvancedTriggersEditor";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";

interface UnifiedTriggerEditorProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
  mode?: "quick" | "advanced";
  allowModeSwitch?: boolean;
  disabled?: boolean;
}

export const UnifiedTriggerEditor: React.FC<UnifiedTriggerEditorProps> = ({
  config,
  onChange,
  mode: initialMode = "quick",
  allowModeSwitch = true,
  disabled = false,
}) => {
  const [mode, setMode] = useState<"quick" | "advanced">(initialMode);

  const handleModeChange = (newMode: "quick" | "advanced") => {
    setMode(newMode);
    // Note: We don't modify the config when switching modes
    // This preserves all settings across mode switches
  };

  return (
    <BlockStack gap="400">
      {/* Mode Selector */}
      {allowModeSwitch && (
        <TriggerModeSelector
          mode={mode}
          onModeChange={handleModeChange}
          disabled={disabled}
        />
      )}

      {/* Trigger Configuration */}
      {mode === "quick" ? (
        <QuickTriggerSetup
          config={config}
          onChange={onChange}
          disabled={disabled}
        />
      ) : (
        <AdvancedTriggersEditor config={config} onChange={onChange} />
      )}
    </BlockStack>
  );
};
