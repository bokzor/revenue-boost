import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "~/db.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";

vi.mock("~/db.server", () => {
  return {
    default: {
      popupEvent: {
        create: vi.fn(),
        groupBy: vi.fn(),
      },
    },
  };
});

const mockPrisma = prisma as unknown as {
  popupEvent: {
    create: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
};

describe("PopupEventService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a VIEW event", async () => {
    await PopupEventService.recordEvent({
      storeId: "store-1",
      campaignId: "camp-1",
      experimentId: null,
      variantKey: null,
      sessionId: "sess-1",
      visitorId: "visitor-1",
      eventType: "VIEW",
      pageUrl: "/",
      referrer: null,
      userAgent: "UA",
      ipAddress: "127.0.0.1",
      deviceType: "desktop",
      metadata: { foo: "bar" },
    });

    expect(mockPrisma.popupEvent.create).toHaveBeenCalledTimes(1);
    const args = (mockPrisma.popupEvent.create as any).mock.calls[0][0];
    expect(args.data.storeId).toBe("store-1");
    expect(args.data.campaignId).toBe("camp-1");
    expect(args.data.eventType).toBe("VIEW");
  });

  it("aggregates impressions by campaign", async () => {
    (mockPrisma.popupEvent.groupBy as any).mockResolvedValueOnce([
      { campaignId: "camp-1", _count: { id: 5 } },
      { campaignId: "camp-2", _count: { id: 2 } },
    ]);

    const result = await PopupEventService.getImpressionCountsByCampaign([
      "camp-1",
      "camp-2",
      "camp-3",
    ]);

    expect(result.get("camp-1")).toBe(5);
    expect(result.get("camp-2")).toBe(2);
    // Campaign with no impressions should simply be absent from the map
    expect(result.has("camp-3")).toBe(false);

    expect(mockPrisma.popupEvent.groupBy).toHaveBeenCalledTimes(1);
  });

  it("aggregates submits by campaign", async () => {
    (mockPrisma.popupEvent.groupBy as any).mockResolvedValueOnce([
      { campaignId: "camp-1", _count: { id: 3 } },
    ]);

    const result = await PopupEventService.getSubmitCountsByCampaign([
      "camp-1",
      "camp-2",
    ]);

    expect(result.get("camp-1")).toBe(3);
    expect(result.has("camp-2")).toBe(false);
    expect(mockPrisma.popupEvent.groupBy).toHaveBeenCalledTimes(1);
  });

  it("aggregates clicks by campaign", async () => {
    (mockPrisma.popupEvent.groupBy as any).mockResolvedValueOnce([
      { campaignId: "camp-1", _count: { id: 7 } },
    ]);

    const result = await PopupEventService.getClickCountsByCampaign([
      "camp-1",
      "camp-2",
    ]);

    expect(result.get("camp-1")).toBe(7);
    expect(result.has("camp-2")).toBe(false);
    expect(mockPrisma.popupEvent.groupBy).toHaveBeenCalledTimes(1);
  });


  it("computes funnel stats (views -> submits -> coupons) per campaign", async () => {
    (mockPrisma.popupEvent.groupBy as any)
      .mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 10 } },
        { campaignId: "camp-2", _count: { id: 5 } },
      ])
      .mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 4 } },
      ])
      .mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 2 } },
        { campaignId: "camp-2", _count: { id: 1 } },
      ]);

    const stats = await PopupEventService.getFunnelStatsByCampaign([
      "camp-1",
      "camp-2",
    ]);

    const camp1 = stats.get("camp-1");
    const camp2 = stats.get("camp-2");

    expect(camp1).toEqual({ views: 10, submits: 4, couponsIssued: 2 });
    expect(camp2).toEqual({ views: 5, submits: 0, couponsIssued: 1 });
    expect(mockPrisma.popupEvent.groupBy).toHaveBeenCalledTimes(3);
  });
});

