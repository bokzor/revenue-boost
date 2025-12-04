/**
 * VariantConfigurator Component
 *
 * Step 2 of the experiment flow.
 * Allows configuring each variant's campaign with tab navigation.
 */

import { useCallback } from "react";
import { InlineStack, Text, Button, Banner } from "@shopify/polaris";
import { ArrowLeftIcon, PlusIcon } from "@shopify/polaris-icons";
import { VariantCampaignEditor } from "./VariantCampaignEditor";
import type { StyledRecipe } from "../../../recipes/styled-recipe-types";
import type { Experiment, Variant } from "../types";
import type { CampaignData } from "../SingleCampaignFlow";

export interface VariantConfiguratorProps {
  experiment: Experiment;
  activeVariantId: string;
  onBack: () => void;
  onVariantChange: (variantId: string) => void;
  onVariantUpdate: (variant: Variant) => void;
  onAddVariant: () => void;
  recipes: StyledRecipe[];
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
}

export function VariantConfigurator({
  experiment,
  activeVariantId,
  onBack,
  onVariantChange,
  onVariantUpdate,
  onAddVariant,
  recipes,
  storeId,
  shopDomain,
  advancedTargetingEnabled,
}: VariantConfiguratorProps) {
  const activeVariant = experiment.variants.find((v) => v.id === activeVariantId);

  if (!activeVariant) {
    return <Banner tone="critical">Variant not found</Banner>;
  }

  // Handler to update variant's campaign data
  const handleCampaignDataChange = useCallback(
    (data: CampaignData) => {
      onVariantUpdate({
        ...activeVariant,
        status: "configured",
        campaignData: data,
        recipe: data.recipe,
      });
    },
    [activeVariant, onVariantUpdate]
  );

  const handleSave = useCallback(
    async (data: CampaignData) => {
      handleCampaignDataChange(data);
    },
    [handleCampaignDataChange]
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--p-color-bg-surface)" }}>
      {/* Variant Tabs Header */}
      <VariantTabsHeader
        variants={experiment.variants}
        activeVariantId={activeVariantId}
        onBack={onBack}
        onVariantChange={onVariantChange}
        onAddVariant={onAddVariant}
      />

      {/* Embedded campaign editor for active variant */}
      <VariantCampaignEditor
        key={activeVariant.id}
        variant={activeVariant}
        recipes={recipes}
        storeId={storeId}
        shopDomain={shopDomain}
        advancedTargetingEnabled={advancedTargetingEnabled}
        onSave={handleSave}
        isControlVariant={activeVariant.isControl}
      />
    </div>
  );
}

// =============================================================================
// VARIANT TABS HEADER
// =============================================================================

interface VariantTabsHeaderProps {
  variants: Variant[];
  activeVariantId: string;
  onBack: () => void;
  onVariantChange: (variantId: string) => void;
  onAddVariant: () => void;
}

function VariantTabsHeader({
  variants,
  activeVariantId,
  onBack,
  onVariantChange,
  onAddVariant,
}: VariantTabsHeaderProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "var(--p-color-bg-surface)",
        borderBottom: "1px solid var(--p-color-border-secondary)",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "12px 24px" }}>
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="400" blockAlign="center">
            <Button
              icon={ArrowLeftIcon}
              variant="tertiary"
              onClick={onBack}
              accessibilityLabel="Back to setup"
            />
            <Text as="span" variant="headingMd">
              Configure Variants
            </Text>
          </InlineStack>

          <InlineStack gap="200">
            {variants.map((v) => (
              <Button
                key={v.id}
                variant={v.id === activeVariantId ? "primary" : "secondary"}
                onClick={() => onVariantChange(v.id)}
                size="slim"
              >
                {v.isControl ? `${v.name} (Control)` : v.name}{" "}
                {v.status === "configured" ? "✓" : ""}
              </Button>
            ))}
            {variants.length < 4 && (
              <Button icon={PlusIcon} onClick={onAddVariant} size="slim" variant="tertiary" />
            )}
          </InlineStack>
        </InlineStack>
      </div>
    </div>
  );
}

