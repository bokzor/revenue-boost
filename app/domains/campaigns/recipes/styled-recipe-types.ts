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

import type { CampaignGoal, TemplateType } from "../types/campaign";

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
  | "datetime";

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

export type QuickInput =
  | DiscountPercentageInput
  | DiscountAmountInput
  | CurrencyAmountInput
  | DurationHoursInput
  | ProductPickerInput
  | CollectionPickerInput
  | TextInput
  | DateTimeInput;

// =============================================================================
// COMPONENT NAMES (maps to actual popup components)
// =============================================================================

export type PopupComponentName =
  // Newsletter variants
  | "NewsletterSplit"
  | "NewsletterMinimal"
  | "NewsletterCentered"
  // Flash sale variants
  | "FlashSaleCentered"
  | "FlashSaleSplit"
  | "FlashSaleBanner"
  // Spin to win
  | "SpinToWin"
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
  | "fullscreen" // Full viewport
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
  designConfig?: Record<string, unknown>;
  targetRules?: Record<string, unknown>;
  discountConfig?: Record<string, unknown>;
}

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

  // Quick setup (1-3 inputs shown in step 2)
  inputs: QuickInput[];

  // Editable fields (shown in step 3)
  editableFields: EditableField[];

  // Locked configuration (recipe decides these)
  defaults: StyledRecipeDefaults;

  // Feature flags
  featured?: boolean; // Show in featured section
  seasonal?: boolean; // Is this a seasonal recipe
  new?: boolean; // Mark as new
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
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export type StyledRecipeWithBuild = StyledRecipe & {
  build: (context: RecipeContext) => RecipeOutput;
};

