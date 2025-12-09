/**
 * Styled Recipe Type Definitions
 *
 * A StyledRecipe is the single source of truth that:
 * 1. Defines what component renders the popup
 * 2. Defines what fields the admin can edit (editableFields)
 * 3. Provides locked defaults for everything else
 *
 * The StyledRecipe type is generic, mapping TemplateType to its corresponding
 * ContentConfig type for full type safety:
 *
 *   StyledRecipe<"NEWSLETTER">      -> contentConfig: Partial<NewsletterContent>
 *   StyledRecipe<"PRODUCT_UPSELL">  -> contentConfig: Partial<ProductUpsellContent>
 *   StyledRecipe<"FLASH_SALE">      -> contentConfig: Partial<FlashSaleContent>
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import type {
  CampaignGoal,
  TemplateType,
  DesignConfig,
  TargetRulesConfig,
  DiscountConfig,
  // Content types for generic mapping
  NewsletterContent,
  SpinToWinContent,
  FlashSaleContent,
  FreeShippingContent,
  CartAbandonmentContent,
  ProductUpsellContent,
  SocialProofContent,
  CountdownTimerContent,
  ScratchCardContent,
  AnnouncementContent,
  ContentConfig,
  // New upsell popup content types
  ClassicUpsellContent,
  MinimalSlideUpContent,
  PremiumFullscreenContent,
  CountdownUrgencyContent,
} from "../types/campaign";

// =============================================================================
// TEMPLATE TO CONTENT TYPE MAPPING
// =============================================================================

/**
 * Maps each TemplateType to its corresponding ContentConfig type.
 * This enables type-safe recipes where defaults.contentConfig is properly typed.
 */
export type TemplateContentMap = {
  NEWSLETTER: NewsletterContent;
  SPIN_TO_WIN: SpinToWinContent;
  FLASH_SALE: FlashSaleContent;
  FREE_SHIPPING: FreeShippingContent;
  EXIT_INTENT: CartAbandonmentContent;
  CART_ABANDONMENT: CartAbandonmentContent;
  PRODUCT_UPSELL: ProductUpsellContent;
  SOCIAL_PROOF: SocialProofContent;
  COUNTDOWN_TIMER: CountdownTimerContent;
  SCRATCH_CARD: ScratchCardContent;
  ANNOUNCEMENT: AnnouncementContent;
  // New upsell popup template types
  CLASSIC_UPSELL: ClassicUpsellContent;
  MINIMAL_SLIDE_UP: MinimalSlideUpContent;
  PREMIUM_FULLSCREEN: PremiumFullscreenContent;
  COUNTDOWN_URGENCY: CountdownUrgencyContent;
};

// =============================================================================
// RECIPE CATEGORIES
// =============================================================================

export type RecipeCategory = "email_leads" | "sales_promos" | "cart_recovery" | "announcements";

export interface RecipeCategoryMeta {
  id: RecipeCategory;
  label: string;
  icon: string;
  description: string;
  defaultGoal: CampaignGoal;
}

export const RECIPE_CATEGORIES: Record<RecipeCategory, RecipeCategoryMeta> = {
  email_leads: {
    id: "email_leads",
    label: "Email & Leads",
    icon: "📧",
    description: "Grow your email list with compelling offers",
    defaultGoal: "NEWSLETTER_SIGNUP",
  },
  sales_promos: {
    id: "sales_promos",
    label: "Sales & Promos",
    icon: "🔥",
    description: "Drive sales with discounts and urgency",
    defaultGoal: "INCREASE_REVENUE",
  },
  cart_recovery: {
    id: "cart_recovery",
    label: "Cart & Recovery",
    icon: "🛒",
    description: "Recover abandoned carts and increase AOV",
    defaultGoal: "INCREASE_REVENUE",
  },
  announcements: {
    id: "announcements",
    label: "Announcements",
    icon: "📢",
    description: "Inform customers about news and updates",
    defaultGoal: "ENGAGEMENT",
  },
};

// =============================================================================
// EDITABLE FIELDS (drives admin form generation)
// =============================================================================

export type EditableFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "image"
  | "product_picker"
  | "collection_picker"
  | "date"
  | "duration";

export interface EditableFieldBase {
  key: string;
  type: EditableFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  group?: string; // For grouping in admin UI
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface TextEditableField extends EditableFieldBase {
  type: "text" | "textarea";
  defaultValue?: string;
}

export interface NumberEditableField extends EditableFieldBase {
  type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string; // e.g., "%" or "$"
}

export interface BooleanEditableField extends EditableFieldBase {
  type: "boolean";
  defaultValue?: boolean;
}

export interface SelectEditableField extends EditableFieldBase {
  type: "select";
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

export interface ColorEditableField extends EditableFieldBase {
  type: "color";
  defaultValue?: string;
}

export interface ImageEditableField extends EditableFieldBase {
  type: "image";
  defaultValue?: string;
  acceptedTypes?: string[]; // e.g., ["image/png", "image/jpeg"]
}

export interface PickerEditableField extends EditableFieldBase {
  type: "product_picker" | "collection_picker";
  multiSelect?: boolean;
}

export interface DateEditableField extends EditableFieldBase {
  type: "date";
  defaultValue?: string;
}

export interface DurationEditableField extends EditableFieldBase {
  type: "duration";
  defaultValue?: number; // in hours
  unit?: "hours" | "days" | "minutes";
}

export type EditableField =
  | TextEditableField
  | NumberEditableField
  | BooleanEditableField
  | SelectEditableField
  | ColorEditableField
  | ImageEditableField
  | PickerEditableField
  | DateEditableField
  | DurationEditableField;

// =============================================================================
// QUICK SETUP INPUTS (1-3 key decisions shown first)
// =============================================================================

export type QuickInputType =
  | "discount_percentage"
  | "discount_amount"
  | "currency_amount"
  | "duration_hours"
  | "product_picker"
  | "collection_picker"
  | "text"
  | "datetime"
  | "select";

export interface QuickInputBase {
  type: QuickInputType;
  key: string;
  label: string;
}

export interface DiscountPercentageInput extends QuickInputBase {
  type: "discount_percentage";
  defaultValue: number;
  min?: number;
  max?: number;
}

export interface DiscountAmountInput extends QuickInputBase {
  type: "discount_amount";
  defaultValue: number;
}

export interface CurrencyAmountInput extends QuickInputBase {
  type: "currency_amount";
  defaultValue: number;
}

export interface DurationHoursInput extends QuickInputBase {
  type: "duration_hours";
  defaultValue: number;
}

export interface ProductPickerInput extends QuickInputBase {
  type: "product_picker";
  multiSelect?: boolean;
}

export interface CollectionPickerInput extends QuickInputBase {
  type: "collection_picker";
  multiSelect?: boolean;
}

export interface TextInput extends QuickInputBase {
  type: "text";
  defaultValue?: string;
  placeholder?: string;
}

export interface DateTimeInput extends QuickInputBase {
  type: "datetime";
}

export interface SelectInput extends QuickInputBase {
  type: "select";
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}

export type QuickInput =
  | DiscountPercentageInput
  | DiscountAmountInput
  | CurrencyAmountInput
  | DurationHoursInput
  | ProductPickerInput
  | CollectionPickerInput
  | TextInput
  | DateTimeInput
  | SelectInput;

// =============================================================================
// COMPONENT NAMES (maps to actual popup components)
// =============================================================================

export type PopupComponentName =
  // Newsletter variants
  | "NewsletterSplit"
  | "NewsletterMinimal"
  | "NewsletterCentered"
  | "NewsletterHero"
  | "NewsletterFullscreen"
  // Flash sale variants
  | "FlashSaleCentered"
  | "FlashSaleSplit"
  | "FlashSaleBanner"
  // Spin to win
  | "SpinToWin"
  // Scratch card
  | "ScratchCard"
  | "ScratchCardPopup"
  // Cart recovery
  | "CartRecovery"
  | "CartRecoveryUrgent"
  // Free shipping
  | "FreeShippingBar"
  | "FreeShippingProgress"
  // Product upsell
  | "ProductUpsell"
  | "ProductUpsellCarousel"
  // New upsell popup variants
  | "ClassicUpsellPopup"
  | "MinimalSlideUpPopup"
  | "PremiumFullscreenPopup"
  | "BundleDealPopup"
  | "CountdownUrgencyPopup"
  // Announcements
  | "AnnouncementBanner"
  | "AnnouncementModal";

// =============================================================================
// LAYOUT TYPES (used in designConfig to pick component variant)
// =============================================================================

export type PopupLayout =
  | "centered" // Default modal in center
  | "split-left" // Image on left, content on right
  | "split-right" // Content on left, image on right
  | "hero" // Image on top, content below
  | "fullscreen" // Full viewport with overlay
  | "banner" // Generic banner
  | "banner-top" // Top sticky bar
  | "banner-bottom" // Bottom sticky bar
  | "sidebar" // Generic sidebar
  | "sidebar-left" // Slide-in from left
  | "sidebar-right" // Slide-in from right
  // New upsell popup layouts
  | "bottom-sheet"; // Compact bottom sheet for mobile

// =============================================================================
// STYLED RECIPE DEFAULTS (Generic)
// =============================================================================

/**
 * Recipe defaults with type-safe contentConfig.
 *
 * @template TContent - The content type (e.g., NewsletterContent, ProductUpsellContent)
 */
export interface StyledRecipeDefaults<TContent extends ContentConfig = ContentConfig> {
  contentConfig: Partial<TContent>;
  designConfig?: Partial<DesignConfig>;
  targetRules?: Partial<TargetRulesConfig>;
  discountConfig?: Partial<DiscountConfig>;
}

/**
 * Legacy non-generic version for backward compatibility.
 * New recipes should use StyledRecipeDefaults<TContent>.
 */
export interface StyledRecipeDefaultsUntyped {
  contentConfig: Record<string, unknown>;
  designConfig?: Partial<DesignConfig>;
  targetRules?: Partial<TargetRulesConfig>;
  discountConfig?: Partial<DiscountConfig>;
}

// =============================================================================
// RECIPE TAGS (for filtering and discovery)
// =============================================================================

export type RecipeTag =
  // Industry/Niche
  | "fashion"
  | "beauty"
  | "food"
  | "tech"
  | "fitness"
  | "home"
  | "outdoor"
  | "wellness"
  | "luxury"
  // Style
  | "minimal"
  | "bold"
  | "elegant"
  | "playful"
  | "modern"
  | "warm"
  | "dark"
  | "subtle"
  | "urgent"
  // Layout
  | "split"
  | "hero"
  | "fullscreen"
  | "centered"
  // Incentive type
  | "discount"
  | "free-shipping"
  | "free-gift"
  | "early-access"
  | "no-incentive"
  // Seasonal
  | "holiday"
  | "summer"
  | "winter"
  | "spring"
  | "black-friday"
  | "valentines"
  // Trigger type
  | "exit-intent"
  | "time-delay"
  | "scroll-trigger"
  | "page-load"
  // Conversion
  | "high-converting"
  | "cart-recovery";

export const RECIPE_TAG_LABELS: Record<RecipeTag, string> = {
  // Industry
  fashion: "Fashion",
  beauty: "Beauty",
  food: "Food & Beverage",
  tech: "Tech & SaaS",
  fitness: "Fitness",
  home: "Home & Living",
  outdoor: "Outdoor",
  wellness: "Wellness",
  luxury: "Luxury",
  // Style
  minimal: "Minimal",
  bold: "Bold",
  elegant: "Elegant",
  playful: "Playful",
  modern: "Modern",
  warm: "Warm",
  dark: "Dark Mode",
  subtle: "Subtle",
  urgent: "Urgent",
  // Layout
  split: "Split Layout",
  hero: "Hero Image",
  fullscreen: "Fullscreen",
  centered: "Centered",
  // Incentive
  discount: "Discount",
  "free-shipping": "Free Shipping",
  "free-gift": "Free Gift",
  "early-access": "Early Access",
  "no-incentive": "No Incentive",
  // Seasonal
  holiday: "Holiday",
  summer: "Summer",
  winter: "Winter",
  spring: "Spring",
  "black-friday": "Black Friday",
  valentines: "Valentine's",
  // Trigger
  "exit-intent": "Exit Intent",
  "time-delay": "Time Delay",
  "scroll-trigger": "Scroll Trigger",
  "page-load": "Page Load",
  // Conversion
  "high-converting": "High Converting",
  "cart-recovery": "Cart Recovery",
};

// =============================================================================
// STYLED RECIPE DEFINITION (Generic)
// =============================================================================

/**
 * Base interface for StyledRecipe without generics.
 * Contains all non-template-specific fields.
 */
interface StyledRecipeBase {
  // Identity
  id: string; // e.g., "black-friday-sale"
  name: string; // e.g., "Black Friday Sale"
  tagline: string; // e.g., "The biggest sale of the year"
  description: string; // Longer explanation
  icon: string; // e.g., "🖤"

  // Classification
  category: RecipeCategory;
  goal: CampaignGoal;

  // Tags for filtering and discovery (optional for backward compatibility)
  tags?: RecipeTag[];

  // Internal reference (for understanding structure)
  baseRecipeId?: string; // e.g., "flash-sale"
  styleId?: string; // e.g., "black-friday"

  // Rendering
  component: PopupComponentName;
  theme: string; // Theme key from color-presets
  layout: PopupLayout;

  // Background configuration
  // - backgroundPresetId: ID from background-presets.ts (e.g., "bg-black-friday")
  // - If undefined, uses theme's CSS gradient/solid color
  // - Use getDefaultBackgroundForTheme(theme) to auto-select matching background
  backgroundPresetId?: string;

  // Whether to use theme's built-in CSS gradient instead of an image
  // Useful for seasonal themes that have gradient backgrounds
  useThemeBackground?: boolean;

  // Image for recipe (for split/hero layouts)
  imageUrl?: string;

  // Quick setup (1-3 inputs shown in step 2)
  inputs: QuickInput[];

  // Editable fields (shown in step 3)
  editableFields: EditableField[];

  // Feature flags
  featured?: boolean; // Show in featured section
  seasonal?: boolean; // Is this a seasonal recipe (deprecated - use recipeType instead)
  new?: boolean; // Mark as new

  // Recipe type for categorization and priority
  recipeType?: RecipeType;

  // Required configuration sections to show in recipe modal
  // These sections are critical to the recipe and should be configured upfront
  requiredConfig?: RequiredConfigSection[];
}

/**
 * Type-safe StyledRecipe with generic template type.
 *
 * The contentConfig in defaults is automatically typed based on templateType:
 *
 * @example
 * ```typescript
 * // contentConfig is Partial<ProductUpsellContent>
 * const recipe: StyledRecipe<"PRODUCT_UPSELL"> = {
 *   templateType: "PRODUCT_UPSELL",
 *   defaults: {
 *     contentConfig: {
 *       headline: "Complete your look",
 *       productSelectionMethod: "ai", // ✅ Type-checked!
 *       layout: "grid",               // ✅ Type-checked!
 *     }
 *   }
 * };
 * ```
 *
 * @template T - The TemplateType (e.g., "NEWSLETTER", "PRODUCT_UPSELL")
 */
export interface StyledRecipe<T extends TemplateType = TemplateType> extends StyledRecipeBase {
  templateType: T;
  defaults: StyledRecipeDefaults<TemplateContentMap[T]>;
}

// =============================================================================
// TYPE ALIASES FOR EACH TEMPLATE TYPE
// =============================================================================

/** Newsletter recipe with type-safe NewsletterContent */
export type NewsletterRecipe = StyledRecipe<"NEWSLETTER">;

/** Spin to Win recipe with type-safe SpinToWinContent */
export type SpinToWinRecipe = StyledRecipe<"SPIN_TO_WIN">;

/** Flash Sale recipe with type-safe FlashSaleContent */
export type FlashSaleRecipe = StyledRecipe<"FLASH_SALE">;

/** Free Shipping recipe with type-safe FreeShippingContent */
export type FreeShippingRecipe = StyledRecipe<"FREE_SHIPPING">;

/** Cart Abandonment recipe with type-safe CartAbandonmentContent */
export type CartAbandonmentRecipe = StyledRecipe<"CART_ABANDONMENT">;

/** Product Upsell recipe with type-safe ProductUpsellContent */
export type ProductUpsellRecipe = StyledRecipe<"PRODUCT_UPSELL">;

/** Social Proof recipe with type-safe SocialProofContent */
export type SocialProofRecipe = StyledRecipe<"SOCIAL_PROOF">;

/** Countdown Timer recipe with type-safe CountdownTimerContent */
export type CountdownTimerRecipe = StyledRecipe<"COUNTDOWN_TIMER">;

/** Scratch Card recipe with type-safe ScratchCardContent */
export type ScratchCardRecipe = StyledRecipe<"SCRATCH_CARD">;

/** Announcement recipe with type-safe AnnouncementContent */
export type AnnouncementRecipe = StyledRecipe<"ANNOUNCEMENT">;

// New upsell popup recipe types
/** Classic Upsell recipe with type-safe ClassicUpsellContent */
export type ClassicUpsellRecipe = StyledRecipe<"CLASSIC_UPSELL">;

/** Minimal Slide-Up recipe with type-safe MinimalSlideUpContent */
export type MinimalSlideUpRecipe = StyledRecipe<"MINIMAL_SLIDE_UP">;

/** Premium Fullscreen recipe with type-safe PremiumFullscreenContent */
export type PremiumFullscreenRecipe = StyledRecipe<"PREMIUM_FULLSCREEN">;

/** Countdown Urgency recipe with type-safe CountdownUrgencyContent */
export type CountdownUrgencyRecipe = StyledRecipe<"COUNTDOWN_URGENCY">;

/**
 * Union type of all typed recipes.
 * Use this when you need to accept any recipe type.
 */
export type AnyStyledRecipe =
  | NewsletterRecipe
  | SpinToWinRecipe
  | FlashSaleRecipe
  | FreeShippingRecipe
  | CartAbandonmentRecipe
  | ProductUpsellRecipe
  | SocialProofRecipe
  | CountdownTimerRecipe
  | ScratchCardRecipe
  | AnnouncementRecipe
  | ClassicUpsellRecipe
  | MinimalSlideUpRecipe
  | PremiumFullscreenRecipe
  | CountdownUrgencyRecipe;

// =============================================================================
// REQUIRED CONFIG SECTIONS
// =============================================================================

/**
 * Configuration sections that can be shown in the recipe modal.
 * When specified, the recipe modal will display these form sections
 * with the recipe's defaults pre-populated.
 *
 * - "discount": Show discount configuration (BOGO, Tiered, basic percentage, etc.)
 * - "targeting": Show targeting configuration (triggers, audience)
 * - "schedule": Show scheduling configuration (start/end dates)
 */
export type RequiredConfigSection = "discount" | "targeting" | "schedule";

// =============================================================================
// RECIPE TYPE (for categorization and priority)
// =============================================================================

/**
 * Recipe types determine how recipes are categorized and displayed:
 * - use_case: Primary recipes focused on business strategies (BOGO, Tiered, etc.)
 * - seasonal: Quick-start templates for seasonal events (Black Friday, Summer, etc.)
 * - inspiration: Visual/design-focused recipes for inspiration
 */
export type RecipeType = "use_case" | "seasonal" | "inspiration";

// =============================================================================
// THEME MODE FOR RECIPES (Simplified Theme System)
// =============================================================================

import type { ThemeMode, CampaignDesignInput } from "~/domains/campaigns/types/design-tokens";

/**
 * Get the default theme mode for a recipe based on its recipeType.
 *
 * - use_case recipes: Use Shopify theme (functional, should match store branding)
 * - seasonal recipes: Use preset design (artistic, have predefined seasonal look)
 * - inspiration recipes: Use preset design (artistic, have predefined creative look)
 *
 * @param recipeType The type of recipe
 * @returns The default theme mode for campaigns created from this recipe
 */
export function getThemeModeForRecipeType(recipeType: RecipeType | undefined): ThemeMode {
  switch (recipeType) {
    case "seasonal":
    case "inspiration":
      return "preset";
    case "use_case":
    default:
      // Use "default" to inherit from store's default theme preset
      return "default";
  }
}

/**
 * Inspiration recipe IDs that should always use preset designs.
 * These are artistic/branded designs that shouldn't inherit the store theme.
 *
 * Note: Recipe IDs follow the pattern "{template}-{style}" e.g., "newsletter-bold-energy"
 */
export const INSPIRATION_RECIPE_IDS = [
  // Newsletter inspiration (artistic designs with specific color schemes)
  "newsletter-elegant-luxe",
  "newsletter-street-style",
  "newsletter-fresh-organic",
  "newsletter-cafe-warm",
  "newsletter-soft-glow",
  "newsletter-spa-serenity",
  "newsletter-cozy-comfort",
  "newsletter-bold-energy",
  "newsletter-active-life",
  // Spin-to-Win inspiration
  "spin-neon-nights",
  "spin-retro-arcade",
  // Scratch Card inspiration
  "scratch-golden-ticket",
] as const;

/**
 * Use-case recipe IDs that should inherit the store's Shopify theme.
 * These are functional recipes focused on conversion, not artistic design.
 */
export const USE_CASE_RECIPE_IDS = [
  // Newsletter use-cases (functional, should match store branding)
  "newsletter-minimal-tech",
  "newsletter-dark-mode",
  "newsletter-scandinavian",
  // Flash Sale use-cases
  "flash-sale-basic",
  "flash-sale-countdown",
  // Cart recovery
  "cart-recovery-basic",
  "cart-recovery-urgent",
  // Free shipping
  "free-shipping-bar",
  "free-shipping-progress",
] as const;

/**
 * Seasonal recipe IDs that should always use preset designs.
 */
export const SEASONAL_RECIPE_IDS = [
  // Flash Sale seasonal (IDs must match actual recipe IDs in flash-sale-design-recipes.ts)
  "black-friday-sale",
  "cyber-monday-sale",
  "holiday-sale",
  "summer-sale",
  "easter-sale",
  "valentine-sale",
  "halloween-sale",
  "thanksgiving-sale",
  "new-year-sale",
  "winter-sale",
  "back-to-school-sale",
] as const;

/**
 * Get the preset ID for a recipe based on its ID.
 * Returns undefined if the recipe should use Shopify theme.
 *
 * @param recipeId The recipe identifier
 * @returns The preset ID to use, or undefined for Shopify theme mode
 */
export function getPresetIdForRecipe(recipeId: string): string | undefined {
  // Check if it's an inspiration recipe
  if ((INSPIRATION_RECIPE_IDS as readonly string[]).includes(recipeId)) {
    return recipeId; // Preset ID matches recipe ID
  }
  // Check if it's a seasonal recipe
  if ((SEASONAL_RECIPE_IDS as readonly string[]).includes(recipeId)) {
    return recipeId; // Preset ID matches recipe ID
  }
  return undefined;
}

// =============================================================================
// RECIPE CONTEXT (passed to build function)
// =============================================================================

export interface RecipeContext {
  // From quick inputs
  discountValue?: number;
  threshold?: number;
  durationHours?: number;
  products?: Array<{ id: string; title: string; handle: string }>;
  collections?: Array<{ id: string; title: string; handle: string }>;
  eventDate?: string;

  // From editable fields
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  [key: string]: unknown;

  // From theme picker
  selectedTheme?: string;
}

// =============================================================================
// RECIPE OUTPUT (what build() returns)
// =============================================================================

export interface RecipeOutput {
  name: string;
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  discountConfig?: Record<string, unknown>;
  targetRules?: Record<string, unknown>;
  /** Theme mode derived from recipe type */
  themeMode: ThemeMode;
  /** Preset ID for inspiration/seasonal recipes */
  presetId?: string;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * StyledRecipe with a build function for dynamic configuration.
 *
 * @template T - The TemplateType
 */
export type StyledRecipeWithBuild<T extends TemplateType = TemplateType> = StyledRecipe<T> & {
  build: (context: RecipeContext) => RecipeOutput;
};

/**
 * Helper type to extract the content type from a StyledRecipe.
 *
 * @example
 * ```typescript
 * type UpsellContent = ExtractRecipeContent<ProductUpsellRecipe>;
 * // UpsellContent = ProductUpsellContent
 * ```
 */
export type ExtractRecipeContent<R extends StyledRecipe> =
  R extends StyledRecipe<infer T> ? TemplateContentMap[T] : never;
