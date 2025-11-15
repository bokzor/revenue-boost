import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks so we can inspect inputs passed to Shopify discount creation
vi.mock("~/db.server", () => {
  const campaign = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  return { default: { campaign } };
});

vi.mock("~/lib/shopify/discount.server", () => ({
  createDiscountCode: vi.fn(),
  createBxGyDiscountCode: vi.fn(),
  getDiscountCode: vi.fn(),
}));

vi.mock("~/lib/shopify/customer.server", () => ({
  findCustomerByEmail: vi
    .fn()
    .mockResolvedValue({ customer: { id: "gid://shopify/Customer/1" }, errors: [] }),
  createCustomer: vi.fn(),
}));

import prisma from "~/db.server";
import * as shopifyDiscountModule from "~/lib/shopify/discount.server";
import {
  getCampaignDiscountCode,
  createEmailSpecificDiscount,
} from "~/domains/commerce/services/discount.server";

describe("DiscountService applicability wiring", () => {
  const admin: any = {}; // AdminApiContext is not used because Shopify calls are mocked

  beforeEach(() => {
    vi.clearAllMocks();

    const createDiscountCodeMock = vi.mocked(
      shopifyDiscountModule.createDiscountCode,
    );
    createDiscountCodeMock.mockResolvedValue({
      discount: { id: "gid://shopify/DiscountCode/1" },
      errors: undefined,
    });

    // Default campaign lookup used by getCampaignDiscountCode
    (prisma.campaign.findUnique as any).mockResolvedValue({
      id: "campaign-1",
      name: "Test Campaign",
      discountConfig: "{}",
      storeId: "store-1",
    });

    (prisma.campaign.update as any).mockResolvedValue({});
  });

  it("passes applicability to shared discount creation", async () => {
    const config: any = {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 10,
      prefix: "WELCOME",
      deliveryMode: "show_code_always",
      applicability: {
        scope: "products",
        productIds: [
          "gid://shopify/Product/1",
          "gid://shopify/Product/2",
        ],
      },
    };

    await getCampaignDiscountCode(admin, "store-1", "campaign-1", config);

    const createDiscountCodeMock = vi.mocked(
      shopifyDiscountModule.createDiscountCode,
    );
    expect(createDiscountCodeMock).toHaveBeenCalledTimes(1);
    const [, input] = createDiscountCodeMock.mock.calls[0];
    expect(input.applicability).toEqual(config.applicability);
  });

  it("passes applicability to single-use discount creation", async () => {
    const config: any = {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
      prefix: "ONEOFF",
      deliveryMode: "show_code_always",
      applicability: {
        scope: "collections",
        collectionIds: ["gid://shopify/Collection/1"],
      },
    };

    await getCampaignDiscountCode(
      admin,
      "store-1",
      "campaign-1",
      config,
      "user@example.com",
    );

    const createDiscountCodeMock = vi.mocked(
      shopifyDiscountModule.createDiscountCode,
    );
    expect(createDiscountCodeMock).toHaveBeenCalledTimes(1);
    const [, input] = createDiscountCodeMock.mock.calls[0];
    expect(input.applicability).toEqual(config.applicability);
  });

  it("passes applicability to email-authorized discount creation", async () => {
    const config: any = {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 20,
      prefix: "EMAIL",
      deliveryMode: "show_in_popup_authorized_only",
      applicability: {
        scope: "products",
        productIds: ["gid://shopify/Product/3"],
      },
    };

    const result = await createEmailSpecificDiscount(
      admin,
      "user@example.com",
      {
        id: "campaign-1",
        name: "Test Campaign",
        discountConfig: "{}",
        storeId: "store-1",
      } as any,
      config,
    );

    expect(result.success).toBe(true);
    const createDiscountCodeMock = vi.mocked(
      shopifyDiscountModule.createDiscountCode,
    );
    expect(createDiscountCodeMock).toHaveBeenCalledTimes(1);
    const [, input] = createDiscountCodeMock.mock.calls[0];
    expect(input.applicability).toEqual(config.applicability);
  });
});

