/**
 * Orders Create Webhook Tests
 *
 * Tests for revenue attribution logic in ORDERS_CREATE webhook:
 * - Discount code attribution (highest confidence)
 * - View-through attribution via Lead lookup (requires actual user engagement)
 * - Edge cases and error handling
 *
 * Note: VIEW-only PopupEvent attribution was removed as passive views are
 * not a strong enough signal for revenue attribution. Only Lead-based
 * attribution (which requires form submission) is used for view-through.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock Prisma before importing the handler
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
    },
    campaign: {
      findMany: vi.fn(),
    },
    campaignConversion: {
      create: vi.fn(),
    },
  },
}));

// Mock normalizeDiscountConfig to return the config with prefix
vi.mock("~/domains/commerce/services/discount.server", () => ({
  normalizeDiscountConfig: vi.fn((cfg: any) => {
    if (!cfg) return null;
    // Handle JSON string input (as stored in DB)
    let parsed = cfg;
    if (typeof cfg === "string") {
      try {
        parsed = JSON.parse(cfg);
      } catch {
        return null;
      }
    }
    return {
      enabled: parsed.enabled ?? false,
      type: parsed.type ?? "single_use",
      valueType: parsed.valueType ?? "PERCENTAGE",
      value: parsed.value ?? 10,
      prefix: parsed.prefix ?? parsed.code ?? null, // Use code as prefix for static codes
      behavior: parsed.behavior ?? "SHOW_CODE_AND_AUTO_APPLY",
      showInPreview: parsed.showInPreview ?? true,
      ...parsed,
    };
  }),
}));

import prisma from "~/db.server";
import { handleOrderCreate, type OrderPayload } from "~/webhooks/orders.create";

// Type helpers for mocks
const storeFindUniqueMock = prisma.store.findUnique as unknown as ReturnType<typeof vi.fn>;
const leadFindFirstMock = prisma.lead.findFirst as unknown as ReturnType<typeof vi.fn>;
const campaignFindManyMock = prisma.campaign.findMany as unknown as ReturnType<typeof vi.fn>;
const conversionCreateMock = prisma.campaignConversion.create as unknown as ReturnType<typeof vi.fn>;

// Test data factories
const createStore = (overrides = {}) => ({
  id: "store-123",
  shopifyDomain: "test-store.myshopify.com",
  ...overrides,
});

const createLead = (overrides = {}) => ({
  id: "lead-123",
  storeId: "store-123",
  campaignId: "campaign-456",
  email: "test@example.com",
  discountCode: "SPIN-ABC123",
  shopifyCustomerId: BigInt(9876543210),
  sessionId: "session-xyz",
  campaign: { id: "campaign-456", status: "ACTIVE" },
  createdAt: new Date(),
  ...overrides,
});

const createOrderPayload = (overrides: Partial<OrderPayload> = {}): OrderPayload => ({
  id: 1001,
  name: "#1001",
  total_price: "99.99",
  currency: "USD",
  customer: { id: 9876543210 },
  discount_codes: [],
  source_name: "web",
  ...overrides,
});

describe("Orders Create Webhook - handleOrderCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: store exists
    storeFindUniqueMock.mockResolvedValue(createStore());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Store Lookup", () => {
    it("should exit early if store is not found", async () => {
      storeFindUniqueMock.mockResolvedValue(null);

      await handleOrderCreate("unknown-store.myshopify.com", createOrderPayload());

      expect(leadFindFirstMock).not.toHaveBeenCalled();
      expect(conversionCreateMock).not.toHaveBeenCalled();
    });
  });

  describe("Discount Code Attribution", () => {
    it("should attribute conversion when discount code matches a lead", async () => {
      const lead = createLead({ discountCode: "SPIN-ABC123" });
      leadFindFirstMock.mockResolvedValue(lead);
      conversionCreateMock.mockResolvedValue({ id: "conversion-1" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "SPIN-ABC123", amount: "10.00", type: "percentage" }],
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignId: "campaign-456",
          orderId: "1001",
          discountCodes: ["SPIN-ABC123"],
          source: "discount_code",
        }),
      });
    });

    it("should attribute to campaign by prefix match when no lead found", async () => {
      leadFindFirstMock.mockResolvedValue(null);
      campaignFindManyMock.mockResolvedValue([
        { id: "campaign-789", discountConfig: { prefix: "WELCOME-" } },
      ]);
      conversionCreateMock.mockResolvedValue({ id: "conversion-2" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "WELCOME-XYZ", amount: "15.00", type: "percentage" }],
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignId: "campaign-789",
          source: "discount_code",
        }),
      });
    });

    it("should attribute to campaign by static code match", async () => {
      leadFindFirstMock.mockResolvedValue(null);
      campaignFindManyMock.mockResolvedValue([
        { id: "campaign-static", discountConfig: { code: "FLASH20" } },
      ]);
      conversionCreateMock.mockResolvedValue({ id: "conversion-3" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "FLASH20", amount: "20.00", type: "percentage" }],
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignId: "campaign-static",
          discountCodes: ["FLASH20"],
          source: "discount_code",
        }),
      });
    });

    it("should not try view-through when discount code is attributed", async () => {
      const lead = createLead({ discountCode: "SPIN-ABC123" });
      leadFindFirstMock.mockResolvedValue(lead);
      conversionCreateMock.mockResolvedValue({ id: "conversion-1" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "SPIN-ABC123", amount: "10.00", type: "percentage" }],
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      // Should only call leadFindFirst once (for discount code lookup)
      // Not again for view-through attribution
      expect(leadFindFirstMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("View-Through Attribution", () => {
    it("should attribute via customer ID when lead exists with shopifyCustomerId", async () => {
      // Reset mocks for this specific test
      vi.clearAllMocks();
      storeFindUniqueMock.mockResolvedValue(createStore());

      // View-through attribution: Lead found by customer ID
      const customerLead = createLead({
        shopifyCustomerId: BigInt(9876543210),
        discountCode: "UNUSED-CODE",
      });

      // leadFindFirst is called once in view-through (by shopifyCustomerId)
      leadFindFirstMock.mockResolvedValue(customerLead);
      conversionCreateMock.mockResolvedValue({ id: "conversion-view" });

      const payload = createOrderPayload({
        discount_codes: [], // No discount used
        customer: { id: 9876543210 },
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignId: "campaign-456",
          discountCodes: [], // Empty since no code was used
          source: "view_through_with_code", // Had code but didn't use it
          customerId: "9876543210",
        }),
      });
    });

    it("should attribute via customer ID for newsletter lead without discount", async () => {
      // Reset mocks for this specific test
      vi.clearAllMocks();
      storeFindUniqueMock.mockResolvedValue(createStore());

      const newsletterLead = createLead({
        shopifyCustomerId: BigInt(9876543210),
        discountCode: null, // Newsletter without discount
      });

      leadFindFirstMock.mockResolvedValue(newsletterLead);
      conversionCreateMock.mockResolvedValue({ id: "conversion-newsletter" });

      const payload = createOrderPayload({
        discount_codes: [],
        customer: { id: 9876543210 },
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          source: "view_through", // No code was ever issued
        }),
      });
    });

    it("should not attribute when no customer ID is available (guest checkout)", async () => {
      // Reset mocks for this specific test
      vi.clearAllMocks();
      storeFindUniqueMock.mockResolvedValue(createStore());
      leadFindFirstMock.mockResolvedValue(null);

      const payload = createOrderPayload({
        discount_codes: [],
        customer: undefined, // Guest checkout
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      // Should not try view-through without customer ID
      // Lead lookup requires shopifyCustomerId which comes from customer.id
      expect(conversionCreateMock).not.toHaveBeenCalled();
    });

    it("should not attribute when no matching lead found", async () => {
      // Reset mocks for this specific test
      vi.clearAllMocks();
      storeFindUniqueMock.mockResolvedValue(createStore());
      leadFindFirstMock.mockResolvedValue(null);

      const payload = createOrderPayload({
        discount_codes: [],
        customer: { id: 9876543210 },
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      // No lead found = no attribution (we don't attribute VIEW-only events)
      expect(conversionCreateMock).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty discount_codes array", async () => {
      leadFindFirstMock.mockResolvedValue(null);

      const payload = createOrderPayload({
        discount_codes: [],
        customer: { id: 123 },
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      // Should still check view-through
      expect(leadFindFirstMock).toHaveBeenCalled();
    });

    it("should handle undefined discount_codes", async () => {
      leadFindFirstMock.mockResolvedValue(null);

      const payload = createOrderPayload({
        customer: { id: 123 },
      });
      // @ts-expect-error - testing undefined case
      payload.discount_codes = undefined;

      await handleOrderCreate("test-store.myshopify.com", payload);

      // Should still check view-through via lead lookup
      expect(leadFindFirstMock).toHaveBeenCalled();
    });

    it("should handle duplicate order (P2002 error) gracefully", async () => {
      const lead = createLead();
      leadFindFirstMock.mockResolvedValue(lead);

      // Simulate unique constraint violation
      const prismaError = new Error("Unique constraint failed");
      (prismaError as any).code = "P2002";
      conversionCreateMock.mockRejectedValue(prismaError);

      const payload = createOrderPayload({
        discount_codes: [{ code: "SPIN-ABC123", amount: "10.00", type: "percentage" }],
      });

      // Should not throw
      await expect(
        handleOrderCreate("test-store.myshopify.com", payload)
      ).resolves.not.toThrow();
    });

    it("should handle JSON discountConfig", async () => {
      leadFindFirstMock.mockResolvedValue(null);
      campaignFindManyMock.mockResolvedValue([
        { id: "campaign-json", discountConfig: '{"prefix": "JSON-"}' },
      ]);
      conversionCreateMock.mockResolvedValue({ id: "conversion-json" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "JSON-123", amount: "5.00", type: "percentage" }],
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignId: "campaign-json",
        }),
      });
    });

    it("should use default prefix for codes without explicit prefix", async () => {
      leadFindFirstMock.mockResolvedValue(null);
      campaignFindManyMock.mockResolvedValue([
        { id: "campaign-default", discountConfig: {} }, // No prefix set
      ]);
      conversionCreateMock.mockResolvedValue({ id: "conversion-default" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "REVENUE-BOOST-XYZ", amount: "10.00", type: "percentage" }],
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          campaignId: "campaign-default",
        }),
      });
    });
  });

  describe("Spin To Win / Scratch Card Attribution", () => {
    it("should attribute Spin To Win conversion via unique code in Lead", async () => {
      const spinToWinLead = createLead({
        discountCode: "SPIN-USER123-5OFF",
        shopifyCustomerId: BigInt(111222333),
      });
      leadFindFirstMock.mockResolvedValue(spinToWinLead);
      conversionCreateMock.mockResolvedValue({ id: "spin-conversion" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "SPIN-USER123-5OFF", amount: "5.00", type: "percentage" }],
        customer: { id: 111222333 },
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          discountCodes: ["SPIN-USER123-5OFF"],
          source: "discount_code",
          customerId: "111222333",
        }),
      });
    });

    it("should attribute Scratch Card conversion via unique code in Lead", async () => {
      const scratchCardLead = createLead({
        discountCode: "SCRATCH-ABC-10PCT",
        shopifyCustomerId: BigInt(444555666),
      });
      leadFindFirstMock.mockResolvedValue(scratchCardLead);
      conversionCreateMock.mockResolvedValue({ id: "scratch-conversion" });

      const payload = createOrderPayload({
        discount_codes: [{ code: "SCRATCH-ABC-10PCT", amount: "10.00", type: "percentage" }],
        customer: { id: 444555666 },
      });

      await handleOrderCreate("test-store.myshopify.com", payload);

      expect(conversionCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          discountCodes: ["SCRATCH-ABC-10PCT"],
          source: "discount_code",
        }),
      });
    });
  });
});

