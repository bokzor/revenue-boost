/**
 * A/B Testing Configuration Section
 *
 * Form section for configuring A/B testing experiments
 */

import { CheckboxField, TextField, SelectField, FormGrid } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export interface ABTestingConfig {
  enableABTesting: boolean;
  experimentName?: string;
  variantKey?: "A" | "B" | "C" | "D";
  isControl?: boolean;
  trafficAllocation?: number;
}

export interface ABTestingSectionProps {
  config: ABTestingConfig;
  errors?: Record<string, string>;
  onChange: (config: ABTestingConfig) => void;
}

export function ABTestingSection({ config, errors, onChange }: ABTestingSectionProps) {
  const updateField = useFieldUpdater(
    config as unknown as Partial<Record<string, unknown>>,
    onChange as unknown as (updated: Partial<Record<string, unknown>>) => void
  );

  return (
    <>
      <CheckboxField
        label="Enable A/B Testing"
        name="abTesting.enabled"
        checked={config.enableABTesting || false}
        helpText="Create this campaign as part of an A/B test experiment"
        onChange={(checked) => updateField("enableABTesting", checked)}
      />

      {config.enableABTesting && (
        <>
          <TextField
            label="Experiment Name"
            name="abTesting.experimentName"
            value={config.experimentName || ""}
            error={errors?.experimentName}
            required
            placeholder="Newsletter Headline Test"
            helpText="Name for this A/B test experiment"
            onChange={(value) => updateField("experimentName", value)}
          />

          <FormGrid columns={2}>
            <SelectField
              label="Variant"
              name="abTesting.variantKey"
              value={config.variantKey || "A"}
              required
              options={[
                { label: "Variant A", value: "A" },
                { label: "Variant B", value: "B" },
                { label: "Variant C", value: "C" },
                { label: "Variant D", value: "D" },
              ]}
              helpText="Which variant is this campaign?"
              onChange={(value) =>
                updateField("variantKey", value as ABTestingConfig["variantKey"])
              }
            />

            <TextField
              label="Traffic Allocation (%)"
              name="abTesting.trafficAllocation"
              value={config.trafficAllocation?.toString() || "50"}
              placeholder="50"
              helpText="Percentage of traffic for this variant (0-100)"
              onChange={(value) => updateField("trafficAllocation", parseInt(value) || 50)}
            />
          </FormGrid>

          <CheckboxField
            label="Set as Control"
            name="abTesting.isControl"
            checked={config.isControl || false}
            helpText="Mark this variant as the control (baseline) for comparison"
            onChange={(checked) => updateField("isControl", checked)}
          />

          <s-banner tone="info">
            <p>
              <strong>A/B Testing Tips:</strong>
            </p>
            <ul>
              <li>Create multiple campaigns with the same experiment name</li>
              <li>Assign different variant keys (A, B, C, D) to each</li>
              <li>Ensure traffic allocation adds up to 100% across all variants</li>
              <li>Mark one variant as the control for baseline comparison</li>
            </ul>
          </s-banner>
        </>
      )}
    </>
  );
}
