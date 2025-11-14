/**
 * TemplateSelector Component (Refactored for SOLID Compliance)
 *
 * SOLID Improvements:
 * - Extracted loading state to TemplateLoadingState component
 * - Extracted header to TemplateSelectorHeader component
 * - Extracted footer to TemplateSelectorFooter component
 * - Main component now <100 lines (down from 213)
 * - Better separation of concerns
 *
 * IMPORTANT: Template Selection Logic
 * - Uses template.id (unique template identifier) for selection
 * - NOT template.templateType (which can be shared by multiple templates)
 * - This ensures only the specific selected template shows the green checkmark
 */

import React, { useMemo } from "react";
import { BlockStack, InlineGrid, EmptyState } from "@shopify/polaris";
import type { CampaignGoal } from "@prisma/client";
import type { UnifiedTemplate as _UnifiedTemplate } from "~/domains/popups/services/templates/unified-template-service.server";
import { TemplateCard } from "./TemplateCard";
import { useTemplates } from "../hooks/useTemplates";
import { processTemplates } from "../utils/template-processing";
import { TemplateLoadingState } from "./templates/TemplateLoadingState";
import { TemplateSelectorHeader } from "./templates/TemplateSelectorHeader";
import { TemplateSelectorFooter } from "./templates/TemplateSelectorFooter";

// Define a simplified template type for the selector
import type { TemplateType, ContentConfig, TargetRulesConfig, DesignConfig, DiscountConfig } from "~/domains/campaigns/types/campaign";
export interface SelectedTemplate {
  id: string;
  templateType: TemplateType;
  name: string;
  contentConfig?: ContentConfig;
  targetRules?: TargetRulesConfig;
  designConfig?: DesignConfig;
  discountConfig?: DiscountConfig;
}

export interface TemplateSelectorProps {
  goal: CampaignGoal;
  storeId: string;
  selectedTemplateId?: string;
  onSelect: (template: SelectedTemplate) => void;
  initialTemplates?: _UnifiedTemplate[];
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  goal,
  storeId,
  selectedTemplateId,
  onSelect,
  initialTemplates,
}) => {
  // Use extracted hook for template fetching (with optional initial templates from loader)
  const { templates, loading, error } = useTemplates(goal, storeId, initialTemplates);

  // Handle template selection
  const handleTemplateClick = (template: _UnifiedTemplate) => {
    console.log(
      "Template clicked:",
      template.id,
      template.name,
      template.category,
    );

    // templateType is now required - all templates must have it
    if (!template.templateType) {
      console.error(
        `Template "${template.name}" (ID: ${template.id}) is missing required templateType field. This template cannot be used.`,
      );
      // Error handling - template is misconfigured
      return;
    }

    console.log("Template selection:", {
      id: template.id,
      name: template.name,
      templateType: template.templateType,
      category: template.category,
    });

    // Pass the full template object with all necessary data
    // IMPORTANT: Use unique template ID for proper selection (not templateType)
    const selectedTemplate: SelectedTemplate = {
      id: template.id,
      templateType: template.templateType,
      name: template.name,
      contentConfig: template.contentConfig as ContentConfig | undefined,
      targetRules: template.targetRules as TargetRulesConfig | undefined,
      designConfig: template.designConfig as DesignConfig | undefined,
      discountConfig: template.discountConfig as DiscountConfig | undefined,
    };

    onSelect(selectedTemplate);
  };

  // Use extracted processing utility
  const processedTemplates = useMemo(() => {
    console.log("Processing templates (memoized):", templates.length, "templates");
    console.log("Selected template ID:", selectedTemplateId);
    return processTemplates(templates, selectedTemplateId);
  }, [templates, selectedTemplateId]);

  // Loading state
  if (loading) {
    return <TemplateLoadingState goal={goal} />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        heading="Error loading templates"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>{error}</p>
      </EmptyState>
    );
  }

  // Empty state if no templates
  if (templates.length === 0) {
    return (
      <EmptyState
        heading="No templates available"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>
          No templates are available for the selected goal. Please try a
          different goal.
        </p>
      </EmptyState>
    );
  }

  // Show currently selected template info if editing
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const isEditingWithTemplate = Boolean(selectedTemplateId && selectedTemplate);

  // Calculate template type info for footer
  const hasGlobalTemplates = processedTemplates.some(
    ({ originalTemplate: t }) => t.storeId === null
  );
  const hasStoreTemplates = processedTemplates.some(
    ({ originalTemplate: t }) => t.storeId === storeId
  );

  return (
    <BlockStack gap="400" data-testid="template-selector">
      {/* Header - Extracted Component */}
      <TemplateSelectorHeader
        goal={goal}
        isEditing={isEditingWithTemplate}
        selectedTemplateName={selectedTemplate?.name}
      />

      {/* Template Grid */}
      <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
        {processedTemplates.map(({ originalTemplate, processedTemplate }) => (
          <TemplateCard
            key={originalTemplate.id}
            template={processedTemplate}
            isSelected={processedTemplate.templateId === selectedTemplateId}
            onClick={() => handleTemplateClick(originalTemplate)}
          />
        ))}
      </InlineGrid>

      {/* Footer - Extracted Component */}
      <TemplateSelectorFooter
        goal={goal}
        templateCount={processedTemplates.length}
        hasGlobalTemplates={hasGlobalTemplates}
        hasStoreTemplates={hasStoreTemplates}
      />
    </BlockStack>
  );
};
