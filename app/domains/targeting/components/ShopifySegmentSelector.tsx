/**
 * ShopifySegmentSelector - Select Shopify customer segments
 *
 * Fetches real customer segments from the Shopify Admin API via
 * /api/shopify-segments (no stubs) and lets merchants choose which
 * segments a campaign should target.
 */

import { useEffect, useState } from "react";
import {
  BlockStack,
  InlineStack,
  Text,
  Checkbox,
  Badge,
  Box,
  Card,
  Spinner,
  Button,
} from "@shopify/polaris";

export interface ShopifySegmentOption {
  id: string;
  name: string;
  description?: string;
}

export interface ShopifySegmentSelectorProps {
  selectedSegmentIds: string[];
  onChange: (segmentIds: string[]) => void;
  disabled?: boolean;
  onSegmentsLoaded?: (segments: ShopifySegmentOption[]) => void;
}

export function ShopifySegmentSelector({
  selectedSegmentIds,
  onChange,
  disabled = false,
  onSegmentsLoaded,
}: ShopifySegmentSelectorProps) {
  const [segments, setSegments] = useState<ShopifySegmentOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/shopify-segments")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;

        const segmentsPayload =
          (data && data.data && Array.isArray(data.data.segments)
            ? data.data.segments
            : data && Array.isArray(data.segments)
              ? data.segments
              : []) as ShopifySegmentOption[];

        setSegments(segmentsPayload);
        if (onSegmentsLoaded) {
          onSegmentsLoaded(segmentsPayload);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching Shopify segments:", error);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (segmentId: string) => {
    if (disabled) return;

    if (selectedSegmentIds.includes(segmentId)) {
      onChange(selectedSegmentIds.filter((id) => id !== segmentId));
    } else {
      onChange([...selectedSegmentIds, segmentId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(segments.map((s) => s.id));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  if (loading) {
    return (
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm">
          Loading Shopify segments...
        </Text>
        <Spinner size="small" />
      </BlockStack>
    );
  }

  const allSelected = segments.length > 0 && selectedSegmentIds.length === segments.length;
  const someSelected = selectedSegmentIds.length > 0 && !allSelected;

  return (
    <BlockStack gap="400">
      {/* Header */}
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h3" variant="headingSm">
          Shopify customer segments
        </Text>
        <InlineStack gap="200">
          {someSelected || allSelected ? (
            <Badge tone="info">{`${selectedSegmentIds.length} selected`}</Badge>
          ) : null}
          <InlineStack gap="100">
            <Button
              variant="plain"
              onClick={handleSelectAll}
              disabled={disabled || segments.length === 0}
            >
              Select all
            </Button>
            <Text as="span" variant="bodySm" tone="subdued">
              •
            </Text>
            <Button
              variant="plain"
              onClick={handleClearAll}
              disabled={disabled || selectedSegmentIds.length === 0}
            >
              Clear all
            </Button>
          </InlineStack>
        </InlineStack>
      </InlineStack>

      {/* Segment list */}
      <BlockStack gap="200">
        {segments.map((segment) => {
          const isSelected = selectedSegmentIds.includes(segment.id);

          return (
            <Card key={segment.id} padding="300">
              <button
                type="button"
                onClick={() => handleToggle(segment.id)}
                style={{
                  width: "100%",
                  padding: 0,
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                }}
                disabled={disabled}
              >
                <InlineStack gap="300" blockAlign="start" wrap={false}>
                  <Checkbox
                    label=""
                    checked={isSelected}
                    onChange={() => handleToggle(segment.id)}
                    disabled={disabled}
                  />

                  <BlockStack gap="100" inlineAlign="start">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {segment.name}
                    </Text>
                    {segment.description && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {segment.description}
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>
              </button>
            </Card>
          );
        })}
      </BlockStack>

      {/* Help text */}
      {selectedSegmentIds.length === 0 && (
        <Box paddingBlockStart="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Select one or more Shopify customer segments to target. Your campaign
            will only show to visitors who belong to at least one selected
            segment when they are identified as customers.
          </Text>
        </Box>
      )}
    </BlockStack>
  );
}

