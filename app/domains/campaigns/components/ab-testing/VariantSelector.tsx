/**
 * VariantSelector - Variant Selection Component
 * 
 * SOLID Compliance:
 * - Single Responsibility: Renders variant selection buttons
 * - <50 lines
 * - Extracted from CampaignFormWithABTesting
 */

import { Button, ButtonGroup, InlineStack, Text } from "@shopify/polaris";

export type VariantKey = "A" | "B" | "C" | "D";

interface VariantSelectorProps {
  selectedVariant: VariantKey;
  onSelect: (variant: VariantKey) => void;
  variantCount: number;
}

export function VariantSelector({
  selectedVariant,
  onSelect,
  variantCount,
}: VariantSelectorProps) {
  const variants = (["A", "B", "C", "D"] as VariantKey[]).slice(0, variantCount);

  return (
    <InlineStack gap="300" blockAlign="center">
      <Text as="span" variant="bodyMd" fontWeight="medium">
        Editing:
      </Text>
      <ButtonGroup variant="segmented">
        {variants.map((variant, index) => (
          <Button
            key={variant}
            pressed={selectedVariant === variant}
            onClick={() => onSelect(variant)}
          >
            Variant {variant} {index === 0 ? "(Control)" : ""}
          </Button>
        ))}
      </ButtonGroup>
    </InlineStack>
  );
}

