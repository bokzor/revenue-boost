/**
 * ExperimentConfigForm - Experiment Configuration Form Component
 *
 * Enhanced with help text, examples, best practices guidance,
 * and inline tips for first-time users.
 *
 * Includes the variant selector for a consolidated control experience.
 */

import {
  BlockStack,
  Text,
  TextField,
  FormLayout,
  Button,
  ButtonGroup,
  InlineStack,
  Banner,
  Box,
  Icon,
  Tooltip,
  Divider,
} from "@shopify/polaris";
import { QuestionCircleIcon, TargetIcon, EditIcon } from "@shopify/polaris-icons";

export type VariantKey = "A" | "B" | "C" | "D";

interface ExperimentConfigFormProps {
  experimentName: string;
  experimentDescription: string;
  experimentHypothesis: string;
  variantCount: number;
  selectedVariant: VariantKey;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onHypothesisChange: (value: string) => void;
  onVariantCountChange: (count: number) => void;
  onVariantSelect: (variant: VariantKey) => void;
}

// Example hypotheses to help users
const HYPOTHESIS_EXAMPLES = [
  "A larger CTA button will increase click-through rate by 15%",
  "Adding urgency text will improve conversion rate by 20%",
  "A shorter headline will lead to more email signups",
  "Green button color will outperform the current blue",
];

export function ExperimentConfigForm({
  experimentName,
  experimentDescription,
  experimentHypothesis,
  variantCount,
  selectedVariant,
  onNameChange,
  onDescriptionChange,
  onHypothesisChange,
  onVariantCountChange,
  onVariantSelect,
}: ExperimentConfigFormProps) {
  // Get a random example for the placeholder
  const exampleHypothesis = HYPOTHESIS_EXAMPLES[0];

  const variants = (["A", "B", "C", "D"] as VariantKey[]).slice(0, variantCount);

  return (
    <BlockStack gap="500">
      {/* VARIANT CONFIGURATION - All variant controls in one place */}
      <Box
        padding="400"
        background="bg-surface-info"
        borderRadius="300"
        borderColor="border-info"
        borderWidth="025"
      >
        <BlockStack gap="500">
          {/* Header */}
          <InlineStack gap="300" blockAlign="center">
            <Box background="bg-fill-info" padding="200" borderRadius="200">
              <Icon source={EditIcon} tone="info" />
            </Box>
            <BlockStack gap="050">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Variant Configuration
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Choose how many variants to test and which one to edit
              </Text>
            </BlockStack>
          </InlineStack>

          {/* Number of Variants */}
          <BlockStack gap="300">
            <InlineStack gap="200" blockAlign="center">
              <Text as="h4" variant="headingSm" fontWeight="semibold">
                Number of Variants
              </Text>
              <Tooltip content="Each variant is a different version of your popup. Variant A is always the control (original). More variants require more traffic to reach statistical significance.">
                <Icon source={QuestionCircleIcon} tone="subdued" />
              </Tooltip>
            </InlineStack>

            <InlineStack gap="400" align="start" blockAlign="center" wrap>
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

              <Text as="p" variant="bodySm" tone="subdued">
                {variantCount === 2 && (
                  <>✅ <strong>Recommended</strong> — Best for most tests</>
                )}
                {variantCount === 3 && (
                  <>Good for testing multiple ideas — needs ~50% more traffic</>
                )}
                {variantCount === 4 && (
                  <>For high-traffic sites only — needs 2x more traffic</>
                )}
              </Text>
            </InlineStack>
          </BlockStack>

          <Divider />

          {/* Currently Editing */}
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm" fontWeight="semibold">
              Currently Editing
            </Text>

            <ButtonGroup variant="segmented" fullWidth>
              {variants.map((variant, index) => (
                <Button
                  key={variant}
                  pressed={selectedVariant === variant}
                  onClick={() => onVariantSelect(variant)}
                  size="large"
                  tone={selectedVariant === variant ? "success" : undefined}
                >
                  {index === 0 ? `Variant ${variant} (Control)` : `Variant ${variant}`}
                </Button>
              ))}
            </ButtonGroup>

            <Text as="p" variant="bodySm" tone="subdued">
              💡 Design each variant with different content, then compare their performance.
              The control (Variant A) is your baseline.
            </Text>
          </BlockStack>
        </BlockStack>
      </Box>

      <Divider />

      {/* Section Header with Icon */}
      <InlineStack gap="300" blockAlign="center">
        <Box background="bg-fill-info" padding="200" borderRadius="200">
          <Icon source={TargetIcon} tone="info" />
        </Box>
        <BlockStack gap="100">
          <Text as="h3" variant="headingMd" fontWeight="bold">
            Experiment Details
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Define what you&apos;re testing and your expected outcome
          </Text>
        </BlockStack>
      </InlineStack>

      {/* Quick Start Tips Banner */}
      <Banner tone="info" title="Quick tips for effective A/B tests">
        <BlockStack gap="200">
          <Text as="p" variant="bodySm">
            • <strong>Name clearly</strong> — Include what you&apos;re testing and the date (e.g., &quot;CTA Color Test - Jan 2025&quot;)
          </Text>
          <Text as="p" variant="bodySm">
            • <strong>Write a specific hypothesis</strong> — Predict the outcome with a measurable goal
          </Text>
          <Text as="p" variant="bodySm">
            • <strong>Start with 2 variants</strong> — More variants need more traffic to reach significance
          </Text>
        </BlockStack>
      </Banner>

      <FormLayout>
        {/* Experiment Name Field */}
        <TextField
          label={
            <InlineStack gap="100" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="medium">
                Experiment Name
              </Text>
              <Tooltip content="A clear, descriptive name helps you find and reference this experiment later. Include what you're testing.">
                <Icon source={QuestionCircleIcon} tone="subdued" />
              </Tooltip>
            </InlineStack>
          }
          value={experimentName}
          onChange={onNameChange}
          placeholder="e.g., Homepage Hero CTA Test - January 2025"
          autoComplete="off"
          requiredIndicator
          helpText="Use a descriptive name that includes what you're testing and when"
        />

        {/* Hypothesis Field */}
        <TextField
          label={
            <InlineStack gap="100" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="medium">
                Hypothesis
              </Text>
              <Tooltip content="Your hypothesis is a prediction about what will happen. It should be specific and measurable so you can verify if the test was successful.">
                <Icon source={QuestionCircleIcon} tone="subdued" />
              </Tooltip>
            </InlineStack>
          }
          value={experimentHypothesis}
          onChange={onHypothesisChange}
          placeholder={`e.g., "${exampleHypothesis}"`}
          multiline={2}
          autoComplete="off"
          helpText={
            <BlockStack gap="100">
              <Text as="span" variant="bodySm" tone="subdued">
                Write a clear prediction with a measurable outcome. Good format: &quot;[Change] will [improve/increase/decrease] [metric] by [X%]&quot;
              </Text>
            </BlockStack>
          }
        />

        {/* Description Field */}
        <TextField
          label={
            <InlineStack gap="100" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="medium">
                Description
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                (Optional)
              </Text>
            </InlineStack>
          }
          value={experimentDescription}
          onChange={onDescriptionChange}
          placeholder="Describe the context, goals, and any relevant background for this test"
          multiline={2}
          autoComplete="off"
          helpText="Document why you're running this test and what insights you hope to gain"
        />
      </FormLayout>
    </BlockStack>
  );
}
