/**
 * AddVariantCard Component
 *
 * A card that allows adding a new variant to the experiment.
 */

import { BlockStack, Text, Box, Icon } from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";

interface AddVariantCardProps {
  onClick: () => void;
}

export function AddVariantCard({ onClick }: AddVariantCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: "12px",
        border: "2px dashed var(--p-color-border)",
        backgroundColor: "var(--p-color-bg-surface-secondary)",
        overflow: "hidden",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "140px",
      }}
    >
      <Box padding="400">
        <BlockStack gap="200" inlineAlign="center">
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "var(--p-color-bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--p-color-border)",
            }}
          >
            <Icon source={PlusIcon} />
          </div>
          <Text as="span" tone="subdued">
            Add Variant
          </Text>
        </BlockStack>
      </Box>
    </div>
  );
}

