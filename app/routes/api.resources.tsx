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

    // Type for GraphQL node response
    type GraphQLNode = Record<string, unknown>;
    type ImageEdge = { node: { url: string; altText?: string } };
    type VariantEdge = { node: { id: string; title: string; price: string } };

    // Map to ResourceDetails format
    const resources: ResourceDetails[] = nodes
      .filter((node: GraphQLNode) => node && node.id)
      .map((node: GraphQLNode) => {
        const base: ResourceDetails = {
          id: node.id as string,
          title: (node.title as string) || "Untitled",
          handle: (node.handle as string) || "",
        };

        if (type === "product") {
          // Map product images and variants
          const imagesEdges = node.images as { edges?: ImageEdge[] } | undefined;
          const images = imagesEdges?.edges?.map((edge) => ({
            url: edge.node.url,
            altText: edge.node.altText,
          }));

          const variantsEdges = node.variants as { edges?: VariantEdge[] } | undefined;
          const variants = variantsEdges?.edges?.map((edge) => ({
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
          const nodeImage = node.image as { url?: string; altText?: string } | undefined;
          const images = nodeImage
            ? [{ url: nodeImage.url, altText: nodeImage.altText }]
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
