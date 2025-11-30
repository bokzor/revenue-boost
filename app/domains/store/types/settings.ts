import { z } from "zod";
import { CustomCssSchema } from "~/lib/css-guards";
import { ThemePresetsArraySchema } from "./theme-preset";

/**
 * Global Frequency Capping Best Practices
 *
 * These are recommended defaults shown when merchants enable capping.
 * Note: Global capping is DISABLED by default at install to maximize impressions.
 * Per-campaign frequency controls are still active.
 */

/** Popups - Most intrusive, need stricter limits */
export const POPUP_FREQUENCY_BEST_PRACTICES = {
  max_per_session: 3,
  max_per_day: 8,
  cooldown_between_popups: 30, // seconds
} as const;

/** Social Proof - Small notifications, less intrusive, higher limits */
export const SOCIAL_PROOF_FREQUENCY_BEST_PRACTICES = {
  max_per_session: 10,
  max_per_day: 30,
  cooldown_between_popups: 10, // seconds
} as const;

/** Banners - Persistent by nature, no limits, just cooldown between different banners */
export const BANNER_FREQUENCY_BEST_PRACTICES = {
  max_per_session: undefined, // unlimited
  max_per_day: undefined, // unlimited
  cooldown_between_popups: 5, // seconds
} as const;

/** @deprecated Use POPUP_FREQUENCY_BEST_PRACTICES instead */
export const GLOBAL_FREQUENCY_BEST_PRACTICES = POPUP_FREQUENCY_BEST_PRACTICES;

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

  /** Custom theme presets created by the merchant */
  customThemePresets: ThemePresetsArraySchema.optional(),
});

export type StoreSettings = z.infer<typeof StoreSettingsSchema>;

// Re-export theme preset types for convenience
export type { ThemePresetInput, ThemePresetsArray } from "./theme-preset";
export {
  ThemePresetInputSchema,
  ThemePresetsArraySchema,
  expandThemePreset,
  createEmptyThemePreset,
  parseThemePreset,
  parseThemePresets,
  getWheelColorsFromPreset,
} from "./theme-preset";
