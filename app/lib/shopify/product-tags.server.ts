/**
 * Shopify Product Tags helpers
 *
 * Uses the Admin GraphQL API to fetch product tags for the current shop.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

interface ProductTagsQueryResponse {
  data?: {
    productTags?: {
      edges: Array<{
        cursor: string;
        node: string;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor?: string | null;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

const LIST_PRODUCT_TAGS_QUERY = `
  query ListProductTags($first: Int!, $after: String) {
    productTags(first: $first, after: $after) {
      edges {
        cursor
        node
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export interface ShopifyProductTagsResult {
  tags: string[];
  hasNextPage: boolean;
  endCursor?: string | null;
}

/**
 * List Shopify product tags for the current shop.
 *
 * Note: The Admin API does not support server-side search for productTags,
 * so callers should filter the result client-side if they want autocomplete.
 */
export async function listProductTags(
  admin: AdminApiContext,
  options: { first?: number; after?: string | null } = {},
): Promise<ShopifyProductTagsResult> {
  const { first = 250, after = null } = options;

  const response = await admin.graphql(LIST_PRODUCT_TAGS_QUERY, {
    variables: { first, after },
  });

  const json = (await response.json()) as ProductTagsQueryResponse;

  if (json.errors && json.errors.length > 0) {
    console.error("[Shopify Product Tags] GraphQL errors", json.errors);
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const edges = json.data?.productTags?.edges ?? [];
  const pageInfo = json.data?.productTags?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  };

  const tags = edges.map((edge) => edge.node).filter((tag) => Boolean(tag));

  return {
    tags,
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor ?? null,
  };
}

