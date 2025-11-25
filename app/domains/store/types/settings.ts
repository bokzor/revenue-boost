import { z } from "zod";
import { CustomCssSchema } from "~/lib/css-guards";

/**
 * Global Frequency Capping Settings
 */
export const GlobalFrequencyCappingSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  max_per_session: z.number().int().min(1).optional(),
  max_per_day: z.number().int().min(1).optional(),
  cooldown_between_popups: z.number().int().min(0).optional(), // seconds
});

export type GlobalFrequencyCappingSettings = z.infer<typeof GlobalFrequencyCappingSettingsSchema>;

/**
 * Frequency Cap Group
 * Defines which group a campaign belongs to for global capping
 */
export type FrequencyCapGroup = "popup" | "social_proof" | "banner";

/**
 * Store Settings Schema
 * Container for all store-wide configuration
 */
export const StoreSettingsSchema = z.object({
  frequencyCapping: GlobalFrequencyCappingSettingsSchema.optional(), // Default/Popup settings
  socialProofFrequencyCapping: GlobalFrequencyCappingSettingsSchema.optional(), // Specific for Social Proof
  bannerFrequencyCapping: GlobalFrequencyCappingSettingsSchema.optional(),
  globalCustomCSS: CustomCssSchema.optional(),
});

export type StoreSettings = z.infer<typeof StoreSettingsSchema>;
