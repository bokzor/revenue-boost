/**
 * ShopifySegmentSelector - Select Shopify customer segments
 *
 * Fetches real customer segments from the Shopify Admin API via
 * /api/shopify-segments and lets merchants choose which segments
 * a campaign should target.
 *
 * Features:
 * - Just-in-time permission flow: Shows "Grant Access" if read_customers scope is missing
 * - Refresh button: Allows manual refresh of segment list
 * - Customer counts: Displays member count per segment when available
 */

import { useCallback, useEffect, useState } from "react";
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
  Banner,
  Icon,
} from "@shopify/polaris";
import { RefreshIcon } from "@shopify/polaris-icons";
import { useScopeRequest } from "~/shared/hooks/useScopeRequest";

export interface ShopifySegmentOption {
  id: string;
  name: string;
  description?: string;
  customerCount?: number;
}

interface SegmentsApiResponse {
  data?: {
    segments: ShopifySegmentOption[];
    scopeRequired?: string;
    scopeMessage?: string;
    scopeGranted?: boolean;
  };
  segments?: ShopifySegmentOption[];
  scopeRequired?: string;
  scopeMessage?: string;
  scopeGranted?: boolean;
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
  const [refreshing, setRefreshing] = useState(false);
  const [scopeRequired, setScopeRequired] = useState<string | null>(null);
  const [scopeMessage, setScopeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use App Bridge scopes API for requesting permissions
  const { requestScopes, isRequesting: requestingScope, error: scopeError } = useScopeRequest();

  const fetchSegments = useCallback(
    async (includeCounts = false) => {
      try {
        setError(null);
        const url = includeCounts
          ? "/api/shopify-segments?includeCounts=true"
          : "/api/shopify-segments";
        const res = await fetch(url);
        const data = (await res.json()) as SegmentsApiResponse;

        // Normalize response structure
        const responseData = data.data || data;

        // Check if scope is required
        if (responseData.scopeRequired) {
          setScopeRequired(responseData.scopeRequired);
          setScopeMessage(
            responseData.scopeMessage ||
              "Additional permissions are required to access customer segments."
          );
          setSegments([]);
          return;
        }

        // Extract segments
        const segmentsPayload = Array.isArray(responseData.segments)
          ? responseData.segments
          : [];

        setSegments(segmentsPayload);
        setScopeRequired(null);
        setScopeMessage(null);

        if (onSegmentsLoaded) {
          onSegmentsLoaded(segmentsPayload);
        }
      } catch (err) {
        console.error("Error fetching Shopify segments:", err);
        setError("Failed to load segments. Please try again.");
      }
    },
    [onSegmentsLoaded]
  );

  useEffect(() => {
    let isMounted = true;

    fetchSegments(true).finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchSegments]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSegments(true);
    setRefreshing(false);
  };

  const handleRequestScope = async () => {
    if (!scopeRequired) return;

    // Use App Bridge scopes.request() API for in-app modal
    const granted = await requestScopes([scopeRequired]);

    if (granted) {
      // Scope was granted - refresh segments
      setScopeRequired(null);
      setScopeMessage(null);
      await fetchSegments(true);
    }
    // If not granted, the hook will handle the error state
  };

  // Loading state
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

  // Scope required state - show permission request UI
  if (scopeRequired) {
    return (
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm">
          Shopify customer segments
        </Text>
        <Banner
          title="Additional permissions required"
          tone="info"
          action={{
            content: requestingScope ? "Requesting..." : "Grant Access",
            onAction: handleRequestScope,
            disabled: requestingScope,
          }}
        >
          <BlockStack gap="200">
            <Text as="p">{scopeMessage}</Text>
            <Text as="p" variant="bodySm" tone="subdued">
              We only check if a visitor belongs to your selected segments — we don't store or export
              customer data.
            </Text>
            {scopeError && (
              <Text as="p" variant="bodySm" tone="critical">
                {scopeError}
              </Text>
            )}
          </BlockStack>
        </Banner>
      </BlockStack>
    );
  }

  // Error state
  if (error) {
    return (
      <BlockStack gap="400">
        <Text as="h3" variant="headingSm">
          Shopify customer segments
        </Text>
        <Banner title="Error loading segments" tone="critical">
          <p>{error}</p>
        </Banner>
        <Button onClick={handleRefresh} loading={refreshing}>
          Try again
        </Button>
      </BlockStack>
    );
  }

  const allSelected = segments.length > 0 && selectedSegmentIds.length === segments.length;
  const someSelected = selectedSegmentIds.length > 0 && !allSelected;

  // Format customer count for display
  const formatCount = (count?: number) => {
    if (count === undefined) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

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
              onClick={handleRefresh}
              disabled={refreshing}
              icon={<Icon source={RefreshIcon} />}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Text as="span" variant="bodySm" tone="subdued">
              •
            </Text>
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

      {/* Empty state */}
      {segments.length === 0 && (
        <Banner tone="info">
          <p>
            No customer segments found in your Shopify store. Create segments in your Shopify admin
            under Customers → Segments to target specific customer groups.
          </p>
        </Banner>
      )}

      {/* Segment list */}
      <BlockStack gap="200">
        {segments.map((segment) => {
          const isSelected = selectedSegmentIds.includes(segment.id);
          const countDisplay = formatCount(segment.customerCount);

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
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {segment.name}
                      </Text>
                      {countDisplay && (
                        <Badge tone="info" size="small">
                          {`${countDisplay} customers`}
                        </Badge>
                      )}
                    </InlineStack>
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
      {segments.length > 0 && selectedSegmentIds.length === 0 && (
        <Box paddingBlockStart="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Select one or more Shopify customer segments to target. Your campaign will only show to
            visitors who belong to at least one selected segment when they are identified as
            customers.
          </Text>
        </Box>
      )}
    </BlockStack>
  );
}
