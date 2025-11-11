/**
 * TemplateCard Component
 *
 * Displays a single template option with preview, metadata, and selection state.
 * Used in the template selection step of the campaign wizard.
 */

import React from "react";
import { Card, Badge, Text, InlineStack, BlockStack } from "@shopify/polaris";
import type { ProcessedTemplate } from "../utils/template-processing";

export interface TemplateCardProps {
  template: ProcessedTemplate;
  isSelected: boolean;
  onClick: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onClick,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Select template ${template.name}`}
      onClick={() => {
        console.log(
          "TemplateCard clicked:",
          template.name,
          template.templateId,
        );
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={`template-${template.templateId}`}
      style={{
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
      }}
    >
      <Card>
        <BlockStack gap="400">
          {/* Preview Image */}
          <div
            style={{
              width: "100%",
              height: "180px",
              backgroundColor: "#F6F6F7",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
              border: isSelected ? "3px solid #008060" : "1px solid #E1E3E5",
            }}
          >
            {/* Preview image placeholder - will be replaced with actual images */}
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(135deg, ${template.backgroundColor || "#FFFFFF"} 0%, ${template.buttonColor || "#007BFF"} 100%)`,
                opacity: 0.3,
              }}
            />

            {/* Template type indicator */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "#5C5F62",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {template.name}
            </div>

            {/* Selected checkmark */}
            {isSelected && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#008060",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ✓
              </div>
            )}
          </div>

          {/* Template Info */}
          <BlockStack gap="200">
            {/* Name and Badges */}
            <InlineStack gap="200" align="space-between" blockAlign="start">
              <Text as="h3" variant="headingSm" fontWeight="semibold">
                {template.name}
              </Text>
              {template.isPopular && <Badge tone="success">Popular</Badge>}
            </InlineStack>

            {/* Description */}
            <Text as="p" variant="bodySm" tone="subdued">
              {template.description}
            </Text>

            {/* Conversion Rate */}
            {template.conversionRate && (
              <InlineStack gap="100" blockAlign="center">
                <span style={{ fontSize: "14px" }}>📊</span>
                <Text as="span" variant="bodySm" fontWeight="medium">
                  {template.conversionRate}% avg. conversion
                </Text>
              </InlineStack>
            )}
          </BlockStack>
        </BlockStack>
      </Card>
    </div>
  );
};
