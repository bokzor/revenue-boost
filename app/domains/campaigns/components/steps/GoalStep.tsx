/**
 * GoalStep - Campaign goal selection and basic info
 *
 * REFACTORED: Now uses Context API instead of prop drilling
 * - No need to pass data/onChange props
 * - Direct access to form state via context
 * - Cleaner component interface
 */

import { Card, BlockStack, TextField } from "@shopify/polaris";
import { GoalCard } from "../GoalCard";
import { GOAL_OPTIONS } from "../../config/goal-options.config";
import { useFormField, useStoreInfo } from "../../context/CampaignFormContext";

// Props interface kept for backward compatibility
// Can be removed once all usages are updated
interface GoalStepProps {
  data?: any;
  onChange?: any;
  storeId?: string;
}

export function GoalStep(_props?: GoalStepProps) {
  // Use context hooks instead of props
  const { storeId } = useStoreInfo();
  const [name, setName] = useFormField("name");
  const [description, setDescription] = useFormField("description");
  const [goal, setGoal] = useFormField("goal");

  const goals = Object.values(GOAL_OPTIONS);

  return (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <TextField
            label="Campaign Name"
            value={name || ""}
            onChange={setName}
            placeholder="Summer Sale Campaign"
            autoComplete="off"
            requiredIndicator
          />

          <TextField
            label="Description"
            value={description || ""}
            onChange={setDescription}
            placeholder="Describe your campaign..."
            multiline={3}
            autoComplete="off"
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {goals.map((goalOption) => (
              <GoalCard
                key={goalOption.id}
                goal={goalOption}
                isSelected={goal === goalOption.id}
                onSelect={() => setGoal(goalOption.id)}
              />
            ))}
          </div>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

