/**
 * VariantConfigurator Component
 *
 * Step 2 of the experiment flow.
 * Allows configuring each variant's campaign with tab navigation.
 */

import { useCallback, useState } from "react";
import { InlineStack, Text, Button, Banner, Popover, ActionList } from "@shopify/polaris";
import { ArrowLeftIcon, PlusIcon, DeleteIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";
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
  /** Save as draft callback */
  onSaveDraft: () => void;
  /** Publish experiment callback */
  onPublish: () => void;
  /** Whether save/publish is in progress */
  isSaving: boolean;
  /** Whether at least one variant is configured (enables save draft) */
  canSaveDraft: boolean;
  /** Whether all variants are configured (enables publish) */
  canPublish: boolean;
  /** Edit mode shows different button labels */
  isEditMode?: boolean;
  recipes: StyledRecipe[];
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
  /** Custom theme presets from store settings */
  customThemePresets?: Array<{
    id: string;
    name: string;
    brandColor: string;
    backgroundColor: string;
    textColor: string;
    surfaceColor?: string;
    successColor?: string;
    fontFamily?: string;
  }>;
}

export function VariantConfigurator({
  experiment,
  activeVariantId,
  onBack,
  onVariantChange,
  onVariantUpdate,
  onAddVariant,
  onDeleteVariant,
  onSaveDraft,
  onPublish,
  isSaving,
  canSaveDraft,
  canPublish,
  isEditMode = false,
  recipes,
  storeId,
  shopDomain,
  advancedTargetingEnabled,
  customThemePresets,
}: VariantConfiguratorProps) {
  const activeVariant = experiment.variants.find((v) => v.id === activeVariantId);
  const controlVariant = experiment.variants.find((v) => v.isControl);

  // Get control variant's goal for filtering recipes in non-control variants
  const controlGoal = controlVariant?.recipe?.goal || controlVariant?.campaignData?.recipe?.goal;

  // Handler to update variant's campaign data
  const handleCampaignDataChange = useCallback(
    (data: CampaignData) => {
      if (!activeVariant) return;
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

  if (!activeVariant) {
    return <Banner tone="critical">Variant not found</Banner>;
  }

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
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        isSaving={isSaving}
        canSaveDraft={canSaveDraft}
        canPublish={canPublish}
        isEditMode={isEditMode}
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
        customThemePresets={customThemePresets}
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
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving: boolean;
  canSaveDraft: boolean;
  canPublish: boolean;
  isEditMode?: boolean;
}

function VariantTabsHeader({
  variants,
  activeVariantId,
  onBack,
  onVariantChange,
  onAddVariant,
  onDeleteVariant,
  onSaveDraft,
  onPublish,
  isSaving,
  canSaveDraft,
  canPublish,
  isEditMode = false,
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
          {/* Left: Back + Title */}
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

          {/* Center: Variant Tabs */}
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
                {/* Delete button for non-control variants (always available since control can't be deleted) */}
                {!v.isControl && onDeleteVariant && (
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

          {/* Right: Save Draft + Publish */}
          <InlineStack gap="300">
            <Button onClick={onSaveDraft} disabled={isSaving || !canSaveDraft}>
              {isEditMode ? "Save" : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              onClick={onPublish}
              disabled={isSaving || !canPublish}
              loading={isSaving}
            >
              {isEditMode ? "Update & Publish" : "Publish"}
            </Button>
          </InlineStack>
        </InlineStack>
      </div>
    </div>
  );
}
