import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader as upsellLoader } from "~/routes/api.upsell-products";

// We mock authenticate.public.appProxy, CampaignService and getStoreIdFromShop
vi.mock("~/shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn(),
    },
  },
}));

vi.mock("~/domains/campaigns/index.server", () => ({
  CampaignService: {
    getCampaignById: vi.fn(),
  },
}));

vi.mock("~/lib/auth-helpers.server", () => ({
  getStoreIdFromShop: vi.fn(),
}));

const authenticateMock = (await import("~/shopify.server"))
  .authenticate.public.appProxy as unknown as ReturnType<typeof vi.fn>;
const { CampaignService } = await import("~/domains/campaigns/index.server");
const { getStoreIdFromShop } = await import("~/lib/auth-helpers.server");
const getStoreIdFromShopMock = getStoreIdFromShop as unknown as ReturnType<typeof vi.fn>;

describe("api.upsell-products loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when campaignId is missing", async () => {
    const request = new Request("https://example.com/api/upsell-products");

    const result = (await upsellLoader({ request } as any)) as any;

    expect(result.init?.status).toBe(400);
    expect(result.data?.error).toBe("Invalid query");
  });

  it("returns empty products when manual selection has no selectedProducts", async () => {
    authenticateMock.mockResolvedValue({ admin: {} });
    getStoreIdFromShopMock.mockResolvedValue("store-1");
    (CampaignService.getCampaignById as any).mockResolvedValue({
      id: "camp-1",
      storeId: "store-1",
      contentConfig: {
        productSelectionMethod: "manual",
        selectedProducts: [],
      },
    });

    const request = new Request(
      "https://example.com/api/upsell-products?campaignId=camp-1&shop=test.myshopify.com",
    );

    const result = (await upsellLoader({ request } as any)) as any;

    expect(result.data?.products).toEqual([]);
  });

  it("returns empty products when collection method has no selectedCollection", async () => {
    authenticateMock.mockResolvedValue({ admin: {} });
    getStoreIdFromShopMock.mockResolvedValue("store-1");
    (CampaignService.getCampaignById as any).mockResolvedValue({
      id: "camp-2",
      storeId: "store-1",
      contentConfig: {
        productSelectionMethod: "collection",
        // selectedCollection missing on purpose
      },
    });

    const request = new Request(
      "https://example.com/api/upsell-products?campaignId=camp-2&shop=test.myshopify.com",
    );

    const result = (await upsellLoader({ request } as any)) as any;

    expect(result.data?.products).toEqual([]);
  });

});

