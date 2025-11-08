/**
 * TriggerCard - Reusable card component for trigger configuration
 * 
 * Follows Single Responsibility Principle:
 * - Only responsible for rendering a collapsible trigger card
 * - Delegates content rendering to children
 */

import { useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Checkbox,
  Button,
  Collapsible,
  Badge,
} from "@shopify/polaris";

interface TriggerCardProps {
  title: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function TriggerCard({
  title,
  enabled,
  onEnabledChange,
  children,
  defaultExpanded = false,
}: TriggerCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sectionId = `${title.toLowerCase().replace(/\s+/g, "-")}-settings`;

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between">
          <InlineStack gap="200" align="center">
            <Checkbox
              label={title}
              checked={enabled}
              onChange={onEnabledChange}
            />
            {enabled && <Badge tone="success">Active</Badge>}
          </InlineStack>
          <Button
            variant="tertiary"
            onClick={() => setIsExpanded(!isExpanded)}
            ariaExpanded={isExpanded}
            ariaControls={sectionId}
          >
            {isExpanded ? "Hide" : "Show"} Settings
          </Button>
        </InlineStack>

        <Collapsible
          open={isExpanded}
          id={sectionId}
          transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
        >
          <BlockStack gap="300">{children}</BlockStack>
        </Collapsible>
      </BlockStack>
    </Card>
  );
}

