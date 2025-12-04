/**
 * Spin To Win Design Recipes
 *
 * Pre-designed spin-to-win popup configurations for different industries and styles.
 * Each recipe includes complete design, content, targeting, and prize configuration.
 */

import type { StyledRecipe, RecipeTag } from "./styled-recipe-types";

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
    { label: "After a few seconds", value: "time_delay" },
    { label: "When leaving the page", value: "exit_intent" },
    { label: "After scrolling", value: "scroll_depth" },
  ],
  defaultValue: "time_delay",
};

// =============================================================================
// DEFAULT WHEEL SEGMENTS (can be customized per recipe)
// =============================================================================

const DEFAULT_SEGMENTS = [
  { id: "prize-1", label: "10% OFF", probability: 0.3 },
  { id: "prize-2", label: "15% OFF", probability: 0.25 },
  { id: "prize-3", label: "Free Shipping", probability: 0.2 },
  { id: "prize-4", label: "Try Again", probability: 0.15 },
  { id: "prize-5", label: "20% OFF", probability: 0.1 },
];

// =============================================================================
// 1. LUCKY FORTUNE (Casino Theme)
// =============================================================================

const luckyFortune: StyledRecipe = {
  id: "spin-to-win-lucky-fortune",
  name: "Lucky Fortune",
  tagline: "Spin Your Fortune!",
  description: "Vegas-inspired wheel for gaming and entertainment brands.",
  icon: "🎰",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["luxury", "dark", "bold"] as RecipeTag[],
  component: "SpinToWin",
  theme: "lucky-fortune",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin Your Fortune! 🎰",
      subheadline: "Try your luck and win exclusive rewards",
      spinButtonText: "SPIN TO WIN",
      buttonText: "Claim Prize",
      emailPlaceholder: "Enter your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.3, color: "#D4AF37" },
        { id: "prize-2", label: "15% OFF", probability: 0.25, color: "#1A1814" },
        { id: "prize-3", label: "Free Gift", probability: 0.2, color: "#D4AF37" },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#1A1814" },
        { id: "prize-5", label: "25% OFF", probability: 0.1, color: "#D4AF37" },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to receive promotional offers",
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
        time_delay: { enabled: true, delay: 5000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 2. NEON NIGHTS (Cyberpunk/Gaming Theme)
// =============================================================================

const neonNights: StyledRecipe = {
  id: "spin-to-win-neon-nights",
  name: "Neon Nights",
  tagline: "SPIN FOR LOOT",
  description: "Cyberpunk-inspired wheel for gaming and tech brands.",
  icon: "🌈",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["tech", "dark", "bold", "modern"] as RecipeTag[],
  component: "SpinToWin",
  theme: "neon-nights",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT],
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
        { id: "prize-1", label: "10% OFF", probability: 0.3, color: "#EC4899" },
        { id: "prize-2", label: "15% OFF", probability: 0.25, color: "#8B5CF6" },
        { id: "prize-3", label: "Free Item", probability: 0.2, color: "#06B6D4" },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#1F2937" },
        { id: "prize-5", label: "20% OFF", probability: 0.1, color: "#10B981" },
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
        time_delay: { enabled: true, delay: 4000 },
        scroll_depth: { enabled: true, depth_percentage: 30 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 3. PASTEL DREAM (Beauty/Feminine Theme)
// =============================================================================

const pastelDream: StyledRecipe = {
  id: "spin-to-win-pastel-dream",
  name: "Pastel Dream",
  tagline: "Spin for Your Beauty Gift",
  description: "Soft and feminine wheel for beauty and wellness brands.",
  icon: "🌸",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["beauty", "elegant", "playful"] as RecipeTag[],
  component: "SpinToWin",
  theme: "pastel-dream",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT],
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
        { id: "prize-1", label: "10% OFF", probability: 0.3, color: "#F9A8D4" },
        { id: "prize-2", label: "Free Sample", probability: 0.25, color: "#FDF2F8" },
        { id: "prize-3", label: "15% OFF", probability: 0.2, color: "#FBCFE8" },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#FCE7F3" },
        { id: "prize-5", label: "20% OFF", probability: 0.1, color: "#F472B6" },
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
        time_delay: { enabled: true, delay: 6000 },
        scroll_depth: { enabled: true, depth_percentage: 35 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 4. OCEAN BREEZE (Summer/Beach Theme)
// =============================================================================

const oceanBreeze: StyledRecipe = {
  id: "spin-to-win-ocean-breeze",
  name: "Ocean Breeze",
  tagline: "Spin & Ride the Wave!",
  description: "Fresh summer wheel for outdoor and lifestyle brands.",
  icon: "🌊",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["summer", "outdoor", "playful"] as RecipeTag[],
  component: "SpinToWin",
  theme: "ocean-breeze",
  layout: "centered",
  inputs: [TRIGGER_INPUT],
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
        { id: "prize-1", label: "10% OFF", probability: 0.3, color: "#0EA5E9" },
        { id: "prize-2", label: "Free Ship", probability: 0.25, color: "#38BDF8" },
        { id: "prize-3", label: "15% OFF", probability: 0.2, color: "#7DD3FC" },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#BAE6FD" },
        { id: "prize-5", label: "20% OFF", probability: 0.1, color: "#0284C7" },
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
        time_delay: { enabled: true, delay: 5000 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 5. HOLIDAY CHEER (Seasonal Theme)
// =============================================================================

const holidayCheer: StyledRecipe = {
  id: "spin-to-win-holiday-cheer",
  name: "Holiday Cheer",
  tagline: "Spin for Holiday Magic!",
  description: "Festive wheel for seasonal campaigns and holiday promotions.",
  icon: "🎄",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["holiday", "winter", "bold"] as RecipeTag[],
  component: "SpinToWin",
  theme: "holiday-cheer",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin for Holiday Magic! 🎄",
      subheadline: "Santa has a surprise for you",
      spinButtonText: "SPIN THE WHEEL",
      buttonText: "Open My Gift",
      emailPlaceholder: "Your email",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "10% OFF", probability: 0.3, color: "#DC2626" },
        { id: "prize-2", label: "Free Gift", probability: 0.25, color: "#16A34A" },
        { id: "prize-3", label: "15% OFF", probability: 0.2, color: "#DC2626" },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#16A34A" },
        { id: "prize-5", label: "25% OFF", probability: 0.1, color: "#FCD34D" },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "bounce",
      backgroundColor: "#7F1D1D",
      textColor: "#FFFFFF",
      descriptionColor: "#FDE68A",
      buttonColor: "#FCD34D",
      buttonTextColor: "#7F1D1D",
      inputBackgroundColor: "rgba(255,255,255,0.9)",
      inputTextColor: "#7F1D1D",
      inputBorderColor: "#FDE68A",
      accentColor: "#FCD34D",
      fontFamily: "'Playfair Display', Georgia, serif",
      borderRadius: 16,
      buttonBorderRadius: 8,
      inputBorderRadius: 8,
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 4000 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

// =============================================================================
// 6. MINIMAL MONO (Clean Tech Theme)
// =============================================================================

const minimalMono: StyledRecipe = {
  id: "spin-to-win-minimal-mono",
  name: "Minimal Mono",
  tagline: "Spin to Unlock",
  description: "Clean and modern wheel for SaaS and tech brands.",
  icon: "⚪",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["tech", "minimal", "modern"] as RecipeTag[],
  component: "SpinToWin",
  theme: "minimal-mono",
  layout: "centered",
  inputs: [TRIGGER_INPUT],
  editableFields: SPIN_TO_WIN_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spin to Unlock",
      subheadline: "Your exclusive discount awaits",
      spinButtonText: "SPIN",
      buttonText: "Apply Discount",
      emailPlaceholder: "you@company.com",
      emailRequired: true,
      wheelSegments: [
        { id: "prize-1", label: "5% OFF", probability: 0.35, color: "#F9FAFB" },
        { id: "prize-2", label: "10% OFF", probability: 0.3, color: "#E5E7EB" },
        { id: "prize-3", label: "15% OFF", probability: 0.2, color: "#D1D5DB" },
        { id: "prize-4", label: "Try Again", probability: 0.1, color: "#9CA3AF" },
        { id: "prize-5", label: "20% OFF", probability: 0.05, color: "#111827" },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      descriptionColor: "#6B7280",
      buttonColor: "#111827",
      buttonTextColor: "#FFFFFF",
      inputBackgroundColor: "#F9FAFB",
      inputTextColor: "#111827",
      inputBorderColor: "#E5E7EB",
      accentColor: "#3B82F6",
      fontFamily: "'Inter', system-ui, sans-serif",
      borderRadius: 12,
      buttonBorderRadius: 8,
      inputBorderRadius: 6,
      textAlign: "center",
      contentSpacing: "compact",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 8000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 7. RETRO ARCADE (80s Theme)
// =============================================================================

const retroArcade: StyledRecipe = {
  id: "spin-to-win-retro-arcade",
  name: "Retro Arcade",
  tagline: "INSERT COIN TO SPIN",
  description: "80s nostalgia wheel for pop culture and gaming brands.",
  icon: "👾",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["playful", "bold", "dark"] as RecipeTag[],
  component: "SpinToWin",
  theme: "retro-arcade",
  layout: "centered",
  inputs: [TRIGGER_INPUT],
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
        { id: "prize-1", label: "10% OFF", probability: 0.3, color: "#F43F5E" },
        { id: "prize-2", label: "BONUS", probability: 0.25, color: "#FACC15" },
        { id: "prize-3", label: "15% OFF", probability: 0.2, color: "#22C55E" },
        { id: "prize-4", label: "RETRY", probability: 0.15, color: "#3B82F6" },
        { id: "prize-5", label: "JACKPOT", probability: 0.1, color: "#A855F7" },
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
        time_delay: { enabled: true, delay: 4000 },
        scroll_depth: { enabled: true, depth_percentage: 25 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 8. EARTHY ORGANIC (Natural/Artisan Theme)
// =============================================================================

const earthyOrganic: StyledRecipe = {
  id: "spin-to-win-earthy-organic",
  name: "Earthy Organic",
  tagline: "Spin for Natural Rewards",
  description: "Warm and natural wheel for organic and artisan brands.",
  icon: "🌿",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SPIN_TO_WIN",
  tags: ["wellness", "warm", "elegant"] as RecipeTag[],
  component: "SpinToWin",
  theme: "earthy-organic",
  layout: "centered",
  inputs: [TRIGGER_INPUT],
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
        { id: "prize-1", label: "10% OFF", probability: 0.3, color: "#A16207" },
        { id: "prize-2", label: "Free Ship", probability: 0.25, color: "#FEF3C7" },
        { id: "prize-3", label: "15% OFF", probability: 0.2, color: "#CA8A04" },
        { id: "prize-4", label: "Try Again", probability: 0.15, color: "#FDE68A" },
        { id: "prize-5", label: "Free Gift", probability: 0.1, color: "#78350F" },
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
        time_delay: { enabled: true, delay: 6000 },
        scroll_depth: { enabled: true, depth_percentage: 40 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// EXPORT ALL RECIPES
// =============================================================================

export const SPIN_TO_WIN_DESIGN_RECIPES: StyledRecipe[] = [
  luckyFortune,
  neonNights,
  pastelDream,
  oceanBreeze,
  holidayCheer,
  minimalMono,
  retroArcade,
  earthyOrganic,
];

export default SPIN_TO_WIN_DESIGN_RECIPES;

