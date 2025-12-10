/**
 * Unit Tests for PopupManagerCore
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { PopupManagerCore } from "~/domains/storefront/shared/PopupManagerCore";

// Mock extractTriggerConfig
vi.mock("~/shared/utils/trigger-extraction", () => ({
  extractTriggerConfig: vi.fn(() => ({ type: "page_load", delay: 0 })),
}));

describe("PopupManagerCore", () => {
  let localStorageMock: Record<string, string>;
  let sessionStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    sessionStorageMock = {};

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
    });

    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn((key: string) => sessionStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        sessionStorageMock[key] = value;
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const createManager = (callbacks = {}) => {
    return new PopupManagerCore({
      campaigns: [],
      callbacks,
    });
  };

  describe("constructor", () => {
    it("should initialize with empty state", () => {
      const manager = createManager();

      expect(manager.getActiveCampaign()).toBeNull();
      expect(manager.getDismissedCampaigns().size).toBe(0);
      expect(manager.getCooldownCampaigns().size).toBe(0);
    });

    it("should load dismissed campaigns from localStorage", () => {
      localStorageMock["splitpop_dismissed_campaigns"] = JSON.stringify({
        dismissed: ["campaign-1"],
        cooldowns: ["campaign-2"],
      });

      const manager = createManager();

      expect(manager.getDismissedCampaigns().has("campaign-1")).toBe(true);
      expect(manager.getCooldownCampaigns().has("campaign-2")).toBe(true);
    });
  });

  describe("canDisplayCampaign", () => {
    it("should allow preview mode campaigns", () => {
      const manager = createManager();
      const campaign = { id: "test", previewMode: true } as any;

      expect(manager.canDisplayCampaign(campaign)).toBe(true);
    });

    it("should block dismissed campaigns", () => {
      const manager = createManager();
      manager.setDismissedCampaigns(new Set(["campaign-1"]));

      const campaign = { id: "campaign-1" } as any;

      expect(manager.canDisplayCampaign(campaign)).toBe(false);
    });

    it("should block campaigns in cooldown", () => {
      const manager = createManager();
      manager.setCooldownCampaigns(new Set(["campaign-1"]));

      const campaign = { id: "campaign-1" } as any;

      expect(manager.canDisplayCampaign(campaign)).toBe(false);
    });

    it("should use experimentId for tracking when available", () => {
      const manager = createManager();
      manager.setDismissedCampaigns(new Set(["exp-1"]));

      const campaign = { id: "campaign-1", experimentId: "exp-1" } as any;

      expect(manager.canDisplayCampaign(campaign)).toBe(false);
    });
  });

  describe("showPopup", () => {
    it("should set active campaign", async () => {
      const onPopupShow = vi.fn();
      const manager = createManager({ onPopupShow });
      const campaign = { id: "test", campaignId: "campaign-1" } as any;

      const result = await manager.showPopup(campaign);

      expect(result).toBe(true);
      expect(manager.getActiveCampaign()).toBe(campaign);
      expect(onPopupShow).toHaveBeenCalledWith("campaign-1");
    });

    it("should not show if campaign cannot be displayed", async () => {
      const manager = createManager();
      manager.setDismissedCampaigns(new Set(["campaign-1"]));

      const campaign = { id: "campaign-1" } as any;
      const result = await manager.showPopup(campaign);

      expect(result).toBe(false);
    });

    it("should not show if another popup is active", async () => {
      const manager = createManager();
      manager.setActiveCampaign({ id: "existing" } as any);

      const campaign = { id: "new" } as any;
      const result = await manager.showPopup(campaign);

      expect(result).toBe(false);
    });
  });

  describe("closePopup", () => {
    it("should clear active campaign", () => {
      const onPopupClose = vi.fn();
      const manager = createManager({ onPopupClose });
      manager.setActiveCampaign({ id: "test", campaignId: "campaign-1" } as any);

      manager.closePopup();

      expect(manager.getActiveCampaign()).toBeNull();
      expect(onPopupClose).toHaveBeenCalledWith("campaign-1");
    });

    it("should add campaign to dismissed set", () => {
      const manager = createManager();
      manager.setActiveCampaign({ id: "test" } as any);

      manager.closePopup();

      expect(manager.getDismissedCampaigns().has("test")).toBe(true);
    });
  });

  describe("getAvailableCampaigns", () => {
    it("should filter and sort campaigns by priority", () => {
      const manager = createManager();
      const campaigns = [
        { id: "low", priority: 1 },
        { id: "high", priority: 10 },
        { id: "medium", priority: 5 },
      ] as any[];

      const result = manager.getAvailableCampaigns(campaigns);

      expect(result[0].id).toBe("high");
      expect(result[1].id).toBe("medium");
      expect(result[2].id).toBe("low");
    });
  });
});

