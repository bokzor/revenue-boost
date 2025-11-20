/**
 * Field Configuration Section
 *
 * Generic component for configuring email, name, and consent (GDPR) fields
 * Reusable across Newsletter, SpinToWin, and other campaign templates
 */

import React from "react";
import { BlockStack } from "@shopify/polaris";
import { TextField, CheckboxField, FormGrid } from "../form";

export interface FieldConfigurationSectionProps {
    // Email configuration
    emailRequired?: boolean;
    emailLabel?: string;
    emailPlaceholder?: string;

    // Name field configuration
    nameFieldEnabled?: boolean;
    collectName?: boolean; // Alternative prop name for SpinToWin compatibility
    nameFieldRequired?: boolean;
    nameFieldPlaceholder?: string;

    // Consent/GDPR configuration
    consentFieldEnabled?: boolean;
    showGdprCheckbox?: boolean; // Alternative prop name for SpinToWin compatibility
    consentFieldRequired?: boolean;
    consentFieldText?: string;
    gdprLabel?: string; // Alternative prop name for SpinToWin compatibility

    // Callbacks
    onChange: (updates: Partial<FieldConfig>) => void;
    errors?: Record<string, string>;
}

export interface FieldConfig {
    emailRequired?: boolean;
    emailLabel?: string;
    emailPlaceholder?: string;
    nameFieldEnabled?: boolean;
    collectName?: boolean;
    nameFieldRequired?: boolean;
    nameFieldPlaceholder?: string;
    consentFieldEnabled?: boolean;
    showGdprCheckbox?: boolean;
    consentFieldRequired?: boolean;
    consentFieldText?: string;
    gdprLabel?: string;
}

export function FieldConfigurationSection({
    emailRequired = true,
    emailLabel,
    emailPlaceholder,
    nameFieldEnabled,
    collectName,
    nameFieldRequired,
    nameFieldPlaceholder,
    consentFieldEnabled,
    showGdprCheckbox,
    consentFieldRequired,
    consentFieldText,
    gdprLabel,
    onChange,
    errors,
}: FieldConfigurationSectionProps) {
    // Normalize prop names (support both Newsletter and SpinToWin conventions)
    const isNameFieldEnabled = nameFieldEnabled || collectName || false;
    const isConsentFieldEnabled = consentFieldEnabled || showGdprCheckbox || false;
    const consentText = consentFieldText || gdprLabel;

    const updateField = <K extends keyof FieldConfig>(
        field: K,
        value: FieldConfig[K]
    ) => {
        onChange({ [field]: value });
    };

    return (
        <BlockStack gap="400">
            <FormGrid columns={2}>
                <CheckboxField
                    label="Require Email"
                    name="emailRequired"
                    checked={emailRequired !== false}
                    helpText="Make email field mandatory"
                    onChange={(checked) => updateField("emailRequired", checked)}
                />

                <CheckboxField
                    label="Enable Name Field"
                    name="nameFieldEnabled"
                    checked={isNameFieldEnabled}
                    helpText="Add an optional name field"
                    onChange={(checked) => {
                        // Update both prop names for compatibility
                        onChange({
                            nameFieldEnabled: checked,
                            collectName: checked,
                        });
                    }}
                />
            </FormGrid>

            {isNameFieldEnabled && (
                <FormGrid columns={2}>
                    <CheckboxField
                        label="Require Name"
                        name="nameFieldRequired"
                        checked={nameFieldRequired || false}
                        onChange={(checked) => updateField("nameFieldRequired", checked)}
                    />

                    <TextField
                        label="Name Field Placeholder"
                        name="nameFieldPlaceholder"
                        value={nameFieldPlaceholder || ""}
                        placeholder="Enter your name"
                        onChange={(value) => updateField("nameFieldPlaceholder", value)}
                    />
                </FormGrid>
            )}

            <CheckboxField
                label="Enable Consent Checkbox"
                name="consentFieldEnabled"
                checked={isConsentFieldEnabled}
                helpText="Add a consent checkbox (e.g., for GDPR compliance)"
                onChange={(checked) => {
                    // Update both prop names for compatibility
                    onChange({
                        consentFieldEnabled: checked,
                        showGdprCheckbox: checked,
                    });
                }}
            />

            {isConsentFieldEnabled && (
                <FormGrid columns={2}>
                    <CheckboxField
                        label="Require Consent"
                        name="consentFieldRequired"
                        checked={consentFieldRequired || false}
                        onChange={(checked) => updateField("consentFieldRequired", checked)}
                    />

                    <TextField
                        label="Consent Text"
                        name="consentFieldText"
                        value={consentText || ""}
                        placeholder="I agree to receive marketing emails"
                        multiline
                        rows={2}
                        onChange={(value) => {
                            // Update both prop names for compatibility
                            onChange({
                                consentFieldText: value,
                                gdprLabel: value,
                            });
                        }}
                    />
                </FormGrid>
            )}
        </BlockStack>
    );
}
