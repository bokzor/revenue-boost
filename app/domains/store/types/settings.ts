import { z } from "zod";
import { CustomCssSchema } from "~/lib/css-guards";
import { ThemePresetsArraySchema } from "./theme-preset";

/**
 * Global Frequency Capping Settings
 *
 * Best practice defaults (used when settings are undefined or for recommendations):
 * - max_per_session: 2 - reasonable limit per visit
 * - max_per_day: 5 - allows engagement without being intrusive
 * - cooldown_between_popups: 30 seconds - prevents rapid-fire popups
 */
export const GLOBAL_FREQUENCY_BEST_PRACTICES = {
  max_per_session: 2,
  max_per_day: 5,
  cooldown_between_popups: 30, // seconds
} as const;

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
