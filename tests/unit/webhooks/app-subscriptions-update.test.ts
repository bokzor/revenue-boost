/**
 * App Subscriptions Update Webhook Tests
 *
 * Tests for handling Shopify APP_SUBSCRIPTIONS_UPDATE webhook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import prisma from "~/db.server";

// Mock authenticate
vi.mock("~/shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
  BILLING_PLANS: {
    STARTER: "Starter",
    GROWTH: "Growth",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
  },
}));

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    store: {
      updateMany: vi.fn(),
    },
  },
}));

import { authenticate } from "~/shopify.server";
import { action } from "~/routes/webhooks.app.subscriptions.update";

describe("APP_SUBSCRIPTIONS_UPDATE Webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = () => new Request("https://example.com/webhooks/app/subscriptions/update", {
    method: "POST",
    body: JSON.stringify({}),
  });

  // Helper to create ActionFunctionArgs with all required properties
  const createActionArgs = (request: Request) => ({
    request,
    params: {},
    context: {},
    unstable_pattern: "/webhooks/app/subscriptions/update",
  });

  it("should update store to GROWTH plan when subscription is ACTIVE", async () => {
    vi.mocked(authenticate.webhook).mockResolvedValue({
      shop: "test-store.myshopify.com",
      topic: "APP_SUBSCRIPTIONS_UPDATE",
      payload: {
        app_subscription: {
          admin_graphql_api_id: "gid://shopify/AppSubscription/123",
          name: "Growth",
          status: "ACTIVE",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          currency: "USD",
        },
      },
    } as any);

    vi.mocked(prisma.store.updateMany).mockResolvedValue({ count: 1 });

    const response = await action(createActionArgs(createRequest()));

    expect(prisma.store.updateMany).toHaveBeenCalledWith({
      where: { shopifyDomain: "test-store.myshopify.com" },
      data: expect.objectContaining({
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionId: "gid://shopify/AppSubscription/123",
        shopifySubscriptionStatus: "ACTIVE",
        shopifySubscriptionName: "Growth",
      }),
    });

    expect(response.status).toBe(200);
  });

  it("should update store to FREE plan when subscription is CANCELLED", async () => {
    vi.mocked(authenticate.webhook).mockResolvedValue({
      shop: "test-store.myshopify.com",
      topic: "APP_SUBSCRIPTIONS_UPDATE",
      payload: {
        app_subscription: {
          admin_graphql_api_id: "gid://shopify/AppSubscription/123",
          name: "Growth",
          status: "CANCELLED",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          currency: "USD",
        },
      },
    } as any);

    vi.mocked(prisma.store.updateMany).mockResolvedValue({ count: 1 });

    const response = await action(createActionArgs(createRequest()));

    expect(prisma.store.updateMany).toHaveBeenCalledWith({
      where: { shopifyDomain: "test-store.myshopify.com" },
      data: expect.objectContaining({
        planTier: "FREE",
        planStatus: "CANCELLED",
        shopifySubscriptionId: null,
        shopifySubscriptionName: null,
      }),
    });

    expect(response.status).toBe(200);
  });

  it("should update store to FREE when subscription is EXPIRED", async () => {
    vi.mocked(authenticate.webhook).mockResolvedValue({
      shop: "test-store.myshopify.com",
      topic: "APP_SUBSCRIPTIONS_UPDATE",
      payload: {
        app_subscription: {
          admin_graphql_api_id: "gid://shopify/AppSubscription/456",
          name: "Pro",
          status: "EXPIRED",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          currency: "USD",
        },
      },
    } as any);

    vi.mocked(prisma.store.updateMany).mockResolvedValue({ count: 1 });

    const response = await action(createActionArgs(createRequest()));

    expect(prisma.store.updateMany).toHaveBeenCalledWith({
      where: { shopifyDomain: "test-store.myshopify.com" },
      data: expect.objectContaining({
        planTier: "FREE",
        planStatus: "CANCELLED",
      }),
    });

    expect(response.status).toBe(200);
  });

  it("should return 400 when no payload is provided", async () => {
    vi.mocked(authenticate.webhook).mockResolvedValue({
      shop: "test-store.myshopify.com",
      topic: "APP_SUBSCRIPTIONS_UPDATE",
      payload: null,
    } as any);

    const response = await action(createActionArgs(createRequest()));

    expect(response.status).toBe(400);
  });

  it("should return 400 when payload has no app_subscription", async () => {
    vi.mocked(authenticate.webhook).mockResolvedValue({
      shop: "test-store.myshopify.com",
      topic: "APP_SUBSCRIPTIONS_UPDATE",
      payload: {},
    } as any);

    const response = await action(createActionArgs(createRequest()));

    expect(response.status).toBe(400);
  });
});

