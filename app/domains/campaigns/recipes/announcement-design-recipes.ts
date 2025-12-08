/**
 * Announcement Design Recipes
 *
 * Pre-designed announcement banner configurations for different use cases.
 * Each recipe includes complete design, content, and targeting configuration.
 *
 * Announcements are banner-style popups that appear at the top or bottom of the page.
 * They're ideal for store-wide messages, promotions, and important notices.
 */

import type { AnnouncementRecipe, RecipeTag, EditableField } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for announcement recipes
// =============================================================================

const ANNOUNCEMENT_EDITABLE_FIELDS: EditableField[] = [
  {
    key: "headline",
    type: "text" as const,
    label: "Headline",
    group: "content",
    validation: { required: true, maxLength: 100 },
  },
  {
    key: "subheadline",
    type: "text" as const,
    label: "Description",
    group: "content",
    validation: { maxLength: 200 },
  },
  {
    key: "buttonText",
    type: "text" as const,
    label: "Button Text",
    group: "content",
    validation: { maxLength: 30 },
  },
  {
    key: "ctaUrl",
    type: "text" as const,
    label: "Button Link",
    group: "content",
    placeholder: "/collections/new",
  },
];

// =============================================================================
// COMMON TARGETING CONFIGURATION FOR ANNOUNCEMENTS
// =============================================================================

const ANNOUNCEMENT_FREQUENCY_CAPPING = {
  max_triggers_per_session: 1,
  max_triggers_per_day: 3,
  cooldown_between_triggers: 3600, // 1 hour in seconds
};

const ANNOUNCEMENT_PAGE_TARGETING = {
  enabled: true,
  pages: [] as string[],
  customPatterns: [] as string[],
  excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*"],
  productTags: [] as string[],
  collections: [] as string[],
};

// =============================================================================
// 1. STORE-WIDE SALE (Urgent)
// =============================================================================

const storeWideSale: AnnouncementRecipe = {
  id: "announcement-store-wide-sale",
  name: "Store-Wide Sale",
  tagline: "🔥 SALE NOW ON",
  description:
    "High-visibility urgent banner for store-wide sales. Uses bold colors to grab attention.",
  icon: "🔥",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "use_case",
  tags: ["urgent", "bold", "discount", "high-converting"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "urgent-sale",
  layout: "banner-top",
  featured: true,
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "🔥 SALE NOW ON — Up to 50% Off Everything!",
      subheadline: "Limited time only. Don't miss out!",
      buttonText: "Shop Sale",
      ctaUrl: "/collections/sale",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "urgent",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#DC2626",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#DC2626",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 2. NEW COLLECTION LAUNCH (Info)
// =============================================================================

const newCollectionLaunch: AnnouncementRecipe = {
  id: "announcement-new-collection",
  name: "New Collection Launch",
  tagline: "✨ New Arrivals",
  description:
    "Elegant announcement for new product launches and collection drops.",
  icon: "✨",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "use_case",
  tags: ["elegant", "modern", "fashion"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "new-collection",
  layout: "banner-top",
  featured: true,
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "✨ New Collection Now Live",
      subheadline: "Discover our latest arrivals",
      buttonText: "Explore Now",
      ctaUrl: "/collections/new-arrivals",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "info",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#1F2937",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#1F2937",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 3. FREE SHIPPING THRESHOLD (Success)
// =============================================================================

const freeShippingThreshold: AnnouncementRecipe = {
  id: "announcement-free-shipping",
  name: "Free Shipping Threshold",
  tagline: "🚚 Free Shipping",
  description:
    "Encourage higher order values by announcing free shipping thresholds.",
  icon: "🚚",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "use_case",
  tags: ["free-shipping", "subtle", "high-converting"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "free-shipping",
  layout: "banner-top",
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "🚚 Free Shipping on Orders Over $50",
      subheadline: "Shop now and save on delivery",
      buttonText: "Shop Now",
      ctaUrl: "/collections/all",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "success",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#059669",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#059669",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 4. HOLIDAY ANNOUNCEMENT (Seasonal)
// =============================================================================

const holidayAnnouncement: AnnouncementRecipe = {
  id: "announcement-holiday",
  name: "Holiday Announcement",
  tagline: "🎄 Holiday Special",
  description:
    "Festive banner for holiday promotions and seasonal greetings.",
  icon: "🎄",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "seasonal",
  tags: ["holiday", "warm", "seasonal"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "holiday",
  layout: "banner-top",
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "🎄 Holiday Sale — 25% Off Sitewide",
      subheadline: "Spread the joy with our biggest sale of the year",
      buttonText: "Shop Gifts",
      ctaUrl: "/collections/gifts",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "custom",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#991B1B",
      textColor: "#FFFFFF",
      buttonColor: "#FEF3C7",
      buttonTextColor: "#991B1B",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 5. IMPORTANT NOTICE (Custom)
// =============================================================================

const importantNotice: AnnouncementRecipe = {
  id: "announcement-important-notice",
  name: "Important Notice",
  tagline: "📢 Important Update",
  description:
    "Neutral banner for policy updates, shipping delays, or important information.",
  icon: "📢",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "use_case",
  tags: ["subtle", "modern"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "notice",
  layout: "banner-top",
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "📢 Important: Updated Shipping Times",
      subheadline: "Please allow 3-5 business days for delivery",
      buttonText: "Learn More",
      ctaUrl: "/pages/shipping",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "custom",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#374151",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#374151",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};


// =============================================================================
// 6. BLACK FRIDAY (Seasonal)
// =============================================================================

const blackFriday: AnnouncementRecipe = {
  id: "announcement-black-friday",
  name: "Black Friday",
  tagline: "🖤 BLACK FRIDAY",
  description:
    "Bold black and gold banner for Black Friday sales events.",
  icon: "🖤",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "seasonal",
  tags: ["black-friday", "bold", "urgent", "discount"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "black-friday",
  layout: "banner-top",
  featured: true,
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "🖤 BLACK FRIDAY — Up to 70% Off",
      subheadline: "Our biggest sale of the year is here",
      buttonText: "Shop Deals",
      ctaUrl: "/collections/black-friday",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "custom",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
      buttonColor: "#F59E0B",
      buttonTextColor: "#000000",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 7. SUMMER SALE (Seasonal)
// =============================================================================

const summerSale: AnnouncementRecipe = {
  id: "announcement-summer-sale",
  name: "Summer Sale",
  tagline: "☀️ Summer Sale",
  description:
    "Bright and cheerful banner for summer promotions.",
  icon: "☀️",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "seasonal",
  tags: ["summer", "playful", "discount"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "summer",
  layout: "banner-top",
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "☀️ Summer Sale — 30% Off Everything",
      subheadline: "Beat the heat with hot deals",
      buttonText: "Shop Summer",
      ctaUrl: "/collections/summer",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "custom",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#F97316",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#F97316",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 8. FLASH DEAL (Urgent)
// =============================================================================

const flashDeal: AnnouncementRecipe = {
  id: "announcement-flash-deal",
  name: "Flash Deal",
  tagline: "⚡ Flash Deal",
  description:
    "Time-sensitive banner for limited-time flash sales.",
  icon: "⚡",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  recipeType: "use_case",
  tags: ["urgent", "bold", "discount", "time-delay"] as RecipeTag[],
  component: "AnnouncementBanner",
  theme: "flash-deal",
  layout: "banner-top",
  inputs: [],
  editableFields: ANNOUNCEMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "⚡ Flash Deal — 40% Off for 2 Hours Only!",
      subheadline: "Hurry, this deal won't last",
      buttonText: "Grab It Now",
      ctaUrl: "/collections/flash-sale",
      ctaOpenInNewTab: false,
      sticky: true,
      colorScheme: "urgent",
      dismissLabel: "×",
    },
    designConfig: {
      position: "top",
      displayMode: "banner",
      backgroundColor: "#7C3AED",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#7C3AED",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 0,
      buttonBorderRadius: 4,
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: ANNOUNCEMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: ANNOUNCEMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// CATALOG EXPORT
// =============================================================================

/** All announcement design recipes */
export const ANNOUNCEMENT_DESIGN_RECIPES: AnnouncementRecipe[] = [
  storeWideSale,
  newCollectionLaunch,
  freeShippingThreshold,
  holidayAnnouncement,
  importantNotice,
  blackFriday,
  summerSale,
  flashDeal,
];

/** Get announcement recipe by ID */
export function getAnnouncementRecipeById(id: string): AnnouncementRecipe | undefined {
  return ANNOUNCEMENT_DESIGN_RECIPES.find((r) => r.id === id);
}

/** Get featured announcement recipes */
export function getFeaturedAnnouncementRecipes(): AnnouncementRecipe[] {
  return ANNOUNCEMENT_DESIGN_RECIPES.filter((r) => r.featured);
}

/** Get announcement recipes by tag */
export function getAnnouncementRecipesByTag(tag: RecipeTag): AnnouncementRecipe[] {
  return ANNOUNCEMENT_DESIGN_RECIPES.filter((r) => r.tags?.includes(tag));
}