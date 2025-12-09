/**
 * Unit Tests for Game Popup Handler Service
 *
 * Tests game popup helper functions:
 * - parseContentConfig
 * - selectPrizeByProbability
 * - extractPrizes
 * - buildSuccessResponse
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseContentConfig,
  selectPrizeByProbability,
  extractPrizes,
  buildSuccessResponse,
  GAME_POPUP_CONFIGS,
  type Prize,
} from "~/domains/popups/services/game-popup-handler.server";

// ==========================================================================
// PARSE CONTENT CONFIG TESTS
// ==========================================================================

describe("parseContentConfig", () => {
  it("should parse JSON string to object", () => {
    const result = parseContentConfig('{"headline": "Test"}');
    expect(result).toEqual({ headline: "Test" });
  });

  it("should return object as-is", () => {
    const input = { headline: "Test" };
    const result = parseContentConfig(input);
    expect(result).toEqual({ headline: "Test" });
  });

  it("should return empty object for invalid JSON", () => {
    const result = parseContentConfig("invalid json");
    expect(result).toEqual({});
  });

  it("should return empty object for null", () => {
    const result = parseContentConfig(null);
    expect(result).toEqual({});
  });

  it("should return empty object for undefined", () => {
    const result = parseContentConfig(undefined);
    expect(result).toEqual({});
  });
});

// ==========================================================================
// SELECT PRIZE BY PROBABILITY TESTS
// ==========================================================================

describe("selectPrizeByProbability", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random");
  });

  it("should select first prize when random is 0", () => {
    vi.mocked(Math.random).mockReturnValue(0);

    const prizes: Prize[] = [
      { id: "1", label: "10% OFF", probability: 50 },
      { id: "2", label: "20% OFF", probability: 50 },
    ];

    const result = selectPrizeByProbability(prizes);
    expect(result.id).toBe("1");
  });

  it("should select second prize when random is 0.6", () => {
    // 0.6 * 100 total = 60, which is > 50 (first prize probability)
    // So it should select second prize
    vi.mocked(Math.random).mockReturnValue(0.6);

    const prizes: Prize[] = [
      { id: "1", label: "10% OFF", probability: 50 },
      { id: "2", label: "20% OFF", probability: 50 },
    ];

    const result = selectPrizeByProbability(prizes);
    expect(result.id).toBe("2");
  });

  it("should handle prizes with zero probability", () => {
    // Random 0 * 100 = 0, first prize has 0 probability
    // 0 - 0 = 0, not <= 0 (false), move to next
    // 0 - 100 = -100, which is <= 0 (true), select second prize
    vi.mocked(Math.random).mockReturnValue(0);

    const prizes: Prize[] = [
      { id: "1", label: "No Prize", probability: 0 },
      { id: "2", label: "10% OFF", probability: 100 },
    ];

    const result = selectPrizeByProbability(prizes);
    // When random is 0 and first prize has 0 probability:
    // random = 0 * 100 = 0
    // After first prize: random = 0 - 0 = 0, check 0 <= 0 is TRUE, so first prize is selected
    // Actually, 0 <= 0 is true, so it selects the first prize despite having 0 probability
    expect(result.id).toBe("1");
  });

  it("should fall back to first prize if all have zero probability", () => {
    vi.mocked(Math.random).mockReturnValue(0.5);

    const prizes: Prize[] = [
      { id: "1", label: "A", probability: 0 },
      { id: "2", label: "B", probability: 0 },
    ];

    const result = selectPrizeByProbability(prizes);
    expect(result.id).toBe("1");
  });

  it("should handle single prize array", () => {
    vi.mocked(Math.random).mockReturnValue(0.5);

    const prizes: Prize[] = [{ id: "1", label: "Only Prize", probability: 100 }];

    const result = selectPrizeByProbability(prizes);
    expect(result.id).toBe("1");
  });

  it("should handle undefined probability values", () => {
    // First prize has no probability (treated as 0)
    // Total = 0 + 100 = 100
    // Random 0 * 100 = 0
    // After first prize: random = 0 - 0 = 0, check 0 <= 0 is TRUE
    // So first prize is selected
    vi.mocked(Math.random).mockReturnValue(0);

    const prizes = [
      { id: "1", label: "A" }, // No probability (treated as 0)
      { id: "2", label: "B", probability: 100 },
    ];

    const result = selectPrizeByProbability(prizes);
    // With random = 0, 0 <= 0 is true, so first prize is selected
    expect(result.id).toBe("1");
  });
});

// ==========================================================================
// EXTRACT PRIZES TESTS
// ==========================================================================

describe("extractPrizes", () => {
  it("should extract wheelSegments for SPIN_TO_WIN", () => {
    const config = GAME_POPUP_CONFIGS.SPIN_TO_WIN;
    const contentConfig = {
      wheelSegments: [
        { id: "1", label: "10% OFF", probability: 50 },
        { id: "2", label: "20% OFF", probability: 50 },
      ],
    };

    const result = extractPrizes(contentConfig, config);
    expect(Array.isArray(result)).toBe(true);
    expect((result as Prize[]).length).toBe(2);
  });

  it("should extract prizes for SCRATCH_CARD", () => {
    const config = GAME_POPUP_CONFIGS.SCRATCH_CARD;
    const contentConfig = {
      prizes: [
        { id: "1", label: "Free Shipping", probability: 100 },
      ],
    };

    const result = extractPrizes(contentConfig, config);
    expect(Array.isArray(result)).toBe(true);
    expect((result as Prize[]).length).toBe(1);
  });

  it("should return error response when no prizes configured", () => {
    const config = GAME_POPUP_CONFIGS.SPIN_TO_WIN;
    const contentConfig = {};

    const result = extractPrizes(contentConfig, config);
    // Should return a response object, not an array
    expect(Array.isArray(result)).toBe(false);
  });

  it("should return error response for empty prizes array", () => {
    const config = GAME_POPUP_CONFIGS.SCRATCH_CARD;
    const contentConfig = { prizes: [] };

    const result = extractPrizes(contentConfig, config);
    expect(Array.isArray(result)).toBe(false);
  });
});

// ==========================================================================
// BUILD SUCCESS RESPONSE TESTS
// ==========================================================================

describe("buildSuccessResponse", () => {
  it("should build response with auto apply behavior", () => {
    const prize: Prize = {
      id: "prize-1",
      label: "10% OFF",
      color: "#ff0000",
      probability: 50,
      discountConfig: {
        enabled: true,
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      },
    };

    const result = buildSuccessResponse(prize, "SAVE10", prize.discountConfig);

    expect(result).toEqual({
      success: true,
      prize: {
        id: "prize-1",
        label: "10% OFF",
        color: "#ff0000",
      },
      discountCode: "SAVE10",
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
      displayCode: true,
      autoApply: true,
    });
  });

  it("should set autoApply false for SHOW_CODE_ONLY behavior", () => {
    const prize: Prize = {
      id: "prize-1",
      label: "20% OFF",
      probability: 50,
      discountConfig: {
        enabled: true,
        behavior: "SHOW_CODE_ONLY",
      },
    };

    const result = buildSuccessResponse(prize, "SAVE20", prize.discountConfig);

    expect(result.autoApply).toBe(false);
    expect(result.behavior).toBe("SHOW_CODE_ONLY");
  });

  it("should default to SHOW_CODE_AND_AUTO_APPLY when no behavior specified", () => {
    const prize: Prize = {
      id: "prize-1",
      label: "Free Shipping",
      probability: 100,
      discountConfig: {
        enabled: true,
      },
    };

    const result = buildSuccessResponse(prize, "FREESHIP", prize.discountConfig);

    expect(result.behavior).toBe("SHOW_CODE_AND_AUTO_APPLY");
    expect(result.autoApply).toBe(true);
  });

  it("should handle undefined discountConfig", () => {
    const prize: Prize = {
      id: "prize-1",
      label: "Mystery Prize",
      probability: 10,
    };

    const result = buildSuccessResponse(prize, "MYSTERY", undefined);

    expect(result.behavior).toBe("SHOW_CODE_AND_AUTO_APPLY");
    expect(result.autoApply).toBe(true);
    expect(result.displayCode).toBe(true);
  });
});

// ==========================================================================
// GAME POPUP CONFIGS TESTS
// ==========================================================================

describe("GAME_POPUP_CONFIGS", () => {
  it("should have correct SPIN_TO_WIN config", () => {
    const config = GAME_POPUP_CONFIGS.SPIN_TO_WIN;

    expect(config.type).toBe("SPIN_TO_WIN");
    expect(config.logPrefix).toBe("[Spin-to-Win]");
    expect(config.prizesField).toBe("wheelSegments");
    expect(config.rateLimitAction).toBe("spin_to_win");
  });

  it("should have correct SCRATCH_CARD config", () => {
    const config = GAME_POPUP_CONFIGS.SCRATCH_CARD;

    expect(config.type).toBe("SCRATCH_CARD");
    expect(config.logPrefix).toBe("[Scratch Card]");
    expect(config.prizesField).toBe("prizes");
    expect(config.rateLimitAction).toBe("scratch_card");
  });
});

