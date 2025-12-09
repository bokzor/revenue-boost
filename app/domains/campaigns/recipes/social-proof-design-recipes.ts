/**
 * Social Proof Design Recipes
 *
 * Pre-designed social proof notification configurations for different use cases.
 * Each recipe includes complete design, content, and targeting configuration.
 *
 * Social proof notifications are corner popups that show recent purchases,
 * visitor activity, and reviews to build trust and create urgency.
 */

import type { SocialProofRecipe, RecipeTag, EditableField } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for social proof recipes
// =============================================================================

const SOCIAL_PROOF_EDITABLE_FIELDS: EditableField[] = [
  {
    key: "headline",
    type: "text" as const,
    label: "Headline",
    group: "content",
    validation: { maxLength: 60 },
  },
  {
    key: "displayDuration",
    type: "number" as const,
    label: "Display Duration (seconds)",
    group: "display",
    defaultValue: 6,
  },
  {
    key: "rotationInterval",
    type: "number" as const,
    label: "Rotation Interval (seconds)",
    group: "display",
    defaultValue: 8,
  },
  {
    key: "maxNotificationsPerSession",
    type: "number" as const,
    label: "Max Notifications Per Session",
    group: "display",
    defaultValue: 5,
  },
];

// =============================================================================
// COMMON TARGETING CONFIGURATION FOR SOCIAL PROOF
// =============================================================================

const SOCIAL_PROOF_FREQUENCY_CAPPING = {
  max_triggers_per_session: 10,
  max_triggers_per_day: 30,
  cooldown_between_triggers: 8, // 8 seconds - matches rotationInterval for continuous activity feel
};

const SOCIAL_PROOF_PAGE_TARGETING = {
  enabled: true,
  pages: [] as string[],
  customPatterns: [] as string[],
  excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*", "/cart"],
  productTags: [] as string[],
  collections: [] as string[],
};

// =============================================================================
// 1. RECENT PURCHASES (Trust Builder)
// =============================================================================

const recentPurchases: SocialProofRecipe = {
  id: "social-proof-recent-purchases",
  name: "Recent Purchases",
  tagline: "Build trust with activity",
  description:
    "Show recent purchases to build trust and create FOMO. Best for high-traffic stores.",
  icon: "🛍️",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "inspiration",
  tags: ["high-converting", "subtle", "modern"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-left",
  featured: true,
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "People are shopping right now",
      enablePurchaseNotifications: true,
      enableVisitorNotifications: false,
      enableReviewNotifications: false,
      cornerPosition: "bottom-left",
      displayDuration: 6,
      rotationInterval: 8,
      maxNotificationsPerSession: 5,
      showProductImage: true,
      showTimer: true,
      dismissLabel: "×",
    },
    designConfig: {
      position: "bottom",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      accentColor: "#10B981",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 12,
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5000 },
        frequency_capping: SOCIAL_PROOF_FREQUENCY_CAPPING,
      },
      pageTargeting: SOCIAL_PROOF_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 2. VISITOR ACTIVITY (Live Traffic)
// =============================================================================

const visitorActivity: SocialProofRecipe = {
  id: "social-proof-visitor-activity",
  name: "Visitor Activity",
  tagline: "Show live traffic",
  description: "Display live visitor counts to show popularity and create urgency.",
  icon: "👀",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "inspiration", // Artistic dark theme - uses preset colors
  tags: ["urgent", "modern", "high-converting"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-left",
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Hot right now",
      enablePurchaseNotifications: false,
      enableVisitorNotifications: true,
      enableReviewNotifications: false,
      cornerPosition: "bottom-left",
      displayDuration: 5,
      rotationInterval: 10,
      maxNotificationsPerSession: 8,
      minVisitorCount: 5,
      showProductImage: true,
      showTimer: false,
      dismissLabel: "×",
    },
    designConfig: {
      position: "bottom",
      backgroundColor: "#111827",
      textColor: "#FFFFFF",
      accentColor: "#F59E0B",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 12,
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 3000 },
        frequency_capping: SOCIAL_PROOF_FREQUENCY_CAPPING,
      },
      pageTargeting: SOCIAL_PROOF_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 3. REVIEW HIGHLIGHTS (Trust & Quality)
// =============================================================================

const reviewHighlights: SocialProofRecipe = {
  id: "social-proof-reviews",
  name: "Review Highlights",
  tagline: "Showcase 5-star reviews",
  description: "Display top customer reviews to build trust and social validation.",
  icon: "⭐",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "inspiration", // Artistic warm amber theme - uses preset colors
  tags: ["elegant", "subtle", "high-converting"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-left",
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "What customers are saying",
      enablePurchaseNotifications: false,
      enableVisitorNotifications: false,
      enableReviewNotifications: true,
      cornerPosition: "bottom-right",
      displayDuration: 8,
      rotationInterval: 12,
      maxNotificationsPerSession: 4,
      minReviewRating: 4,
      showProductImage: true,
      showTimer: false,
      dismissLabel: "×",
    },
    designConfig: {
      position: "bottom",
      backgroundColor: "#FFFBEB",
      textColor: "#92400E",
      accentColor: "#F59E0B",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 12,
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 10000 },
        frequency_capping: SOCIAL_PROOF_FREQUENCY_CAPPING,
      },
      pageTargeting: SOCIAL_PROOF_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 4. COMPLETE SOCIAL PROOF (All Types)
// =============================================================================

const completeSocialProof: SocialProofRecipe = {
  id: "social-proof-complete",
  name: "Complete Social Proof",
  tagline: "All notifications combined",
  description: "Show purchases, visitors, AND reviews in rotation for maximum impact.",
  icon: "🔥",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "use_case",
  tags: ["high-converting", "bold", "modern"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-left",
  featured: true,
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Join thousands of happy customers",
      enablePurchaseNotifications: true,
      enableVisitorNotifications: true,
      enableReviewNotifications: true,
      cornerPosition: "bottom-left",
      displayDuration: 6,
      rotationInterval: 8,
      maxNotificationsPerSession: 10,
      minVisitorCount: 3,
      minReviewRating: 4,
      showProductImage: true,
      showTimer: true,
      dismissLabel: "×",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 4000 },
        frequency_capping: SOCIAL_PROOF_FREQUENCY_CAPPING,
      },
      pageTargeting: SOCIAL_PROOF_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 5. MINIMAL DARK (Modern/Tech)
// =============================================================================

const minimalDark: SocialProofRecipe = {
  id: "social-proof-minimal-dark",
  name: "Minimal Dark",
  tagline: "Sleek dark mode",
  description: "Modern dark theme perfect for tech, gaming, or fashion stores.",
  icon: "🌙",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "inspiration",
  tags: ["dark", "minimal", "tech", "modern"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-right",
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Trending now",
      enablePurchaseNotifications: true,
      enableVisitorNotifications: true,
      enableReviewNotifications: false,
      cornerPosition: "bottom-right",
      displayDuration: 5,
      rotationInterval: 8,
      maxNotificationsPerSession: 6,
      showProductImage: true,
      showTimer: true,
      dismissLabel: "×",
    },
    designConfig: {
      position: "bottom",
      backgroundColor: "#0F172A",
      textColor: "#F1F5F9",
      accentColor: "#8B5CF6",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 16,
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5000 },
        frequency_capping: SOCIAL_PROOF_FREQUENCY_CAPPING,
      },
      pageTargeting: SOCIAL_PROOF_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 6. LUXURY ELEGANT (Fashion/Beauty)
// =============================================================================

const luxuryElegant: SocialProofRecipe = {
  id: "social-proof-luxury",
  name: "Luxury Elegant",
  tagline: "Premium brand feel",
  description: "Sophisticated design for luxury, fashion, or beauty brands.",
  icon: "✨",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "inspiration",
  tags: ["elegant", "luxury", "fashion", "beauty"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-left",
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Chosen by the best",
      enablePurchaseNotifications: true,
      enableVisitorNotifications: false,
      enableReviewNotifications: true,
      cornerPosition: "bottom-left",
      displayDuration: 7,
      rotationInterval: 10,
      maxNotificationsPerSession: 4,
      minReviewRating: 5,
      showProductImage: true,
      showTimer: false,
      dismissLabel: "×",
    },
    designConfig: {
      position: "bottom",
      backgroundColor: "#FAF9F7",
      textColor: "#1A1A1A",
      accentColor: "#C9A962",
      fontFamily: "'Playfair Display', Georgia, serif",
      borderRadius: 4,
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 6000 },
        frequency_capping: SOCIAL_PROOF_FREQUENCY_CAPPING,
      },
      pageTargeting: SOCIAL_PROOF_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 7. URGENCY BOOST (High-Traffic Sales)
// =============================================================================

const urgencyBoost: SocialProofRecipe = {
  id: "social-proof-urgency",
  name: "Urgency Boost",
  tagline: "Maximum FOMO effect",
  description: "Fast-rotating notifications for flash sales and high-traffic events.",
  icon: "⚡",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "inspiration", // Artistic bold red theme - uses preset colors
  tags: ["urgent", "bold", "high-converting", "discount"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-left",
  featured: true,
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Selling fast!",
      enablePurchaseNotifications: true,
      enableVisitorNotifications: true,
      enableReviewNotifications: false,
      cornerPosition: "bottom-left",
      displayDuration: 4,
      rotationInterval: 5,
      maxNotificationsPerSession: 15,
      minVisitorCount: 2,
      showProductImage: true,
      showTimer: true,
      dismissLabel: "×",
    },
    designConfig: {
      position: "bottom",
      backgroundColor: "#DC2626",
      textColor: "#FFFFFF",
      accentColor: "#FEF3C7",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 8,
      boxShadow: "0 10px 40px rgba(220, 38, 38, 0.3)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 2000 },
        frequency_capping: {
          max_triggers_per_session: 20,
          max_triggers_per_day: 50,
          cooldown_between_triggers: 5, // 5 seconds - fast rotation for maximum urgency
        },
      },
      pageTargeting: SOCIAL_PROOF_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 8. PRODUCT PAGE FOCUSED
// =============================================================================

const productPageFocused: SocialProofRecipe = {
  id: "social-proof-product-page",
  name: "Product Page Focused",
  tagline: "Convert browsers to buyers",
  description: "Optimized for product pages with purchase and review notifications.",
  icon: "📦",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "SOCIAL_PROOF",
  recipeType: "inspiration", // Artistic green theme - uses preset colors
  tags: ["high-converting", "subtle", "modern"] as RecipeTag[],
  component: "AnnouncementBanner",
  layout: "sidebar-right",
  inputs: [],
  editableFields: SOCIAL_PROOF_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Others love this product",
      enablePurchaseNotifications: true,
      enableVisitorNotifications: false,
      enableReviewNotifications: true,
      cornerPosition: "bottom-right",
      displayDuration: 6,
      rotationInterval: 10,
      maxNotificationsPerSession: 6,
      minReviewRating: 4,
      showProductImage: true,
      showTimer: true,
      dismissLabel: "×",
    },
    designConfig: {
      position: "bottom",
      backgroundColor: "#ECFDF5",
      textColor: "#065F46",
      accentColor: "#10B981",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 12,
      boxShadow: "0 10px 40px rgba(16, 185, 129, 0.15)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 8000 },
        frequency_capping: SOCIAL_PROOF_FREQUENCY_CAPPING,
      },
      pageTargeting: {
        enabled: true,
        pages: ["/products/*"],
        customPatterns: [] as string[],
        excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*", "/cart"],
        productTags: [] as string[],
        collections: [] as string[],
      },
    },
  },
};

// =============================================================================
// CATALOG EXPORT
// =============================================================================

/** All social proof design recipes */
export const SOCIAL_PROOF_DESIGN_RECIPES: SocialProofRecipe[] = [
  recentPurchases,
  visitorActivity,
  reviewHighlights,
  completeSocialProof,
  minimalDark,
  luxuryElegant,
  urgencyBoost,
  productPageFocused,
];

/** Get social proof recipe by ID */
export function getSocialProofRecipeById(id: string): SocialProofRecipe | undefined {
  return SOCIAL_PROOF_DESIGN_RECIPES.find((r) => r.id === id);
}

/** Get featured social proof recipes */
export function getFeaturedSocialProofRecipes(): SocialProofRecipe[] {
  return SOCIAL_PROOF_DESIGN_RECIPES.filter((r) => r.featured);
}

/** Get social proof recipes by tag */
export function getSocialProofRecipesByTag(tag: RecipeTag): SocialProofRecipe[] {
  return SOCIAL_PROOF_DESIGN_RECIPES.filter((r) => r.tags?.includes(tag));
}
