/**
 * ExperimentConfigForm - Experiment Configuration Form Component
 *
 * SOLID Compliance:
 * - Single Responsibility: Renders experiment configuration fields
 * - <50 lines
 * - Extracted from CampaignFormWithABTesting
 */

import {
  BlockStack,
  Text,
  TextField,
  FormLayout,
  Button,
  ButtonGroup,
  InlineStack,
} from "@shopify/polaris";

interface ExperimentConfigFormProps {
  experimentName: string;
  experimentDescription: string;
  experimentHypothesis: string;
  variantCount: number;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onHypothesisChange: (value: string) => void;
  onVariantCountChange: (count: number) => void;
}

export function ExperimentConfigForm({
  experimentName,
  experimentDescription,
  experimentHypothesis,
  variantCount,
  onNameChange,
  onDescriptionChange,
  onHypothesisChange,
  onVariantCountChange,
}: ExperimentConfigFormProps) {
  return (
    <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px" }}>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Experiment Configuration
        </Text>
        <FormLayout>
          <TextField
            label="Experiment Name"
            value={experimentName}
            onChange={onNameChange}
            placeholder="e.g., Homepage Hero Test"
            autoComplete="off"
            requiredIndicator
          />
          <TextField
            label="Hypothesis"
            value={experimentHypothesis}
            onChange={onHypothesisChange}
            placeholder="e.g., Changing the CTA color to green will increase conversions by 10%"
            multiline={2}
            autoComplete="off"
          />
          <TextField
            label="Description"
            value={experimentDescription}
            onChange={onDescriptionChange}
            placeholder="Describe what you're testing and why"
            multiline={2}
            autoComplete="off"
          />
        </FormLayout>

        <InlineStack gap="400">
          <div style={{ flex: 1 }}>
            <Text as="p" variant="bodyMd" fontWeight="medium">
              Number of Variants: {variantCount}
            </Text>
            <div style={{ marginTop: "8px" }}>
              <ButtonGroup variant="segmented">
                {[2, 3, 4].map((count) => (
                  <Button
                    key={count}
                    pressed={variantCount === count}
                    onClick={() => onVariantCountChange(count)}
                  >
                    {`${count} Variants`}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>
        </InlineStack>
      </BlockStack>
    </div>
  );
}
