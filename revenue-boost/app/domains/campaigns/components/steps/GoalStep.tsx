/**
 * GoalStep - Campaign goal selection and basic info
 */

import { Card, BlockStack, TextField } from "@shopify/polaris";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import { GoalCard } from "../GoalCard";
import { GOAL_OPTIONS } from "../../config/goal-options.config";

interface GoalStepProps {
  data: Partial<CampaignFormData>;
  onChange: (updates: Partial<CampaignFormData>) => void;
  storeId: string;
}

export function GoalStep({ data, onChange }: GoalStepProps) {
  const goals = Object.values(GOAL_OPTIONS);

  return (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <TextField
            label="Campaign Name"
            value={data.name || ""}
            onChange={(value) => onChange({ name: value })}
            placeholder="Summer Sale Campaign"
            autoComplete="off"
            requiredIndicator
          />

          <TextField
            label="Description"
            value={data.description || ""}
            onChange={(value) => onChange({ description: value })}
            placeholder="Describe your campaign..."
            multiline={3}
            autoComplete="off"
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={data.goal === goal.id}
                onSelect={() => onChange({ goal: goal.id })}
              />
            ))}
          </div>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

