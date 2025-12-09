/**
 * CollapsibleSection Component
 *
 * A collapsible card section with icon, title, completion state, and chevron.
 * Used in the unified campaign creator for progressive disclosure.
 */

import { Card, Text, InlineStack, Icon, Box, Collapsible } from "@shopify/polaris";
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon } from "@shopify/polaris-icons";
import type { IconSource } from "@shopify/polaris";

export interface CollapsibleSectionProps {
  /** Unique identifier for the section */
  id: string;
  /** Icon to display (emoji string or Polaris icon) */
  icon: string | IconSource;
  /** Section title */
  title: string;
  /** Optional step number to display */
  stepNumber?: number;
  /** Whether the section is expanded */
  isExpanded: boolean;
  /** Whether the section is completed */
  isCompleted: boolean;
  /** Callback when section header is clicked */
  onToggle: () => void;
  /** Section content */
  children: React.ReactNode;
  /** Optional subtitle/description */
  subtitle?: string;
}

export function CollapsibleSection({
  id,
  icon,
  title,
  stepNumber,
  isExpanded,
  isCompleted,
  onToggle,
  children,
  subtitle,
}: CollapsibleSectionProps) {
  return (
    <div data-section-id={id}>
    <Card>
      {/* Header - clickable to toggle */}
      <div
        onClick={onToggle}
        style={{
          cursor: "pointer",
          padding: "16px",
          borderBottom: isExpanded ? "1px solid var(--p-color-border-secondary)" : "none",
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${id}`}
      >
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="300" blockAlign="center">
            {/* Step number or icon */}
            {stepNumber !== undefined ? (
              <Box
                background={isCompleted ? "bg-fill-success" : "bg-surface-secondary"}
                borderRadius="full"
                minWidth="28px"
                minHeight="28px"
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isCompleted ? "white" : "var(--p-color-text)",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  {isCompleted ? (
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
              </Box>
            ) : (
              <span style={{ fontSize: "20px" }}>
                {typeof icon === "string" ? icon : <Icon source={icon} />}
              </span>
            )}

            {/* Title and subtitle */}
            <div>
              <Text as="h3" variant="headingMd">
                {title}
              </Text>
              {subtitle && (
                <Text as="p" variant="bodySm" tone="subdued">
                  {subtitle}
                </Text>
              )}
            </div>

            {/* Completion checkmark (when not using step numbers) */}
            {isCompleted && stepNumber === undefined && (
              <Icon source={CheckCircleIcon} tone="success" />
            )}
          </InlineStack>

          {/* Chevron */}
          <Icon
            source={isExpanded ? ChevronDownIcon : ChevronRightIcon}
            tone="subdued"
          />
        </InlineStack>
      </div>

      {/* Content */}
      <Collapsible
        open={isExpanded}
        id={`section-content-${id}`}
        transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
      >
        <Box padding="400">
          {children}
        </Box>
      </Collapsible>
    </Card>
    </div>
  );
}

