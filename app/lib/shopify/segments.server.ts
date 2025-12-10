/**
 * Shopify Customer Segments helpers
 *
 * Uses the Admin GraphQL API to fetch customer segments and member counts.
 */

import { logger } from "~/lib/logger.server";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export interface ShopifyCustomerSegment {
  id: string;
  name: string;
  query?: string | null;
  creationDate?: string | null;
  lastEditDate?: string | null;
}

interface SegmentsQueryResponse {
  data?: {
    segments?: {
      nodes: Array<{
        id: string;
        name: string;
        query?: string | null;
        creationDate?: string | null;
        lastEditDate?: string | null;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor?: string | null;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

interface SegmentMembersCountResponse {
  data?: {
    customerSegmentMembers?: {
      totalCount: number;
    };
  };
  errors?: Array<{ message: string }>;
}

const LIST_CUSTOMER_SEGMENTS_QUERY = `
  query ListCustomerSegments($first: Int!, $after: String) {
    segments(first: $first, after: $after, sortKey: CREATION_DATE) {
      nodes {
        id
        name
        query
        creationDate
        lastEditDate
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const CUSTOMER_SEGMENT_MEMBERS_COUNT_QUERY = `
  query CustomerSegmentMembersCount($segmentId: ID!) {
    customerSegmentMembers(segmentId: $segmentId, first: 1) {
      totalCount
    }
  }
`;

/**
 * List Shopify customer segments for the current shop.
 */
export async function listCustomerSegments(
  admin: AdminApiContext,
  options: { first?: number; after?: string | null } = {}
): Promise<{
  segments: ShopifyCustomerSegment[];
  hasNextPage: boolean;
  endCursor?: string | null;
}> {
  const { first = 50, after = null } = options;

  const response = await admin.graphql(LIST_CUSTOMER_SEGMENTS_QUERY, {
    variables: { first, after },
  });

  const json = (await response.json()) as SegmentsQueryResponse;

  if (json.errors && json.errors.length > 0) {
    logger.error({ errors: json.errors }, "[ShopifySegments] GraphQL errors");
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const segmentNodes = json.data?.segments?.nodes ?? [];
  const pageInfo = json.data?.segments?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  };

  const segments: ShopifyCustomerSegment[] = segmentNodes.map((node) => ({
    id: node.id,
    name: node.name,
    query: node.query ?? null,
    creationDate: node.creationDate ?? null,
    lastEditDate: node.lastEditDate ?? null,
  }));

  return {
    segments,
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor ?? null,
  };
}

/**
 * Get total customer count for a given Shopify customer segment.
 */
export async function getCustomerSegmentMembersCount(
  admin: AdminApiContext,
  segmentId: string
): Promise<number> {
  const response = await admin.graphql(CUSTOMER_SEGMENT_MEMBERS_COUNT_QUERY, {
    variables: { segmentId },
  });

  const json = (await response.json()) as SegmentMembersCountResponse;

  if (json.errors && json.errors.length > 0) {
    logger.error({ errors: json.errors }, "[ShopifySegments] Members count GraphQL errors");
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const totalCount = json.data?.customerSegmentMembers?.totalCount ?? 0;
  return totalCount;
}
