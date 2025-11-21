import React, { useState, useMemo } from "react";
import { Modal, BlockStack, Text, Button, Card, InlineStack, TextField, Box } from "@shopify/polaris";
import type { UnifiedTemplate } from "~/domains/popups/services/templates/unified-template-service.server";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import { RECIPE_CATALOG, type RecipeDefinition } from "../../recipes/recipe-catalog";
import { ProductPicker, type ProductPickerSelection } from "../form/ProductPicker";

interface RecipeConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: Partial<CampaignFormData>) => void;
    template: UnifiedTemplate;
}

export function RecipeConfigurationModal({
    isOpen,
    onClose,
    onSelect,
    template,
}: RecipeConfigurationModalProps) {
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [contextData, setContextData] = useState<Record<string, any>>({});

    const recipes = useMemo(() => {
        if (!template.templateType) return [];
        const allRecipes = RECIPE_CATALOG[template.templateType] || [];

        return allRecipes.filter((recipe) => {
            if (!recipe.allowedTemplateNames) return true;
            return recipe.allowedTemplateNames.includes(template.name);
        });
    }, [template.templateType, template.name]);

    const selectedRecipe = useMemo(
        () => recipes.find((r) => r.id === selectedRecipeId),
        [recipes, selectedRecipeId]
    );

    const handleCreate = () => {
        if (selectedRecipe) {
            const data = selectedRecipe.build(contextData);
            onSelect(data);
        } else {
            // "Start from Scratch" case
            onSelect({});
        }
    };

    const handleInputChange = (key: string, value: any) => {
        setContextData((prev) => ({ ...prev, [key]: value }));
    };

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (isOpen) {
            setSelectedRecipeId(null);
            setContextData({});
        }
    }, [isOpen]);

    const renderInputs = (recipe: RecipeDefinition) => {
        return (
            <BlockStack gap="400">
                {recipe.inputs.map((input) => {
                    if (input.type === "product_picker") {
                        return (
                            <ProductPicker
                                key={input.key}
                                mode="product"
                                selectionType="single"
                                onSelect={(selections) => {
                                    // Store the full selection objects for the builder to use
                                    handleInputChange(input.key, selections);
                                }}
                                buttonLabel={input.label}
                                showSelected={true}
                            />
                        );
                    }
                    if (input.type === "collection_picker") {
                        return (
                            <ProductPicker
                                key={input.key}
                                mode="collection"
                                selectionType="single"
                                onSelect={(selections) => {
                                    handleInputChange(input.key, selections);
                                }}
                                buttonLabel={input.label}
                                showSelected={true}
                            />
                        );
                    }
                    if (input.type === "discount_percentage") {
                        return (
                            <TextField
                                key={input.key}
                                label={input.label}
                                type="number"
                                value={String(contextData[input.key] ?? input.defaultValue)}
                                onChange={(val) => handleInputChange(input.key, Number(val))}
                                autoComplete="off"
                                suffix="%"
                            />
                        );
                    }
                    if (input.type === "currency_amount") {
                        return (
                            <TextField
                                key={input.key}
                                label={input.label}
                                type="number"
                                value={String(contextData[input.key] ?? input.defaultValue)}
                                onChange={(val) => handleInputChange(input.key, Number(val))}
                                autoComplete="off"
                                prefix="$"
                            />
                        );
                    }
                    return null;
                })}
            </BlockStack>
        );
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={`Setup ${template.name}`}
            primaryAction={{
                content: selectedRecipe ? "Create Campaign" : "Start from Scratch",
                onAction: handleCreate,
            }}
            secondaryActions={[
                {
                    content: "Cancel",
                    onAction: onClose,
                },
            ]}
        >
            <Modal.Section>
                <BlockStack gap="500">
                    {/* Recipe Selection */}
                    {recipes.length > 0 && (
                        <BlockStack gap="300">
                            <Text as="h3" variant="headingSm">
                                Choose a starting point:
                            </Text>
                            <InlineStack gap="300">
                                {/* "Start from Scratch" Option */}
                                <div
                                    onClick={() => setSelectedRecipeId(null)}
                                    style={{
                                        cursor: "pointer",
                                        border: selectedRecipeId === null ? "2px solid #008060" : "1px solid #E1E3E5",
                                        borderRadius: "8px",
                                        padding: "12px",
                                        width: "200px",
                                        backgroundColor: selectedRecipeId === null ? "#F1F8F5" : "white",
                                    }}
                                >
                                    <BlockStack gap="200">
                                        <Text as="h4" variant="bodyMd" fontWeight="semibold">
                                            Start from Scratch
                                        </Text>
                                        <Text as="p" variant="bodySm" tone="subdued">
                                            Configure everything manually.
                                        </Text>
                                    </BlockStack>
                                </div>

                                {/* Recipe Options */}
                                {recipes.map((recipe) => (
                                    <div
                                        key={recipe.id}
                                        onClick={() => {
                                            setSelectedRecipeId(recipe.id);
                                            // Initialize default values
                                            const defaults: Record<string, any> = {};
                                            recipe.inputs.forEach(input => {
                                                if ('defaultValue' in input) {
                                                    defaults[input.key] = input.defaultValue;
                                                }
                                            });
                                            setContextData(defaults);
                                        }}
                                        style={{
                                            cursor: "pointer",
                                            border: selectedRecipeId === recipe.id ? "2px solid #008060" : "1px solid #E1E3E5",
                                            borderRadius: "8px",
                                            padding: "12px",
                                            width: "200px",
                                            backgroundColor: selectedRecipeId === recipe.id ? "#F1F8F5" : "white",
                                        }}
                                    >
                                        <BlockStack gap="200">
                                            <Text as="h4" variant="bodyMd" fontWeight="semibold">
                                                {recipe.name}
                                            </Text>
                                            <Text as="p" variant="bodySm" tone="subdued">
                                                {recipe.description}
                                            </Text>
                                        </BlockStack>
                                    </div>
                                ))}
                            </InlineStack>
                        </BlockStack>
                    )}

                    {/* Recipe Configuration Inputs */}
                    {selectedRecipe && (
                        <Card>
                            <BlockStack gap="400">
                                <Text as="h3" variant="headingSm">
                                    Configure {selectedRecipe.name}
                                </Text>
                                {renderInputs(selectedRecipe)}
                            </BlockStack>
                        </Card>
                    )}
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
}
