import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router";

// Mock Prisma + auth helpers before importing the route module
vi.mock("~/db.server", () => ({
  default: {
    customerSegment: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("~/lib/auth-helpers.server", () => ({
  getStoreId: vi.fn(),
}));

import prisma from "~/db.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { loader } from "~/routes/api.segments";

describe("GET /api/segments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns global + store segments for an authenticated store", async () => {
    (getStoreId as unknown as ReturnType<typeof vi.fn>).mockResolvedValue("store-1");

    (prisma.customerSegment.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "seg-store",
        storeId: "store-1",
        name: "Custom Segment",
        description: "Store-specific segment",
        icon: "⭐",
        priority: 5,
        isDefault: false,
        isActive: true,
      },
      {
        id: "seg-global",
        storeId: null,
        name: "New Visitor",
        description: "Global segment",
        icon: "👋",
        priority: 1,
        isDefault: true,
        isActive: true,
      },
    ] as any);

    const request = new Request("http://localhost/api/segments");

    const response = await loader({ request } as unknown as LoaderFunctionArgs);
    const apiResponse = (response as any).data;

    expect(apiResponse.success).toBe(true);
    expect(apiResponse.data.segments).toHaveLength(2);
    expect(apiResponse.data.segments[0]).toMatchObject({
      id: "seg-store",
      name: "Custom Segment",
      description: "Store-specific segment",
      icon: "⭐",
      priority: 5,
    });
  });

  it("falls back to global default segments when storeId is not available", async () => {
    (getStoreId as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no store"));

    (prisma.customerSegment.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "seg-global",
        storeId: null,
        name: "New Visitor",
        description: "Global segment",
        icon: "👋",
        priority: 1,
        isDefault: true,
        isActive: true,
      },
    ] as any);

    const request = new Request("http://localhost/api/segments");

    const response = await loader({ request } as unknown as LoaderFunctionArgs);
    const apiResponse = (response as any).data;

    expect(apiResponse.success).toBe(true);
    expect(apiResponse.data.segments).toHaveLength(1);
    expect(apiResponse.data.segments[0]).toMatchObject({
      id: "seg-global",
      name: "New Visitor",
    });

    // Ensure the query restricted to global default segments
    const callArg = (prisma.customerSegment.findMany as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.where).toMatchObject({
      storeId: null,
      isDefault: true,
      isActive: true,
    });
  });
});

