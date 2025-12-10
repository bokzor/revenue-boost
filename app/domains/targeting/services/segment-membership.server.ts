import { logger } from "~/lib/logger.server";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { logger } from "~/lib/logger.server";
import prisma from "~/db.server";

interface CustomerSegmentMembersResponse {
  data?: {
    customerSegmentMembers?: {
      edges: { node: { id: string } }[];
      pageInfo: { hasNextPage: boolean; endCursor?: string | null };
    };
  };
  errors?: { message: string }[];
}

const CUSTOMER_SEGMENT_MEMBERS_QUERY = `
  query CustomerSegmentMembers($segmentId: ID!, $first: Int!, $after: String) {
    customerSegmentMembers(segmentId: $segmentId, first: $first, after: $after) {
      edges {
        node { id }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function syncSegmentMembershipsForSegment(opts: {
  storeId: string;
  shopifySegmentId: string;
  admin: AdminApiContext;
}): Promise<void> {
  const { storeId, shopifySegmentId, admin } = opts;
  const BATCH_SIZE = 200;

  // Reset existing memberships for this segment to avoid stale rows
  await prisma.segmentMembership.deleteMany({
    where: { storeId, shopifySegmentId },
  });

  let hasNextPage = true;
  let after: string | null = null;

  while (hasNextPage) {
    const response = await admin.graphql(CUSTOMER_SEGMENT_MEMBERS_QUERY, {
      variables: { segmentId: shopifySegmentId, first: BATCH_SIZE, after },
    });

    const json = (await response.json()) as CustomerSegmentMembersResponse;

    if (json.errors && json.errors.length > 0) {
      console.error("[SegmentMembership] GraphQL errors", json.errors);
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    const members = json.data?.customerSegmentMembers;
    if (!members) break;

    const edges = members.edges ?? [];
    const pageInfo = members.pageInfo ?? {
      hasNextPage: false,
      endCursor: null,
    };

    if (edges.length === 0) {
      hasNextPage = false;
      break;
    }

    const data = edges
      .map((edge) => {
        const gid = edge.node.id; // e.g. gid://shopify/Customer/123456789
        const parts = gid.split("/");
        const idPart = parts[parts.length - 1];
        try {
          const customerId = BigInt(idPart);
          return {
            storeId,
            shopifySegmentId,
            shopifyCustomerId: customerId,
          };
        } catch (error) {
          console.warn("[SegmentMembership] Failed to parse customer GID", {
            gid,
            error,
          });
          return null;
        }
      })
      .filter(
        (
          row
        ): row is {
          storeId: string;
          shopifySegmentId: string;
          shopifyCustomerId: bigint;
        } => row !== null
      );

    if (data.length > 0) {
      await prisma.segmentMembership.createMany({ data, skipDuplicates: true });
    }

    hasNextPage = pageInfo.hasNextPage;
    after = pageInfo.endCursor ?? null;
  }
}

export async function syncSegmentMembershipsForStore(opts: {
  storeId: string;
  segmentIds: string[];
  admin: AdminApiContext;
}): Promise<void> {
  const { storeId, segmentIds, admin } = opts;
  for (const segmentId of segmentIds) {
    await syncSegmentMembershipsForSegment({
      storeId,
      shopifySegmentId: segmentId,
      admin,
    });
  }
}

export async function hasSegmentMembershipData(opts: {
  storeId: string;
  segmentIds: string[];
}): Promise<boolean> {
  const { storeId, segmentIds } = opts;
  if (segmentIds.length === 0) return false;

  const count = await prisma.segmentMembership.count({
    where: {
      storeId,
      shopifySegmentId: { in: segmentIds },
    },
  });

  return count > 0;
}

export async function isCustomerInAnyShopifySegment(opts: {
  storeId: string;
  shopifyCustomerId: bigint;
  segmentIds: string[];
}): Promise<boolean> {
  const { storeId, shopifyCustomerId, segmentIds } = opts;
  if (segmentIds.length === 0) return true;

  const count = await prisma.segmentMembership.count({
    where: {
      storeId,
      shopifyCustomerId,
      shopifySegmentId: { in: segmentIds },
    },
  });

  return count > 0;
}

export async function getCustomerShopifySegments(opts: {
  storeId: string;
  shopifyCustomerId: bigint;
}): Promise<string[]> {
  const { storeId, shopifyCustomerId } = opts;

  const rows = await prisma.segmentMembership.findMany({
    where: { storeId, shopifyCustomerId },
    select: { shopifySegmentId: true },
  });

  return rows.map((row) => row.shopifySegmentId);
}
