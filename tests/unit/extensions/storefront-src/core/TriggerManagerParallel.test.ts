/**
 * TriggerManager Parallel Execution Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TriggerManager } from "../../../../../extensions/storefront-src/core/TriggerManager";

describe("TriggerManager Parallel Execution", () => {
    let manager: TriggerManager;
    let originalWindow: unknown;

    beforeEach(() => {
        manager = new TriggerManager();

        // Mock window environment
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g: any = globalThis as any;
        originalWindow = g.window;
        if (!g.window) {
            g.window = {};
        }
        if (typeof g.window.setTimeout !== "function") {
            g.window.setTimeout = setTimeout;
        }
        if (typeof g.window.clearTimeout !== "function") {
            g.window.clearTimeout = clearTimeout;
        }
    });

    afterEach(() => {
        // Restore original window reference
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).window = originalWindow as any;
    });

    it("should resolve OR logic immediately when one trigger passes, even if another hangs", async () => {
        const campaign = {
            id: "test-campaign-or-parallel",
            clientTriggers: {
                enhancedTriggers: {
                    page_load: {
                        enabled: true,
                        delay: 0,
                    },
                    scroll_depth: {
                        enabled: true,
                        depth_percentage: 50,
                    },
                    trigger_combination: {
                        operator: "OR" as const,
                    },
                },
            },
        };

        // Mock checkPageLoad to resolve immediately with true
        vi.spyOn(
            manager as unknown as { checkPageLoad: () => Promise<boolean> },
            "checkPageLoad"
        ).mockResolvedValue(true);

        // Mock checkScrollDepth to HANG (return a promise that never resolves)
        // This simulates waiting for a user scroll that never happens
        vi.spyOn(
            manager as unknown as { checkScrollDepth: () => Promise<boolean> },
            "checkScrollDepth"
        ).mockReturnValue(new Promise(() => { }));

        const result = await manager.evaluateTriggers(campaign as any);

        // Should pass because page_load is met, and OR logic shouldn't wait for scroll_depth
        expect(result).toBe(true);
    });

    it("should resolve OR logic when a delayed trigger passes, even if another hangs", async () => {
        const campaign = {
            id: "test-campaign-or-delayed",
            clientTriggers: {
                enhancedTriggers: {
                    page_load: {
                        enabled: true,
                        delay: 100, // 100ms
                    },
                    scroll_depth: {
                        enabled: true,
                        depth_percentage: 50,
                    },
                    trigger_combination: {
                        operator: "OR" as const,
                    },
                },
            },
        };

        // Use real checkPageLoad (it uses setTimeout)

        // Mock checkScrollDepth to HANG
        vi.spyOn(
            manager as unknown as { checkScrollDepth: () => Promise<boolean> },
            "checkScrollDepth"
        ).mockReturnValue(new Promise(() => { }));

        const start = Date.now();
        const result = await manager.evaluateTriggers(campaign as any);
        const elapsed = Date.now() - start;

        expect(result).toBe(true);
        expect(elapsed).toBeGreaterThanOrEqual(90); // Should wait for page_load delay
    });

    it("should fail OR logic if all triggers fail (resolve to false)", async () => {
        const campaign = {
            id: "test-campaign-or-fail",
            clientTriggers: {
                enhancedTriggers: {
                    page_load: {
                        enabled: true,
                        delay: 0,
                    },
                    scroll_depth: {
                        enabled: true,
                        depth_percentage: 50,
                    },
                    trigger_combination: {
                        operator: "OR" as const,
                    },
                },
            },
        };

        // Mock both to fail immediately
        vi.spyOn(
            manager as unknown as { checkPageLoad: () => Promise<boolean> },
            "checkPageLoad"
        ).mockResolvedValue(false);

        vi.spyOn(
            manager as unknown as { checkScrollDepth: () => Promise<boolean> },
            "checkScrollDepth"
        ).mockResolvedValue(false);

        const result = await manager.evaluateTriggers(campaign as any);
        expect(result).toBe(false);
    });
});
