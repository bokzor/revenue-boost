/**
 * CollapsibleSection Component
 *
 * Reusable collapsible section for organizing form fields into expandable groups.
 * Uses Polaris Collapsible with consistent styling across all campaign form sections.
 *
 * @example
 * // Single section usage
 * const [isOpen, setIsOpen] = useState(false);
 * <CollapsibleSection
 *   id="advanced-options"
 *   title="Advanced Options"
 *   isOpen={isOpen}
 *   onToggle={() => setIsOpen(!isOpen)}
 * >
 *   <TextField ... />
 * </CollapsibleSection>
 *
 * @example
 * // Multiple sections with hook
 * const { openSections, toggle } = useCollapsibleSections({
 *   basicContent: true,
 *   advancedOptions: false,
 * });
 *
 * <CollapsibleSection
 *   id="basic-content"
 *   title="Basic Content"
 *   isOpen={openSections.basicContent}
 *   onToggle={() => toggle("basicContent")}
 * >
 *   ...
 * </CollapsibleSection>
 */

import { useState, useCallback } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import { BlockStack, Button, Collapsible, InlineStack, Text } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

export interface CollapsibleSectionProps {
  /** Unique ID for the collapsible section (used for accessibility) */
  id: string;
  /** Section title displayed in the header */
  title: string;
  /** Whether the section is currently expanded */
  isOpen: boolean;
  /** Callback when the section header is clicked */
  onToggle: () => void;
  /** Content to display when expanded */
  children: ReactNode;
  /** Optional icon to display before the title */
  icon?: ReactNode;
  /** Optional badge/status to display after the title */
  badge?: ReactNode;
}

/**
 * CollapsibleSection - A consistent expandable/collapsible section component
 *
 * Features:
 * - Keyboard accessible (Enter/Space to toggle)
 * - Animated expand/collapse
 * - Consistent styling across all campaign forms
 */
export function CollapsibleSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
  icon,
  badge,
}: CollapsibleSectionProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <BlockStack gap="300">
      <div
        role="button"
        tabIndex={0}
        style={{ cursor: "pointer" }}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <InlineStack gap="200" blockAlign="center">
          <Button
            variant="plain"
            icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
            accessibilityLabel={isOpen ? `Collapse ${title}` : `Expand ${title}`}
          />
          {icon}
          <Text as="h4" variant="headingSm">
            {title}
          </Text>
          {badge}
        </InlineStack>
      </div>

      <Collapsible
        open={isOpen}
        id={id}
        transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
      >
        {children}
      </Collapsible>
    </BlockStack>
  );
}

/**
 * Hook for managing multiple collapsible sections
 *
 * @param initialState - Object with section keys and their initial open state
 * @returns Object with openSections state and toggle function
 *
 * @example
 * const { openSections, toggle } = useCollapsibleSections({
 *   basicContent: true,    // starts open
 *   advancedOptions: false, // starts closed
 * });
 *
 * // In component:
 * <CollapsibleSection isOpen={openSections.basicContent} onToggle={() => toggle("basicContent")} />
 */
export function useCollapsibleSections<T extends Record<string, boolean>>(initialState: T) {
  const [openSections, setOpenSections] = useState<T>(initialState);

  const toggle = useCallback((section: keyof T) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const openAll = useCallback(() => {
    setOpenSections((prev) => {
      const newState = { ...prev };
      for (const key of Object.keys(newState) as (keyof T)[]) {
        (newState as Record<keyof T, boolean>)[key] = true;
      }
      return newState;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenSections((prev) => {
      const newState = { ...prev };
      for (const key of Object.keys(newState) as (keyof T)[]) {
        (newState as Record<keyof T, boolean>)[key] = false;
      }
      return newState;
    });
  }, []);

  return { openSections, toggle, openAll, closeAll };
}

