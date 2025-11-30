/**
 * ThemePresetsSettings Component
 *
 * Settings section for managing custom theme presets.
 * Displays a list of presets with options to create, edit, and delete.
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
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";

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

  // Memoize presets to avoid useCallback dependency warnings
  const presets = useMemo(() => settings.customThemePresets || [], [settings.customThemePresets]);

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

  // Render preset item
  const renderPresetItem = (preset: ThemePresetInput) => {
    return (
      <ResourceItem
        id={preset.id}
        onClick={() => handleEdit(preset)}
        accessibilityLabel={`Edit ${preset.name}`}
        shortcutActions={[
          {
            content: "Edit",
            onAction: () => handleEdit(preset),
          },
          {
            content: "Delete",
            onAction: () => setDeleteConfirmPresetId(preset.id),
          },
        ]}
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

          {/* Name and description */}
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              {preset.name}
            </Text>
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
            <Button icon={PlusIcon} onClick={handleCreateNew}>
              Create Preset
            </Button>
          </InlineStack>

          {presets.length === 0 ? (
            <EmptyState
              heading="No theme presets yet"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              action={{
                content: "Create your first preset",
                onAction: handleCreateNew,
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

