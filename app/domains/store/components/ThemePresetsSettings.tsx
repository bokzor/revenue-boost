/**
 * ThemePresetsSettings Component
 *
 * Settings section for managing custom theme presets.
 * Displays a list of presets with options to create, edit, and delete.
 * Includes an "Import from Shopify Theme" button to fetch colors from the store's theme.
 * Supports importing multiple color schemes from OS 2.0 themes.
 */

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  EmptyState,
  Modal,
  ResourceList,
  ResourceItem,
  Banner,
  Spinner,
  ButtonGroup,
  Badge,
  Checkbox,
  Divider,
} from "@shopify/polaris";
import { PlusIcon, PaintBrushFlatIcon, StarFilledIcon } from "@shopify/polaris-icons";
import { useFetcher } from "react-router";

import type { StoreSettings, ThemePresetInput } from "../types/settings";
import { ThemePresetEditor } from "./ThemePresetEditor";

// ============================================================================
// TYPES
// ============================================================================

export interface ThemePresetsSettingsProps {
  settings: StoreSettings;
  onChange: (newSettings: Partial<StoreSettings>) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ThemePresetsSettings({ settings, onChange }: ThemePresetsSettingsProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<ThemePresetInput | undefined>(undefined);
  const [deleteConfirmPresetId, setDeleteConfirmPresetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importDismissed, setImportDismissed] = useState(false);
  const [selectedImportPresets, setSelectedImportPresets] = useState<Set<string>>(new Set());

  // Fetcher for importing theme from Shopify
  const themeFetcher = useFetcher<{
    presets?: ThemePresetInput[];
    preset?: ThemePresetInput; // Legacy single preset
    rawSettings?: { themeName?: string };
    error?: string;
  }>();
  const isImporting = themeFetcher.state === "loading";

  // Get available presets from API response (prefer new multi-preset, fallback to legacy single)
  const availableImportPresets = useMemo(() => {
    if (themeFetcher.data?.presets && themeFetcher.data.presets.length > 0) {
      return themeFetcher.data.presets;
    }
    if (themeFetcher.data?.preset) {
      return [themeFetcher.data.preset];
    }
    return [];
  }, [themeFetcher.data]);

  // Memoize presets to avoid useCallback dependency warnings
  const presets = useMemo(() => settings.customThemePresets || [], [settings.customThemePresets]);

  // Handle importing theme from Shopify
  const handleImportFromShopify = useCallback(() => {
    setImportSuccess(false);
    setImportDismissed(false);
    setSelectedImportPresets(new Set());
    themeFetcher.load("/api/theme-settings");
  }, [themeFetcher]);

  // Initialize selection when presets are loaded (select the default one)
  useMemo(() => {
    if (availableImportPresets.length > 0 && selectedImportPresets.size === 0) {
      const defaultPreset = availableImportPresets.find((p) => p.isDefault);
      if (defaultPreset) {
        setSelectedImportPresets(new Set([defaultPreset.id]));
      } else {
        setSelectedImportPresets(new Set([availableImportPresets[0].id]));
      }
    }
  }, [availableImportPresets, selectedImportPresets.size]);

  // Toggle selection of an import preset
  const handleToggleImportPreset = useCallback((presetId: string) => {
    setSelectedImportPresets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(presetId)) {
        newSet.delete(presetId);
      } else {
        newSet.add(presetId);
      }
      return newSet;
    });
  }, []);

  // Select all presets
  const handleSelectAllImportPresets = useCallback(() => {
    setSelectedImportPresets(new Set(availableImportPresets.map((p) => p.id)));
  }, [availableImportPresets]);

  // Deselect all presets
  const handleDeselectAllImportPresets = useCallback(() => {
    setSelectedImportPresets(new Set());
  }, []);

  // Save selected imported presets
  const handleSaveImportedPresets = useCallback(() => {
    if (selectedImportPresets.size === 0) return;

    const presetsToImport = availableImportPresets
      .filter((p) => selectedImportPresets.has(p.id))
      .map((p) => ({
        ...p,
        id: `store-theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      }));

    // Add to existing presets
    const updatedPresets = [...presetsToImport, ...presets];
    onChange({ customThemePresets: updatedPresets });
    setImportSuccess(true);
    setSelectedImportPresets(new Set());
  }, [selectedImportPresets, availableImportPresets, presets, onChange]);

  // Handlers
  const handleCreateNew = useCallback(() => {
    setEditingPreset(undefined);
    setIsEditorOpen(true);
  }, []);

  const handleEdit = useCallback((preset: ThemePresetInput) => {
    setEditingPreset(preset);
    setIsEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
    setEditingPreset(undefined);
  }, []);

  const handleSavePreset = useCallback(
    (preset: ThemePresetInput) => {
      setIsSaving(true);

      const existingIndex = presets.findIndex((p) => p.id === preset.id);
      let updatedPresets: ThemePresetInput[];

      if (existingIndex >= 0) {
        // Update existing
        updatedPresets = [...presets];
        updatedPresets[existingIndex] = preset;
      } else {
        // Add new
        updatedPresets = [...presets, preset];
      }

      onChange({ customThemePresets: updatedPresets });

      // Close editor after a brief delay to show loading state
      setTimeout(() => {
        setIsSaving(false);
        setIsEditorOpen(false);
        setEditingPreset(undefined);
      }, 300);
    },
    [presets, onChange]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirmPresetId) return;

    const updatedPresets = presets.filter((p) => p.id !== deleteConfirmPresetId);
    onChange({ customThemePresets: updatedPresets });
    setDeleteConfirmPresetId(null);
  }, [deleteConfirmPresetId, presets, onChange]);

  // Set a preset as the default
  const handleSetAsDefault = useCallback(
    (presetId: string) => {
      const updatedPresets = presets.map((p) => ({
        ...p,
        isDefault: p.id === presetId,
      }));
      onChange({ customThemePresets: updatedPresets });
    },
    [presets, onChange]
  );

  // Render preset item
  const renderPresetItem = (preset: ThemePresetInput) => {
    const isDefault = preset.isDefault === true;

    // Build shortcut actions - only show "Set as Default" if not already default
    const shortcutActions = [
      {
        content: "Edit",
        onAction: () => handleEdit(preset),
      },
      ...(!isDefault
        ? [
            {
              content: "Set as Default",
              onAction: () => handleSetAsDefault(preset.id),
            },
          ]
        : []),
      {
        content: "Delete",
        onAction: () => setDeleteConfirmPresetId(preset.id),
      },
    ];

    return (
      <ResourceItem
        id={preset.id}
        onClick={() => handleEdit(preset)}
        accessibilityLabel={`Edit ${preset.name}`}
        shortcutActions={shortcutActions}
      >
        <InlineStack gap="400" align="start" blockAlign="center">
          {/* Color preview swatches */}
          <InlineStack gap="100">
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                backgroundColor: preset.brandColor,
                border: "1px solid #E5E7EB",
              }}
              title="Brand Color"
            />
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                backgroundColor: preset.backgroundColor,
                border: "1px solid #E5E7EB",
              }}
              title="Background Color"
            />
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                backgroundColor: preset.textColor,
                border: "1px solid #E5E7EB",
              }}
              title="Text Color"
            />
          </InlineStack>

          {/* Name, description, and default badge */}
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Text variant="bodyMd" fontWeight="semibold" as="span">
                {preset.name}
              </Text>
              {isDefault && (
                <Badge tone="info" icon={StarFilledIcon}>
                  Default
                </Badge>
              )}
            </InlineStack>
            {preset.description && (
              <Text variant="bodySm" tone="subdued" as="span">
                {preset.description}
              </Text>
            )}
          </BlockStack>
        </InlineStack>
      </ResourceItem>
    );
  };

  return (
    <>
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="100">
              <Text variant="headingMd" as="h2">
                Theme Presets
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Create reusable color themes for your campaigns
              </Text>
            </BlockStack>
            <ButtonGroup>
              <Button
                icon={PaintBrushFlatIcon}
                onClick={handleImportFromShopify}
                loading={isImporting}
                disabled={isImporting}
              >
                Import from Theme
              </Button>
              <Button icon={PlusIcon} onClick={handleCreateNew}>
                Create Preset
              </Button>
            </ButtonGroup>
          </InlineStack>

          {/* Import from Shopify Theme - Preview and Select Multiple Presets */}
          {availableImportPresets.length > 0 && !importSuccess && !importDismissed && (
            <Banner
              title={`Found ${availableImportPresets.length} color scheme${availableImportPresets.length > 1 ? "s" : ""}`}
              tone="info"
              onDismiss={() => setImportDismissed(true)}
            >
              <BlockStack gap="400">
                <Text as="p">
                  Your &quot;{themeFetcher.data?.rawSettings?.themeName || "Shopify"}&quot; theme has{" "}
                  {availableImportPresets.length > 1
                    ? `${availableImportPresets.length} color schemes. Select which ones to import:`
                    : "1 color scheme. Save it as a preset?"}
                </Text>

                {/* Selection controls for multiple presets */}
                {availableImportPresets.length > 1 && (
                  <InlineStack gap="200">
                    <Button size="slim" onClick={handleSelectAllImportPresets}>
                      Select All
                    </Button>
                    <Button size="slim" onClick={handleDeselectAllImportPresets}>
                      Deselect All
                    </Button>
                  </InlineStack>
                )}

                {/* List of available presets with checkboxes */}
                <BlockStack gap="200">
                  {availableImportPresets.map((preset) => (
                    <InlineStack key={preset.id} gap="300" blockAlign="center">
                      <Checkbox
                        label=""
                        checked={selectedImportPresets.has(preset.id)}
                        onChange={() => handleToggleImportPreset(preset.id)}
                      />
                      {/* Color preview swatches */}
                      <InlineStack gap="100">
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            backgroundColor: preset.backgroundColor,
                            border: "1px solid #E5E7EB",
                          }}
                          title="Background"
                        />
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            backgroundColor: preset.textColor,
                            border: "1px solid #E5E7EB",
                          }}
                          title="Text"
                        />
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "4px",
                            backgroundColor: preset.brandColor,
                            border: "1px solid #E5E7EB",
                          }}
                          title="Brand"
                        />
                      </InlineStack>
                      {/* Preset name and default badge */}
                      <Text as="span" variant="bodyMd">
                        {preset.name}
                      </Text>
                      {preset.isDefault && (
                        <Badge tone="info" size="small">
                          Recommended
                        </Badge>
                      )}
                    </InlineStack>
                  ))}
                </BlockStack>

                <Divider />

                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    onClick={handleSaveImportedPresets}
                    disabled={selectedImportPresets.size === 0}
                  >
                    Import {selectedImportPresets.size > 0 ? `${selectedImportPresets.size} Preset${selectedImportPresets.size > 1 ? "s" : ""}` : "Selected"}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          )}

          {/* Success message */}
          {importSuccess && (
            <Banner
              title="Theme presets imported!"
              tone="success"
              onDismiss={() => setImportSuccess(false)}
            >
              <Text as="p">
                Your Shopify theme colors have been saved. You can now apply them to any campaign.
              </Text>
            </Banner>
          )}

          {/* Error message */}
          {themeFetcher.data?.error && (
            <Banner title="Failed to import theme" tone="critical">
              <Text as="p">{themeFetcher.data.error}</Text>
            </Banner>
          )}

          {/* Loading state */}
          {isImporting && (
            <InlineStack align="center" gap="200">
              <Spinner size="small" />
              <Text as="p" tone="subdued">
                Fetching colors from your Shopify theme...
              </Text>
            </InlineStack>
          )}

          {presets.length === 0 && availableImportPresets.length === 0 ? (
            <EmptyState
              heading="No theme presets yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              action={{
                content: "Create your first preset",
                onAction: handleCreateNew,
              }}
              secondaryAction={{
                content: "Import from your theme",
                onAction: handleImportFromShopify,
              }}
            >
              <p>
                Theme presets let you define your brand colors once and apply them
                to any campaign with a single click.
              </p>
            </EmptyState>
          ) : (
            <ResourceList
              items={presets}
              renderItem={renderPresetItem}
              resourceName={{ singular: "preset", plural: "presets" }}
            />
          )}
        </BlockStack>
      </Card>

      {/* Editor Modal */}
      <Modal
        open={isEditorOpen}
        onClose={handleCloseEditor}
        title={editingPreset ? "Edit Theme Preset" : "Create Theme Preset"}
        size="large"
      >
        <Modal.Section>
          <ThemePresetEditor
            initialPreset={editingPreset}
            onSave={handleSavePreset}
            onCancel={handleCloseEditor}
            isSaving={isSaving}
          />
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirmPresetId}
        onClose={() => setDeleteConfirmPresetId(null)}
        title="Delete theme preset?"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleDeleteConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setDeleteConfirmPresetId(null),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete this theme preset? This action cannot be undone.
            Campaigns using this preset will keep their current colors but won&apos;t be linked
            to the preset anymore.
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
}

