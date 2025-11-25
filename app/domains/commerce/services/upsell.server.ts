/**
 * Product Upsell Service
 *
 * Business logic for fetching and recommending products for upsell campaigns.
 * Supports three selection methods:
 * - Manual: Fetch specific products by ID
 * - Collection: Fetch products from a Shopify collection
 * - AI: Smart recommendations based on popularity and cart context
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { Product } from "~/domains/storefront/popups-new/types";

type ShopifyProductNode = {
  id: string;
  title?: string;
  handle?: string;
  variants?: {
    edges?: Array<{ node?: { id?: string; price?: string } }>;
  };
  images?: { edges?: Array<{ node?: { url?: string } }> };
};

const isProductNode = (node: unknown): node is ShopifyProductNode => {
  return Boolean(node && typeof node === "object" && "id" in (node as Record<string, unknown>));
};

const normalizeProductEdges = (edges: Array<{ node?: unknown }>): ShopifyProductNode[] => {
  return edges.map((edge) => edge?.node).filter(isProductNode);
};

/**
 * Fetch basic product data from Shopify Admin API and map to storefront Product type.
 */
export async function fetchProductsByIds(
  admin: AdminApiContext,
  productIds: string[]
): Promise<Product[]> {
  if (!productIds.length) return [];

  const PRODUCT_QUERY = `#graphql
    query getUpsellProducts($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          handle
          onlineStoreUrl
          images(first: 1) { edges { node { url altText } } }
          variants(first: 1) { edges { node { id price } } }
        }
      }
    }
  `;

  const response = await admin.graphql(PRODUCT_QUERY, {
    variables: { ids: productIds },
  });

  const body = await response.json();
  const nodes = body?.data?.nodes || [];

  const products: Product[] = [];

  for (const node of nodes) {
    if (!node || !node.id) continue;

    const variant = node.variants?.edges?.[0]?.node;
    const image = node.images?.edges?.[0]?.node;

    products.push({
      id: node.id,
      title: node.title || "",
      price: variant?.price ?? "0.00",
      imageUrl: image?.url || "",
      compareAtPrice: undefined,
      variantId: variant?.id || node.id,
      handle: node.handle || "",
    });
  }

  return products;
}

/**
 * Fetch popular products as a fallback for smart recommendations
 * Uses Shopify's product query sorted by creation date (newest first)
 *
 * @param admin - Shopify admin API client
 * @param limit - Maximum number of products to return
 * @param excludeProductIds - Product IDs to exclude (e.g., items already in cart)
 *
 * TODO: Enhance with actual popularity metrics (sales, views, etc.)
 * TODO: Implement proper AI-based recommendations using:
 *   - Cart-based recommendations (complementary products)
 *   - Shopify's Product Recommendations API
 *   - Collaborative filtering
 */
export async function fetchPopularProducts(
  admin: AdminApiContext,
  limit: number,
  excludeProductIds: string[] = []
): Promise<Product[]> {
  // Fetch more than needed to account for filtering
  const first = Math.min(limit + excludeProductIds.length, 50);

  const POPULAR_PRODUCTS_QUERY = `#graphql
    query getPopularProducts($first: Int!) {
      products(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) { edges { node { url altText } } }
            variants(first: 1) { edges { node { id price } } }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(POPULAR_PRODUCTS_QUERY, {
      variables: { first },
    });

    const body = await response.json();
    const edges = body?.data?.products?.edges || [];

    const allProducts = normalizeProductEdges(edges).map((node): Product => {
      const variant = node.variants?.edges?.[0]?.node;
      const image = node.images?.edges?.[0]?.node;

      return {
        id: node.id,
        title: node.title || "",
        price: variant?.price ?? "0.00",
        imageUrl: image?.url || "",
        compareAtPrice: undefined,
        variantId: variant?.id || node.id,
        handle: node.handle || "",
      };
    });

    // Filter out products already in cart
    const filteredProducts = allProducts.filter(
      (product: { id: string }) => !excludeProductIds.includes(product.id)
    );

    // Return only the requested limit
    return filteredProducts.slice(0, limit);
  } catch (error) {
    console.error("[Upsell Service] Failed to fetch popular products:", error);
    return [];
  }
}

/**
 * Fetch products from a Shopify collection
 *
 * @param admin - Shopify admin API client
 * @param collectionIdentifier - Collection ID (gid://...) or handle (string)
 * @param limit - Maximum number of products to return
 */
export async function fetchProductsByCollection(
  admin: AdminApiContext,
  collectionIdentifier: string,
  limit: number
): Promise<Product[]> {
  if (!collectionIdentifier) return [];

  const first = Math.max(1, Math.min(typeof limit === "number" ? limit : 3, 12));

  // Check if identifier is a GID or a handle
  const isGid = collectionIdentifier.startsWith("gid://");

  if (isGid) {
    return fetchProductsByCollectionId(admin, collectionIdentifier, first);
  } else {
    return fetchProductsByCollectionHandle(admin, collectionIdentifier, first);
  }
}

/**
 * Fetch products from a collection by ID
 */
async function fetchProductsByCollectionId(
  admin: AdminApiContext,
  collectionId: string,
  first: number
): Promise<Product[]> {
  const COLLECTION_QUERY = `#graphql
    query getCollectionProductsById($id: ID!, $first: Int!) {
      collection(id: $id) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              images(first: 1) { edges { node { url altText } } }
              variants(first: 1) { edges { node { id price } } }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(COLLECTION_QUERY, {
      variables: { id: collectionId, first },
    });

    const body = await response.json();
    const edges = body?.data?.collection?.products?.edges || [];

    return normalizeProductEdges(edges).map((node): Product => {
      const variant = node.variants?.edges?.[0]?.node;
      const image = node.images?.edges?.[0]?.node;

      return {
        id: node.id,
        title: node.title || "",
        price: variant?.price ?? "0.00",
        imageUrl: image?.url || "",
        compareAtPrice: undefined,
        variantId: variant?.id || node.id,
        handle: node.handle || "",
      };
    });
  } catch (error) {
    console.error("[Upsell Service] Failed to fetch collection by ID:", error);
    return [];
  }
}

/**
 * Fetch products from a collection by handle
 */
async function fetchProductsByCollectionHandle(
  admin: AdminApiContext,
  handle: string,
  first: number
): Promise<Product[]> {
  const COLLECTION_QUERY = `#graphql
    query getCollectionProductsByHandle($handle: String!, $first: Int!) {
      collectionByHandle(handle: $handle) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              images(first: 1) { edges { node { url altText } } }
              variants(first: 1) { edges { node { id price } } }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(COLLECTION_QUERY, {
      variables: { handle, first },
    });

    const body = await response.json();
    const edges = body?.data?.collectionByHandle?.products?.edges || [];

    return normalizeProductEdges(edges).map((node): Product => {
      const variant = node.variants?.edges?.[0]?.node;
      const image = node.images?.edges?.[0]?.node;

      return {
        id: node.id,
        title: node.title || "",
        price: variant?.price ?? "0.00",
        imageUrl: image?.url || "",
        compareAtPrice: undefined,
        variantId: variant?.id || node.id,
        handle: node.handle || "",
      };
    });
  } catch (error) {
    console.error("[Upsell Service] Failed to fetch collection by handle:", error);
    return [];
  }
}
