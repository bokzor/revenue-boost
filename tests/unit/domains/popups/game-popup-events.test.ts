/**
 * Game Popup Event Recording Tests
 *
 * Tests for SUBMIT and COUPON_ISSUED event recording in game popups
 * (Spin-to-Win, Scratch Card). These events are critical for:
 * - Analytics tracking
 * - Revenue attribution (view-through attribution requires engagement)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies before imports
vi.mock("~/shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn(),
    },
  },
}));

vi.mock("~/db.server", () => ({
  default: {
    lead: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("~/domains/analytics/popup-events.server", () => ({
  PopupEventService: {
    recordEvent: vi.fn(),
  },
}));

vi.mock("~/domains/commerce/services/discount.server", () => ({
  getCampaignDiscountCode: vi.fn(),
}));

vi.mock("~/lib/validation-helpers", () => ({
  formatZodErrors: vi.fn(),
}));

import prisma from "~/db.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import {
  storeLead,
  type GamePopupConfig,
  type Prize,
} from "~/domains/popups/services/game-popup-handler.server";

const leadCreateMock = prisma.lead.create as unknown as ReturnType<typeof vi.fn>;
const leadUpsertMock = prisma.lead.upsert as unknown as ReturnType<typeof vi.fn>;
const recordEventMock = PopupEventService.recordEvent as unknown as ReturnType<typeof vi.fn>;

// Test fixtures
const mockConfig: GamePopupConfig = {
  type: "SPIN_TO_WIN",
  logPrefix: "[Spin-to-Win]",
  rateLimitAction: "spin_to_win",
  prizesField: "wheelSegments",
  noPrizesError: "No wheel segments configured",
};

const mockCampaignData = {
  id: "campaign-123",
  storeId: "store-456",
  name: "Test Campaign",
};

const mockPrize: Prize = {
  id: "prize-1",
  label: "10% OFF",
  probability: 0.5,
  discountConfig: { enabled: true, behavior: "SHOW_CODE_AND_AUTO_APPLY" },
};

describe("Game Popup Event Recording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("storeLead", () => {
    it("should return lead ID when lead is created with email", async () => {
      const mockLeadId = "lead-789";
      leadUpsertMock.mockResolvedValue({ id: mockLeadId });

      const result = await storeLead(
        mockCampaignData,
        mockPrize,
        "SPIN-ABC123",
        "test@example.com",
        "session-xyz",
        "spin_to_win_popup",
        mockConfig
      );

      expect(result).toEqual({ id: mockLeadId });
      expect(leadUpsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            storeId_campaignId_email: {
              storeId: "store-456",
              campaignId: "campaign-123",
              email: "test@example.com",
            },
          },
          select: { id: true },
        })
      );
    });

    it("should return lead ID when anonymous lead is created", async () => {
      const mockLeadId = "lead-anon-123";
      leadCreateMock.mockResolvedValue({ id: mockLeadId });

      const result = await storeLead(
        mockCampaignData,
        mockPrize,
        "SCRATCH-XYZ789",
        undefined, // No email
        "session-abc",
        "scratch_card_popup",
        { ...mockConfig, type: "SCRATCH_CARD", logPrefix: "[Scratch Card]" }
      );

      expect(result).toEqual({ id: mockLeadId });
      expect(leadCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "session_session-abc@anonymous.local",
            discountCode: "SCRATCH-XYZ789",
          }),
          select: { id: true },
        })
      );
    });

    it("should return null when lead creation fails", async () => {
      leadUpsertMock.mockRejectedValue(new Error("Database error"));

      const result = await storeLead(
        mockCampaignData,
        mockPrize,
        "SPIN-FAIL",
        "test@example.com",
        "session-fail",
        "spin_to_win_popup",
        mockConfig
      );

      expect(result).toBeNull();
    });
  });
});

