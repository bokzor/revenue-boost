/**
 * Spin To Win Design Recipes
 *
 * Pre-designed spin-to-win popup configurations for different industries and styles.
 * Each recipe includes complete design, content, targeting, and prize configuration.
 */

import type { SpinToWinRecipe, RecipeTag } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for spin-to-win recipes
// =============================================================================

const SPIN_TO_WIN_EDITABLE_FIELDS = [
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
    key: "spinButtonText",
    type: "text" as const,
    label: "Spin Button Text",
    group: "content",
    validation: { required: true, maxLength: 30 },
  },
  {
    key: "buttonText",
    type: "text" as const,
    label: "Claim Button Text",
    group: "content",
    validation: { required: true, maxLength: 30 },
  },
  { key: "emailPlaceholder", type: "text" as const, label: "Email Placeholder", group: "content" },
];

const TRIGGER_INPUT = {
  type: "select" as const,
  key: "triggerType",
  label: "When to show",
  options: [
    { label: "After a few seconds", value: "page_load" },
    { label: "When leaving the page", value: "exit_intent" },
    { label: "After scrolling", value: "scroll_depth" },
  ],
  defaultValue: "page_load",
};

// Top prize discount input - used to configure the best prize on the wheel
const TOP_PRIZE_INPUT = {
  type: "discount_percentage" as const,
  key: "topPrize",
  label: "Top Prize Discount",
  defaultValue: 20,
  min: 10,
  max: 50,
};

// =============================================================================
// COMMON TARGETING CONFIGURATION FOR SPIN-TO-WIN
// =============================================================================

// Strict frequency capping for gamification - once per session, once per day
const SPIN_TO_WIN_FREQUENCY_CAPPING = {
  max_triggers_per_session: 1,
  max_triggers_per_day: 1,
  cooldown_between_triggers: 86400, // 24 hours in seconds
};

// Page targeting - exclude checkout and cart pages
const SPIN_TO_WIN_PAGE_TARGETING = {
  enabled: true,
  pages: [] as string[],
  customPatterns: [] as string[],
  excludePages: ["/checkout", "/checkout/*", "/cart", "/*/checkouts/*"],
  productTags: [] as string[],
  collections: [] as string[],
};

// =============================================================================
// HELPER: Create discount config for wheel segments
// =============================================================================

type SegmentDiscountConfig = {
  enabled: boolean;
  showInPreview: boolean;
  strategy: "simple";
  valueType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  behavior: "SHOW_CODE_AND_AUTO_APPLY";
  expiryDays: number;
  type: "single_use";
};

const createSegmentDiscount = (
  valueType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING",
  value: number
): SegmentDiscountConfig => ({
  enabled: true,
  showInPreview: true,
  strategy: "simple",
  valueType,
  value,
  behavior: "SHOW_CODE_AND_AUTO_APPLY",
  expiryDays: 30,
  type: "single_use",
});

// No discount for "Try Again" segments
const NO_DISCOUNT: SegmentDiscountConfig = {
  enabled: false,
  showInPreview: false,
  strategy: "simple",
  valueType: "PERCENTAGE",
  value: 0,
  behavior: "SHOW_CODE_AND_AUTO_APPLY",
  expiryDays: 30,
  type: "single_use",
};

// =============================================================================
// 1. LUCKY FORTUNE (Casino Theme)
// =============================================================================

const luckyFortune: SpinToWinRecipe = {
  id: "spin-to-win-lucky-fortune",
  name: "Lucky Fortune",
  tagline: "Spin Your Fortune!",
  description: "Vegas-inspired wheel for gaming and entertainment brands.",
  icon: "🎰",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  recipeType: "inspiration", // Artistic design - uses preset colors
  tags: ["luxury", "dark", "bold"] as RecipeTag[],
  component: "SpinToWin",
  theme: "lucky-fortune",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT, TOP_PRIZE_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin Your Fortune!",
      subheadline: "Try your luck and win exclusive rewards",
      spinButtonText: "SPIN TO WIN",
      buttonText: "Claim Prize",
      emailPlaceholder: "Enter your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.25, color: "#D4AF37", discountConfig: createSegmentDiscount("PERCENTAGE", 10) },
        { id: "prize-2", label: "15% OFF", probability: 0.2, color: "#1A1814", discountConfig: createSegmentDiscount("PERCENTAGE", 15) },
        { id: "prize-3", label: "Free Gift", probability: 0.15, color: "#D4AF37", discountConfig: createSegmentDiscount("FIXED_AMOUNT", 0) },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#1A1814", discountConfig: NO_DISCOUNT },
        { id: "prize-5", label: "25% OFF", probability: 0.15, color: "#D4AF37", discountConfig: createSegmentDiscount("PERCENTAGE", 25) },
        { id: "prize-6", label: "5% OFF", probability: 0.1, color: "#1A1814", discountConfig: createSegmentDiscount("PERCENTAGE", 5) },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to receive promotional offers",
      // Enhanced wheel styling
      wheelGlowEnabled: true,
      wheelGlowColor: "#D4AF37",
      wheelCenterStyle: "metallic",
      // Promotional badge
      badgeEnabled: true,
      badgeText: "Limited Time Offer",
      badgeIcon: "sparkles",
      // Result state
      showResultIcon: true,
      resultIconType: "trophy",
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "bounce",
      backgroundColor: "#1A1814",
      textColor: "#F5F0E8",
      descriptionColor: "#C9B99A",
      buttonColor: "#D4AF37",
      buttonTextColor: "#1A1814",
      inputBackgroundColor: "rgba(212, 175, 55, 0.1)",
      inputTextColor: "#F5F0E8",
      inputPlaceholderColor: "rgba(245, 240, 232, 0.6)", // Light cream placeholder with opacity
      inputBorderColor: "#D4AF37",
      accentColor: "#D4AF37",
      fontFamily: "'Playfair Display', Georgia, serif",
      borderRadius: 16,
      buttonBorderRadius: 8,
      inputBorderRadius: 8,
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 5000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
        frequency_capping: SPIN_TO_WIN_FREQUENCY_CAPPING,
      },
      pageTargeting: SPIN_TO_WIN_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 2. NEON NIGHTS (Cyberpunk/Gaming Theme)
// =============================================================================

const neonNights: SpinToWinRecipe = {
  id: "spin-to-win-neon-nights",
  name: "Neon Nights",
  tagline: "SPIN FOR LOOT",
  description: "Cyberpunk-inspired wheel for gaming and tech brands.",
  icon: "🌈",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  recipeType: "inspiration", // Artistic design - uses preset colors
  tags: ["tech", "dark", "bold", "modern"] as RecipeTag[],
  component: "SpinToWin",
  theme: "neon-nights",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT, TOP_PRIZE_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "SPIN FOR LOOT 🎮",
      subheadline: "Unlock your player reward",
      spinButtonText: "SPIN NOW",
      buttonText: "CLAIM LOOT",
      emailPlaceholder: "Enter your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.25, color: "#EC4899", discountConfig: createSegmentDiscount("PERCENTAGE", 10) },
        { id: "prize-2", label: "15% OFF", probability: 0.2, color: "#8B5CF6", discountConfig: createSegmentDiscount("PERCENTAGE", 15) },
        { id: "prize-3", label: "Free Item", probability: 0.15, color: "#06B6D4", discountConfig: createSegmentDiscount("FIXED_AMOUNT", 0) },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#1F2937", discountConfig: NO_DISCOUNT },
        { id: "prize-5", label: "20% OFF", probability: 0.1, color: "#10B981", discountConfig: createSegmentDiscount("PERCENTAGE", 20) },
        { id: "prize-6", label: "5% OFF", probability: 0.15, color: "#F59E0B", discountConfig: createSegmentDiscount("PERCENTAGE", 5) },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "slide",
      backgroundColor: "#0F0C29",
      textColor: "#FFFFFF",
      descriptionColor: "#A78BFA",
      buttonColor: "#EC4899",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "rgba(167, 139, 250, 0.2)",
      inputTextColor: "#FFFFFF",
      inputPlaceholderColor: "rgba(255, 255, 255, 0.6)", // White placeholder with opacity
      inputBorderColor: "#A78BFA",
      accentColor: "#EC4899",
      fontFamily: "'Space Grotesk', 'Courier New', monospace",
      borderRadius: 8,
      buttonBorderRadius: 4,
      inputBorderRadius: 4,
      textAlign: "center",
      contentSpacing: "compact",
      buttonBoxShadow: "0 0 20px rgba(236, 72, 153, 0.5)",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 5000 },
        scroll_depth: { enabled: true, depth_percentage: 30 },
        frequency_capping: SPIN_TO_WIN_FREQUENCY_CAPPING,
      },
      pageTargeting: SPIN_TO_WIN_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 3. PASTEL DREAM (Beauty/Feminine Theme)
// =============================================================================

const pastelDream: SpinToWinRecipe = {
  id: "spin-to-win-pastel-dream",
  name: "Pastel Dream",
  tagline: "Spin for Your Beauty Gift",
  description: "Soft and feminine wheel for beauty and wellness brands.",
  icon: "🌸",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  recipeType: "inspiration", // Artistic design - uses preset colors
  tags: ["beauty", "elegant", "playful"] as RecipeTag[],
  component: "SpinToWin",
  theme: "pastel-dream",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT, TOP_PRIZE_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin for Your Beauty Gift ✨",
      subheadline: "A special treat awaits you",
      spinButtonText: "Spin the Wheel",
      buttonText: "Claim My Gift",
      emailPlaceholder: "Your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.25, color: "#F9A8D4", discountConfig: createSegmentDiscount("PERCENTAGE", 10) },
        { id: "prize-2", label: "Free Sample", probability: 0.2, color: "#FDF2F8", discountConfig: createSegmentDiscount("FIXED_AMOUNT", 0) },
        { id: "prize-3", label: "15% OFF", probability: 0.15, color: "#FBCFE8", discountConfig: createSegmentDiscount("PERCENTAGE", 15) },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#FCE7F3", discountConfig: NO_DISCOUNT },
        { id: "prize-5", label: "20% OFF", probability: 0.1, color: "#F472B6", discountConfig: createSegmentDiscount("PERCENTAGE", 20) },
        { id: "prize-6", label: "5% OFF", probability: 0.15, color: "#EC4899", discountConfig: createSegmentDiscount("PERCENTAGE", 5) },
      ],
      nameFieldEnabled: true,
      nameFieldRequired: false,
      nameFieldPlaceholder: "Your name",
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to receive beauty tips and offers",
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      backgroundColor: "#FDF2F8",
      textColor: "#831843",
      descriptionColor: "#9D174D",
      buttonColor: "#DB2777",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputTextColor: "#831843",
      inputBorderColor: "#FBCFE8",
      accentColor: "#F472B6",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      borderRadius: 20,
      buttonBorderRadius: 999,
      inputBorderRadius: 12,
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 6000 },
        scroll_depth: { enabled: true, depth_percentage: 35 },
        frequency_capping: SPIN_TO_WIN_FREQUENCY_CAPPING,
      },
      pageTargeting: SPIN_TO_WIN_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 4. OCEAN BREEZE (Summer/Beach Theme)
// =============================================================================

const oceanBreeze: SpinToWinRecipe = {
  id: "spin-to-win-ocean-breeze",
  name: "Ocean Breeze",
  tagline: "Spin & Ride the Wave!",
  description: "Fresh summer wheel for outdoor and lifestyle brands.",
  icon: "🌊",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  recipeType: "inspiration", // Artistic design - uses preset colors
  tags: ["summer", "outdoor", "playful"] as RecipeTag[],
  component: "SpinToWin",
  theme: "ocean-breeze",
  layout: "centered",
  inputs: [TRIGGER_INPUT, TOP_PRIZE_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin & Ride the Wave! 🌊",
      subheadline: "Catch your summer discount",
      spinButtonText: "SPIN NOW",
      buttonText: "Claim Deal",
      emailPlaceholder: "Your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.25, color: "#0EA5E9", discountConfig: createSegmentDiscount("PERCENTAGE", 10) },
        { id: "prize-2", label: "Free Ship", probability: 0.2, color: "#38BDF8", discountConfig: createSegmentDiscount("FREE_SHIPPING", 0) },
        { id: "prize-3", label: "15% OFF", probability: 0.15, color: "#7DD3FC", discountConfig: createSegmentDiscount("PERCENTAGE", 15) },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#BAE6FD", discountConfig: NO_DISCOUNT },
        { id: "prize-5", label: "20% OFF", probability: 0.1, color: "#0284C7", discountConfig: createSegmentDiscount("PERCENTAGE", 20) },
        { id: "prize-6", label: "5% OFF", probability: 0.15, color: "#0369A1", discountConfig: createSegmentDiscount("PERCENTAGE", 5) },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "bounce",
      backgroundColor: "#F0F9FF",
      textColor: "#0C4A6E",
      descriptionColor: "#0369A1",
      buttonColor: "#0EA5E9",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputTextColor: "#0C4A6E",
      inputBorderColor: "#BAE6FD",
      accentColor: "#0EA5E9",
      fontFamily: "'Poppins', system-ui, sans-serif",
      borderRadius: 16,
      buttonBorderRadius: 12,
      inputBorderRadius: 8,
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 5000 },
        frequency_capping: SPIN_TO_WIN_FREQUENCY_CAPPING,
      },
      pageTargeting: SPIN_TO_WIN_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 6. MINIMAL MONO (Clean Tech Theme)
// =============================================================================

const minimalMono: SpinToWinRecipe = {
  id: "spin-to-win-minimal-mono",
  name: "Minimal Mono",
  tagline: "Spin to Unlock",
  description: "Clean and modern wheel for SaaS and tech brands.",
  icon: "⚪",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  recipeType: "use_case",
  tags: ["tech", "minimal", "modern"] as RecipeTag[],
  component: "SpinToWin",
  layout: "centered",
  inputs: [TRIGGER_INPUT, TOP_PRIZE_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin to Unlock",
      subheadline: "Your exclusive discount awaits",
      spinButtonText: "SPIN",
      buttonText: "Apply Discount",
      emailPlaceholder: "Enter your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "5% OFF", probability: 0.3, color: "#18181B", discountConfig: createSegmentDiscount("PERCENTAGE", 5) },
        { id: "prize-2", label: "10% OFF", probability: 0.25, color: "#FAFAFA", discountConfig: createSegmentDiscount("PERCENTAGE", 10) },
        { id: "prize-3", label: "15% OFF", probability: 0.15, color: "#18181B", discountConfig: createSegmentDiscount("PERCENTAGE", 15) },
        { id: "prize-4", label: "Try Again", probability: 0.1, color: "#FAFAFA", discountConfig: NO_DISCOUNT },
        { id: "prize-5", label: "20% OFF", probability: 0.1, color: "#18181B", discountConfig: createSegmentDiscount("PERCENTAGE", 20) },
        { id: "prize-6", label: "Free Ship", probability: 0.1, color: "#FAFAFA", discountConfig: createSegmentDiscount("FREE_SHIPPING", 0) },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
      // Enhanced wheel styling
      wheelGlowEnabled: false,
      wheelCenterStyle: "simple",
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      backgroundColor: "#FFFFFF",
      textColor: "#18181B",
      descriptionColor: "#71717A",
      buttonColor: "#18181B",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FAFAFA",
      inputTextColor: "#18181B",
      inputPlaceholderColor: "#A1A1AA",
      inputBorderColor: "#E4E4E7",
      accentColor: "#18181B",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      borderRadius: 20,
      buttonBorderRadius: 12,
      inputBorderRadius: 12,
      textAlign: "center",
      contentSpacing: "compact",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 8000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
        frequency_capping: SPIN_TO_WIN_FREQUENCY_CAPPING,
      },
      pageTargeting: SPIN_TO_WIN_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 7. RETRO ARCADE (80s Theme)
// =============================================================================

const retroArcade: SpinToWinRecipe = {
  id: "spin-to-win-retro-arcade",
  name: "Retro Arcade",
  tagline: "INSERT COIN TO SPIN",
  description: "80s nostalgia wheel for pop culture and gaming brands.",
  icon: "👾",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  recipeType: "inspiration", // Artistic design - uses preset colors
  tags: ["playful", "bold", "dark"] as RecipeTag[],
  component: "SpinToWin",
  theme: "retro-arcade",
  layout: "centered",
  inputs: [TRIGGER_INPUT, TOP_PRIZE_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "INSERT COIN TO SPIN 👾",
      subheadline: "Game on! Win epic prizes",
      spinButtonText: "PRESS START",
      buttonText: "CLAIM PRIZE",
      emailPlaceholder: "player@email.com",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.25, color: "#F43F5E", discountConfig: createSegmentDiscount("PERCENTAGE", 10) },
        { id: "prize-2", label: "5% OFF", probability: 0.2, color: "#FACC15", discountConfig: createSegmentDiscount("PERCENTAGE", 5) },
        { id: "prize-3", label: "15% OFF", probability: 0.15, color: "#22C55E", discountConfig: createSegmentDiscount("PERCENTAGE", 15) },
        { id: "prize-4", label: "RETRY", probability: 0.15, color: "#3B82F6", discountConfig: NO_DISCOUNT },
        { id: "prize-5", label: "JACKPOT", probability: 0.1, color: "#A855F7", discountConfig: createSegmentDiscount("PERCENTAGE", 30) },
        { id: "prize-6", label: "20% OFF", probability: 0.15, color: "#06B6D4", discountConfig: createSegmentDiscount("PERCENTAGE", 20) },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "bounce",
      backgroundColor: "#1E1B4B",
      textColor: "#FACC15",
      descriptionColor: "#C4B5FD",
      buttonColor: "#F43F5E",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "rgba(250, 204, 21, 0.1)",
      inputTextColor: "#FACC15",
      inputBorderColor: "#FACC15",
      accentColor: "#FACC15",
      fontFamily: "'Press Start 2P', 'VT323', monospace",
      borderRadius: 0,
      buttonBorderRadius: 0,
      inputBorderRadius: 0,
      textAlign: "center",
      contentSpacing: "compact",
      buttonBoxShadow: "4px 4px 0 #000000",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 5000 },
        scroll_depth: { enabled: true, depth_percentage: 25 },
        frequency_capping: SPIN_TO_WIN_FREQUENCY_CAPPING,
      },
      pageTargeting: SPIN_TO_WIN_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 8. EARTHY ORGANIC (Natural/Artisan Theme)
// =============================================================================

const earthyOrganic: SpinToWinRecipe = {
  id: "spin-to-win-earthy-organic",
  name: "Earthy Organic",
  tagline: "Spin for Natural Rewards",
  description: "Warm and natural wheel for organic and artisan brands.",
  icon: "🌿",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  recipeType: "inspiration", // Artistic design - uses preset colors
  tags: ["wellness", "warm", "elegant"] as RecipeTag[],
  component: "SpinToWin",
  theme: "earthy-organic",
  layout: "centered",
  inputs: [TRIGGER_INPUT, TOP_PRIZE_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin for Natural Rewards 🌿",
      subheadline: "Handcrafted prizes, just for you",
      spinButtonText: "Spin the Wheel",
      buttonText: "Claim Reward",
      emailPlaceholder: "Your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.25, color: "#A16207", discountConfig: createSegmentDiscount("PERCENTAGE", 10) },
        { id: "prize-2", label: "Free Ship", probability: 0.2, color: "#FEF3C7", discountConfig: createSegmentDiscount("FREE_SHIPPING", 0) },
        { id: "prize-3", label: "15% OFF", probability: 0.15, color: "#CA8A04", discountConfig: createSegmentDiscount("PERCENTAGE", 15) },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#FDE68A", discountConfig: NO_DISCOUNT },
        { id: "prize-5", label: "Free Gift", probability: 0.1, color: "#78350F", discountConfig: createSegmentDiscount("FIXED_AMOUNT", 0) },
        { id: "prize-6", label: "5% OFF", probability: 0.15, color: "#D97706", discountConfig: createSegmentDiscount("PERCENTAGE", 5) },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to receive updates about new products",
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      backgroundColor: "#FEFCE8",
      textColor: "#422006",
      descriptionColor: "#78350F",
      buttonColor: "#78350F",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#FFFFFF",
      inputTextColor: "#422006",
      inputBorderColor: "#FDE68A",
      accentColor: "#92400E",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      borderRadius: 8,
      buttonBorderRadius: 6,
      inputBorderRadius: 6,
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 6000 },
        scroll_depth: { enabled: true, depth_percentage: 40 },
        frequency_capping: SPIN_TO_WIN_FREQUENCY_CAPPING,
      },
      pageTargeting: SPIN_TO_WIN_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// EXPORT ALL RECIPES
// =============================================================================

export const SPIN_TO_WIN_DESIGN_RECIPES: SpinToWinRecipe[] = [
  luckyFortune,
  neonNights,
  pastelDream,
  oceanBreeze,
  minimalMono,
  retroArcade,
  earthyOrganic,
];

export default SPIN_TO_WIN_DESIGN_RECIPES;
