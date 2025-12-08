/**
 * VariantConfigurator Component
 *
 * Step 2 of the experiment flow.
 * Allows configuring each variant's campaign with tab navigation.
 */

import { useCallback } from "react";
import { InlineStack, Text, Button, Banner, Popover, ActionList } from "@shopify/polaris";
import { ArrowLeftIcon, PlusIcon, DeleteIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useState } from "react";
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
  /** Callback to delete a variant (only non-control variants can be deleted) */
  onDeleteVariant?: (variantId: string) => void;
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
  onDeleteVariant,
  recipes,
  storeId,
  shopDomain,
  advancedTargetingEnabled,
}: VariantConfiguratorProps) {
  const activeVariant = experiment.variants.find((v) => v.id === activeVariantId);
  const controlVariant = experiment.variants.find((v) => v.isControl);

  // Get control variant's goal for filtering recipes in non-control variants
  const controlGoal = controlVariant?.recipe?.goal || controlVariant?.campaignData?.recipe?.goal;

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
        onDeleteVariant={onDeleteVariant}
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
        controlGoal={controlGoal}
        onBackToVariants={onBack}
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
  onDeleteVariant?: (variantId: string) => void;
}

function VariantTabsHeader({
  variants,
  activeVariantId,
  onBack,
  onVariantChange,
  onAddVariant,
  onDeleteVariant,
}: VariantTabsHeaderProps) {
  const [popoverActiveId, setPopoverActiveId] = useState<string | null>(null);

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
              <InlineStack key={v.id} gap="100" blockAlign="center">
                <Button
                  variant={v.id === activeVariantId ? "primary" : "secondary"}
                  onClick={() => onVariantChange(v.id)}
                  size="slim"
                >
                  {v.isControl ? `${v.name} (Control)` : v.name}{" "}
                  {v.status === "configured" ? "✓" : ""}
                </Button>
                {/* Delete button for non-control variants */}
                {!v.isControl && onDeleteVariant && variants.length > 2 && (
                  <Popover
                    active={popoverActiveId === v.id}
                    activator={
                      <Button
                        icon={MenuHorizontalIcon}
                        variant="tertiary"
                        size="slim"
                        onClick={() => setPopoverActiveId(popoverActiveId === v.id ? null : v.id)}
                        accessibilityLabel={`Options for ${v.name}`}
                      />
                    }
                    onClose={() => setPopoverActiveId(null)}
                  >
                    <ActionList
                      items={[
                        {
                          content: `Delete ${v.name}`,
                          icon: DeleteIcon,
                          destructive: true,
                          onAction: () => {
                            setPopoverActiveId(null);
                            onDeleteVariant(v.id);
                          },
                        },
                      ]}
                    />
                  </Popover>
                )}
              </InlineStack>
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

