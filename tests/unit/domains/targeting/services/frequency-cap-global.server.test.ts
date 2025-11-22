import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import { redis, REDIS_PREFIXES } from "~/lib/redis.server";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";
import type {
    GlobalFrequencyCappingSettings,
    StoreSettings,
} from "~/domains/store/types/settings";

// Mock Redis
vi.mock("~/lib/redis.server", () => ({
    redis: {
        get: vi.fn(),
        setex: vi.fn(),
        pipeline: vi.fn(() => ({
            incr: vi.fn(),
            expire: vi.fn(),
            exec: vi.fn(),
        })),
        keys: vi.fn(),
        del: vi.fn(),
    },
    REDIS_PREFIXES: {
        FREQUENCY_CAP: "freq",
        GLOBAL_FREQUENCY: "global_freq",
        COOLDOWN: "cooldown",
    },
    REDIS_TTL: {
        SESSION: 1800,
        HOUR: 3600,
        DAY: 86400,
        WEEK: 604800,
        MONTH: 2592000,
    },
}));

describe("FrequencyCapService", () => {
    const mockContext: StorefrontContext = {
        sessionId: "session-123",
        visitorId: "visitor-123",
    };

    const mockCampaign: CampaignWithConfigs = {
        id: "campaign-1",
        name: "Test Campaign",
        templateType: "NEWSLETTER",
        isActive: true,
        targetRules: {
            enhancedTriggers: {
                frequency_capping: {
                    respect_global_limits: true,
                },
            },
        },
    } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("checkFrequencyCapping with Global Settings", () => {
        it("should allow if global settings are disabled", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: false,
                    max_per_session: 1,
                },
            };

            const result = await FrequencyCapService.checkFrequencyCapping(
                mockCampaign,
                mockContext,
                storeSettings
            );

            expect(result.allowed).toBe(true);
        });

        it("should block if global session limit is exceeded", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: true,
                    max_per_session: 2,
                },
            };

            // Mock Redis to return 2 for session count
            (redis as any).get.mockImplementation((key: string) => {
                if (key.includes("global_freq:visitor-123:popup:session")) return "2";
                return null;
            });

            const result = await FrequencyCapService.checkFrequencyCapping(
                mockCampaign,
                mockContext,
                storeSettings
            );

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("Global session limit exceeded");
        });

        it("should block if global daily limit is exceeded", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: true,
                    max_per_day: 5,
                },
            };

            // Mock Redis to return 5 for daily count
            (redis as any).get.mockImplementation((key: string) => {
                if (key.includes("global_freq:visitor-123:popup:day")) return "5";
                return null;
            });

            const result = await FrequencyCapService.checkFrequencyCapping(
                mockCampaign,
                mockContext,
                storeSettings
            );

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("Global daily limit exceeded");
        });

        it("should allow if limits are not exceeded", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: true,
                    max_per_session: 5,
                },
            };

            // Mock Redis to return 1 for session count
            (redis as any).get.mockImplementation((key: string) => {
                if (key.includes("global_freq:visitor-123:popup:session")) return "1";
                return null;
            });

            const result = await FrequencyCapService.checkFrequencyCapping(
                mockCampaign,
                mockContext,
                storeSettings
            );

            expect(result.allowed).toBe(true);
        });

        it("should use social proof settings for social proof campaigns", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: true,
                    max_per_session: 5,
                },
                socialProofFrequencyCapping: {
                    enabled: true,
                    max_per_session: 1,
                },
            };

            const campaign: CampaignWithConfigs = {
                id: "campaign-123",
                templateType: "SOCIAL_PROOF",
                targetRules: {
                    enhancedTriggers: {
                        frequency_capping: {
                            respect_global_limits: true,
                        },
                    },
                },
            } as any;

            // Mock Redis to return 1 for session count (limit is 1)
            (redis as any).get.mockImplementation((key: string) => {
                if (key.includes("global_freq:visitor-123:social_proof:session")) return "1";
                return null;
            });

            const result = await FrequencyCapService.checkFrequencyCapping(
                campaign,
                mockContext,
                storeSettings
            );

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("Global session limit exceeded");
        });

        it("should use banner settings for banner campaigns", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: true,
                    max_per_session: 5,
                },
                bannerFrequencyCapping: {
                    enabled: true,
                    max_per_session: 2,
                },
            };

            const campaign: CampaignWithConfigs = {
                id: "campaign-456",
                templateType: "ANNOUNCEMENT",
                targetRules: {
                    enhancedTriggers: {
                        frequency_capping: {
                            respect_global_limits: true,
                        },
                    },
                },
            } as any;

            // Mock Redis to return 2 for session count (limit is 2)
            (redis as any).get.mockImplementation((key: string) => {
                if (key.includes("global_freq:visitor-123:banner:session")) return "2";
                return null;
            });

            const result = await FrequencyCapService.checkFrequencyCapping(
                campaign,
                mockContext,
                storeSettings
            );

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("Global session limit exceeded");
        });
    });

    describe("recordDisplay with Global Settings", () => {
        it("should record global display if respect_global_limits is true", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: true,
                },
            };

            await FrequencyCapService.recordDisplay(
                "campaign-1",
                mockContext,
                mockCampaign.targetRules?.enhancedTriggers?.frequency_capping,
                storeSettings,
                "NEWSLETTER"
            );

            // Should increment global counters
            expect((redis as any).pipeline).toHaveBeenCalled();
        });

        it("should set global cooldown if configured", async () => {
            const storeSettings: StoreSettings = {
                frequencyCapping: {
                    enabled: true,
                    cooldown_between_popups: 60,
                },
            };

            await FrequencyCapService.recordDisplay(
                "campaign-1",
                mockContext,
                mockCampaign.targetRules?.enhancedTriggers?.frequency_capping,
                storeSettings,
                "NEWSLETTER"
            );

            expect((redis as any).setex).toHaveBeenCalledWith(
                expect.stringContaining("cooldown:visitor-123:global:popup"),
                60,
                expect.any(String)
            );
        });
    });
});
