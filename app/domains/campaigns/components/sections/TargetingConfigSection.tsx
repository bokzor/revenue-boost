/**
 * Targeting Configuration Section
 *
 * Form section for configuring campaign targeting rules
 * Includes enhanced triggers and audience targeting
 */

import { CheckboxField, TextField, SelectField, FormGrid, FormSection } from "../form";
import type { TargetRulesConfig } from "../../types/campaign";
import { useNestedFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export interface TargetingConfigSectionProps {
  targetRules: Partial<TargetRulesConfig>;
  errors?: Record<string, string>;
  onChange: (targetRules: Partial<TargetRulesConfig>) => void;
}

export function TargetingConfigSection({ targetRules, onChange }: TargetingConfigSectionProps) {
  const triggers = targetRules.enhancedTriggers || {};

  const updateTrigger = useNestedFieldUpdater<TargetRulesConfig, "enhancedTriggers">(
    targetRules,
    onChange,
    "enhancedTriggers"
  );

  return (
    <>
      <FormSection title="Page Load Trigger" collapsible defaultOpen={false}>
        <CheckboxField
          label="Enable Page Load Trigger"
          name="triggers.page_load.enabled"
          checked={triggers.page_load?.enabled || false}
          helpText="Show popup when page loads"
          onChange={(checked) => updateTrigger("page_load", { enabled: checked })}
        />

        {triggers.page_load?.enabled && (
          <FormGrid columns={2}>
            <TextField
              label="Delay (ms)"
              name="triggers.page_load.delay"
              value={triggers.page_load.delay?.toString() || "0"}
              placeholder="0"
              helpText="Delay before showing popup"
              onChange={(value) => updateTrigger("page_load", { delay: parseInt(value) || 0 })}
            />

            <CheckboxField
              label="Require DOM Ready"
              name="triggers.page_load.require_dom_ready"
              checked={triggers.page_load.require_dom_ready || false}
              onChange={(checked) => updateTrigger("page_load", { require_dom_ready: checked })}
            />
          </FormGrid>
        )}
      </FormSection>

      <FormSection title="Exit Intent Trigger" collapsible defaultOpen={false}>
        <CheckboxField
          label="Enable Exit Intent"
          name="triggers.exit_intent.enabled"
          checked={triggers.exit_intent?.enabled || false}
          helpText="Show popup when user is about to leave"
          onChange={(checked) => updateTrigger("exit_intent", { enabled: checked })}
        />

        {triggers.exit_intent?.enabled && (
          <FormGrid columns={2}>
            <SelectField
              label="Sensitivity"
              name="triggers.exit_intent.sensitivity"
              value={triggers.exit_intent.sensitivity || "medium"}
              options={[
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
              ]}
              onChange={(value) =>
                updateTrigger("exit_intent", {
                  sensitivity: value as "low" | "medium" | "high",
                })
              }
            />

            <CheckboxField
              label="Enable on Mobile"
              name="triggers.exit_intent.mobile_enabled"
              checked={triggers.exit_intent.mobile_enabled || false}
              onChange={(checked) => updateTrigger("exit_intent", { mobile_enabled: checked })}
            />
          </FormGrid>
        )}
      </FormSection>

      <FormSection title="Time Delay Trigger" collapsible defaultOpen={false}>
        <CheckboxField
          label="Enable Time Delay"
          name="triggers.time_delay.enabled"
          checked={triggers.time_delay?.enabled || false}
          helpText="Show popup after specified time"
          onChange={(checked) => updateTrigger("time_delay", { enabled: checked })}
        />

        {triggers.time_delay?.enabled && (
          <TextField
            label="Delay (seconds)"
            name="triggers.time_delay.delay"
            value={triggers.time_delay.delay?.toString() || "5"}
            placeholder="5"
            helpText="Time to wait before showing popup"
            onChange={(value) => updateTrigger("time_delay", { delay: parseInt(value) || 5 })}
          />
        )}
      </FormSection>

      <FormSection title="Scroll Depth Trigger" collapsible defaultOpen={false}>
        <CheckboxField
          label="Enable Scroll Depth"
          name="triggers.scroll_depth.enabled"
          checked={triggers.scroll_depth?.enabled || false}
          helpText="Show popup when user scrolls to certain depth"
          onChange={(checked) => updateTrigger("scroll_depth", { enabled: checked })}
        />

        {triggers.scroll_depth?.enabled && (
          <TextField
            label="Scroll Percentage"
            name="triggers.scroll_depth.depth_percentage"
            value={triggers.scroll_depth.depth_percentage?.toString() || "50"}
            placeholder="50"
            helpText="Percentage of page scrolled (0-100)"
            onChange={(value) =>
              updateTrigger("scroll_depth", { depth_percentage: parseInt(value) || 50 })
            }
          />
        )}
      </FormSection>

      <FormSection title="Cart Triggers" collapsible defaultOpen={false}>
        <CheckboxField
          label="Add to Cart Trigger"
          name="triggers.add_to_cart.enabled"
          checked={triggers.add_to_cart?.enabled || false}
          helpText="Show popup when item is added to cart"
          onChange={(checked) => updateTrigger("add_to_cart", { enabled: checked })}
        />

        <CheckboxField
          label="Cart Value Trigger"
          name="triggers.cart_value.enabled"
          checked={triggers.cart_value?.enabled || false}
          helpText="Show popup when cart reaches certain value"
          onChange={(checked) => updateTrigger("cart_value", { enabled: checked })}
        />

        {triggers.cart_value?.enabled && (
          <TextField
            label="Minimum Cart Value"
            name="triggers.cart_value.minValue"
            value={triggers.cart_value.minValue?.toString() || ""}
            placeholder="50.00"
            helpText="Minimum cart value to trigger popup"
            onChange={(value) => updateTrigger("cart_value", { minValue: parseFloat(value) || 0 })}
          />
        )}
      </FormSection>
    </>
  );
}
