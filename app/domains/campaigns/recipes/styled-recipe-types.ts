/**
 * Styled Recipe Type Definitions
 *
 * A StyledRecipe is the single source of truth that:
 * 1. Defines what component renders the popup
 * 2. Defines what fields the admin can edit (editableFields)
 * 3. Provides locked defaults for everything else
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import type {
  CampaignGoal,
  TemplateType,
  DesignConfig,
  TargetRulesConfig,
  DiscountConfig,
} from "../types/campaign";
import type { LayoutConfig } from "~/domains/storefront/popups-new/types";

// =============================================================================
// RECIPE CATEGORIES
// =============================================================================

export type RecipeCategory =
  | "email_leads"
  | "sales_promos"
  | "cart_recovery"
  | "announcements";

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
  | "sidebar-right"; // Slide-in from right

// =============================================================================
// STYLED RECIPE DEFINITION
// =============================================================================

export interface StyledRecipeDefaults {
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
  | "page-load";

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
};

// =============================================================================
// STYLED RECIPE DEFINITION
// =============================================================================

export interface StyledRecipe {
  // Identity
  id: string; // e.g., "black-friday-sale"
  name: string; // e.g., "Black Friday Sale"
  tagline: string; // e.g., "The biggest sale of the year"
  description: string; // Longer explanation
  icon: string; // e.g., "🖤"

  // Classification
  category: RecipeCategory;
  goal: CampaignGoal;
  templateType: TemplateType;

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

  // Locked configuration (recipe decides these)
  defaults: StyledRecipeDefaults;

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
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export type StyledRecipeWithBuild = StyledRecipe & {
  build: (context: RecipeContext) => RecipeOutput;
};

