/**
 * Segment Selector - Select predefined audience segments
 *
 * Allows merchants to target campaigns to specific audience segments
 * like VIP customers, cart abandoners, mobile users, etc.
 */

import { useState, useEffect } from "react";
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

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  icon?: string;
  estimatedSize?: number;
  priority: number;
}

export interface SegmentSelectorProps {
  storeId: string;
  selectedSegments: string[];
  onSegmentsChange: (segments: string[]) => void;
  disabled?: boolean;
}

export function SegmentSelector({
  storeId,
  selectedSegments,
  onSegmentsChange,
  disabled = false,
}: SegmentSelectorProps) {
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch segments from database
    fetch(`/api/segments?storeId=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.segments) {
          setSegments(data.segments);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching segments:", error);
        setLoading(false);
      });
  }, [storeId]);

  const handleSegmentToggle = (segmentId: string) => {
    if (disabled) return;

    if (selectedSegments.includes(segmentId)) {
      // Remove segment
      onSegmentsChange(selectedSegments.filter((id) => id !== segmentId));
    } else {
      // Add segment
      onSegmentsChange([...selectedSegments, segmentId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onSegmentsChange(segments.map((s) => s.id));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onSegmentsChange([]);
  };

  if (loading) {
    return (
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm">
          Loading segments...
        </Text>
        <Spinner size="small" />
      </BlockStack>
    );
  }

  const allSelected = selectedSegments.length === segments.length;
  const someSelected = selectedSegments.length > 0 && !allSelected;

  return (
    <BlockStack gap="400">
      {/* Header with Select All / Clear All */}
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h3" variant="headingSm">
          Select Audience Segments
        </Text>
        <InlineStack gap="200">
          {someSelected || allSelected ? (
            <Badge tone="info">{`${selectedSegments.length} selected`}</Badge>
          ) : null}
          <InlineStack gap="100">
            <Button
              variant="plain"
              onClick={handleSelectAll}
              disabled={disabled}
            >
              Select all
            </Button>
            <Text as="span" variant="bodySm" tone="subdued">
              •
            </Text>
            <Button
              variant="plain"
              onClick={handleClearAll}
              disabled={disabled}
            >
              Clear all
            </Button>
          </InlineStack>
        </InlineStack>
      </InlineStack>

      {/* Segment List */}
      <BlockStack gap="200">
        {segments.map((segment) => {
          const isSelected = selectedSegments.includes(segment.id);

          return (
            <Card key={segment.id} padding="300">
              <button
                onClick={() => handleSegmentToggle(segment.id)}
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
                    onChange={() => handleSegmentToggle(segment.id)}
                    disabled={disabled}
                  />

                  <BlockStack gap="100" inlineAlign="start">
                    <InlineStack gap="200" blockAlign="center">
                      {segment.icon && (
                        <Text as="span" variant="bodyMd">
                          {segment.icon}
                        </Text>
                      )}
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {segment.name}
                      </Text>
                    </InlineStack>

                    <Text as="p" variant="bodySm" tone="subdued">
                      {segment.description}
                    </Text>

                    {segment.estimatedSize && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        Estimated reach: ~
                        {segment.estimatedSize.toLocaleString()} visitors
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>
              </button>
            </Card>
          );
        })}
      </BlockStack>

      {/* Help Text */}
      {selectedSegments.length === 0 && (
        <Box paddingBlockStart="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Select one or more audience segments to target. Your campaign will
            only show to visitors who match at least one of the selected
            segments.
          </Text>
        </Box>
      )}
    </BlockStack>
  );
}
