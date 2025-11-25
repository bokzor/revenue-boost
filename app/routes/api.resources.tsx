/**
 * Resources API Endpoint
 *
 * GET /api/resources?ids=gid1,gid2&type=product
 * Returns details for products or collections by their Shopify GIDs
 *
 * Used by ProductPicker to display initially selected resources
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";

interface ResourceDetails {
  id: string;
  title: string;
  handle: string;
  images?: Array<{ url: string; altText?: string }>;
  variants?: Array<{ id: string; title: string; price: string }>;
}

/**
 * GraphQL query to fetch products by IDs
 */
const PRODUCTS_QUERY = `#graphql
  query getProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price
            }
          }
        }
      }
    }
  }
`;

/**
 * GraphQL query to fetch collections by IDs
 */
const COLLECTIONS_QUERY = `#graphql
  query getCollections($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Collection {
        id
        title
        handle
        image {
          url
          altText
        }
      }
    }
  }
`;

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin } = await authenticate.admin(request);

    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");
    const type = url.searchParams.get("type") || "product";

    if (!idsParam) {
      return data({ error: "Missing 'ids' parameter" }, { status: 400 });
    }

    const ids = idsParam.split(",").filter(Boolean);

    if (ids.length === 0) {
      return createSuccessResponse({ resources: [] });
    }

    // Validate type
    if (type !== "product" && type !== "collection") {
      return data(
        { error: "Invalid 'type' parameter. Must be 'product' or 'collection'" },
        { status: 400 }
      );
    }

    // Fetch resources from Shopify
    const query = type === "product" ? PRODUCTS_QUERY : COLLECTIONS_QUERY;
    const response = await admin.graphql(query, {
      variables: { ids },
    });

    const body = await response.json();
    const nodes = body?.data?.nodes || [];

    // Map to ResourceDetails format
    const resources: ResourceDetails[] = nodes
      .filter((node: any) => node && node.id)
      .map((node: any) => {
        const base: ResourceDetails = {
          id: node.id,
          title: node.title || "Untitled",
          handle: node.handle || "",
        };

        if (type === "product") {
          // Map product images and variants
          const images = node.images?.edges?.map((edge: any) => ({
            url: edge.node.url,
            altText: edge.node.altText,
          }));

          const variants = node.variants?.edges?.map((edge: any) => ({
            id: edge.node.id,
            title: edge.node.title,
            price: edge.node.price,
          }));

          return {
            ...base,
            images,
            variants,
          };
        } else {
          // Map collection image
          const images = node.image
            ? [{ url: node.image.url, altText: node.image.altText }]
            : undefined;

          return {
            ...base,
            images,
          };
        }
      });

    return createSuccessResponse({ resources });
  } catch (error) {
    return handleApiError(error, "GET /api/resources");
  }
}
