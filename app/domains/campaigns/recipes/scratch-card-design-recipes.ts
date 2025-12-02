/**
 * Scratch Card Design Recipes
 *
 * Pre-designed scratch card popup configurations for different industries and styles.
 * Each recipe includes complete design, content, targeting, and prize configuration.
 *
 * @see docs/design-recipes/SCRATCH_CARD_RECIPES_PLAN.md
 */

import type { StyledRecipe, RecipeTag } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for scratch card recipes
// =============================================================================

const SCRATCH_CARD_EDITABLE_FIELDS = [
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
    key: "scratchInstruction",
    type: "text" as const,
    label: "Scratch Instruction",
    group: "content",
    validation: { maxLength: 100 },
  },
  {
    key: "buttonText",
    type: "text" as const,
    label: "Button Text",
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
// 1. GOLDEN REVEAL (Luxury Fashion)
// =============================================================================

const goldenReveal: StyledRecipe = {
  id: "scratch-card-golden-reveal",
  name: "Golden Reveal",
  tagline: "Reveal Your Exclusive Reward",
  description: "Luxurious gold scratch card for high-end fashion and jewelry brands.",
  icon: "✨",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["luxury", "elegant", "gold", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "golden-reveal",
  layout: "centered",
  imageUrl: "/recipes/scratch-card/golden-reveal-bg.jpg",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Reveal Your Exclusive Reward",
      subheadline: "A special gift awaits our valued guests",
      scratchInstruction: "Gently scratch to unveil your reward",
      buttonText: "Claim Now",
      emailPlaceholder: "Your email address",
      emailBeforeScratching: false,
      scratchThreshold: 40,
      scratchRadius: 30,
      prizes: [
        { id: "prize-1", label: "15% OFF", probability: 0.45 },
        { id: "prize-2", label: "20% OFF", probability: 0.3 },
        { id: "prize-3", label: "Free Luxury Gift", probability: 0.15 },
        { id: "prize-4", label: "25% OFF", probability: 0.1 },
      ],
      nameFieldEnabled: true,
      nameFieldRequired: false,
      nameFieldPlaceholder: "Your name",
      consentFieldEnabled: true,
      consentFieldRequired: true,
      consentFieldText: "I agree to receive exclusive offers",
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      backgroundColor: "#1A1814",
      textColor: "#F5F0E8",
      descriptionColor: "#C9B99A",
      buttonColor: "#D4AF37",
      buttonTextColor: "#1A1814",
      scratchCardBackgroundColor: "#F5F0E8",
      scratchOverlayColor: "#D4AF37",
      scratchOverlayImage: "/recipes/scratch-card/golden-reveal-overlay.jpg",
      inputBackgroundColor: "rgba(255,255,255,0.1)",
      inputBorderColor: "#D4AF37",
      accentColor: "#D4AF37",
      fontFamily: "'Playfair Display', Georgia, serif",
      // Full background mode - image fills popup, content overlays
      imageUrl: "/recipes/scratch-card/golden-reveal-bg.jpg",
      imagePosition: "full",
      leadCaptureLayout: { desktop: "overlay", mobile: "stacked" },
      backgroundOverlayOpacity: 0.6,
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
      value: 15,
    },
  },
};

// =============================================================================
// 2. NEON ARCADE (Gaming/Tech)
// =============================================================================

const neonArcade: StyledRecipe = {
  id: "scratch-card-neon-arcade",
  name: "Neon Arcade",
  tagline: "SCRATCH TO WIN",
  description: "Cyberpunk-inspired scratch card for gaming and tech brands.",
  icon: "🎮",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["gaming", "tech", "dark", "neon", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "neon-arcade",
  layout: "centered",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "SCRATCH TO WIN",
      subheadline: "Unlock your player reward",
      scratchInstruction: "Scratch the card, claim your loot!",
      buttonText: "CLAIM LOOT",
      emailPlaceholder: "Enter your email",
      emailBeforeScratching: true,
      scratchThreshold: 60,
      scratchRadius: 20,
      prizes: [
        { id: "prize-1", label: "10% OFF", probability: 0.4 },
        { id: "prize-2", label: "15% OFF", probability: 0.3 },
        { id: "prize-3", label: "Free Accessory", probability: 0.2 },
        { id: "prize-4", label: "25% OFF", probability: 0.1 },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "slide",
      backgroundColor: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      textColor: "#FFFFFF",
      descriptionColor: "#A78BFA",
      buttonColor: "#EC4899",
      buttonTextColor: "#FFFFFF",
      scratchCardBackgroundColor: "#1A1625",
      scratchOverlayColor: "#00FFFF",
      scratchOverlayImage: "/recipes/scratch-card/neon-arcade-overlay.jpg",
      inputBackgroundColor: "rgba(167, 139, 250, 0.2)",
      inputBorderColor: "#A78BFA",
      accentColor: "#EC4899",
      fontFamily: "'Space Grotesk', 'Courier New', monospace",
      imagePosition: "none",
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
// 3. PAPER LUCK (Casual/Food)
// =============================================================================

const paperLuck: StyledRecipe = {
  id: "scratch-card-paper-luck",
  name: "Paper Luck",
  tagline: "Try Your Luck!",
  description: "Playful lottery-style scratch card for food and casual brands.",
  icon: "🍀",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["food", "playful", "casual", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "paper-luck",
  layout: "centered",
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Try Your Luck! 🍀",
      subheadline: "Every scratch is a winner!",
      scratchInstruction: "Scratch here to reveal your treat",
      buttonText: "Yum! Claim It",
      emailPlaceholder: "Your email",
      emailBeforeScratching: false,
      scratchThreshold: 50,
      scratchRadius: 25,
      prizes: [
        { id: "prize-1", label: "Free Cookie", probability: 0.4 },
        { id: "prize-2", label: "10% OFF", probability: 0.3 },
        { id: "prize-3", label: "Free Drink", probability: 0.2 },
        { id: "prize-4", label: "15% OFF", probability: 0.1 },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "bounce",
      backgroundColor: "#FEF9C3",
      textColor: "#1F2937",
      descriptionColor: "#4B5563",
      buttonColor: "#EF4444",
      buttonTextColor: "#FFFFFF",
      scratchCardBackgroundColor: "#FFFFFF",
      scratchOverlayColor: "#9CA3AF",
      scratchOverlayImage: "/recipes/scratch-card/paper-luck-overlay.jpg",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#E5E7EB",
      accentColor: "#EF4444",
      fontFamily: "'Comic Neue', 'Comic Sans MS', cursive",
      imagePosition: "none",
      borderRadius: 12,
      buttonBorderRadius: 999,
      inputBorderRadius: 8,
      textAlign: "center",
      contentSpacing: "comfortable",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5000 },
      },
    },
  },
};

// =============================================================================
// 4. ROSE GOLD DREAM (Beauty)
// =============================================================================

const roseGoldDream: StyledRecipe = {
  id: "scratch-card-rose-gold-dream",
  name: "Rose Gold Dream",
  tagline: "Reveal Your Beauty Gift",
  description: "Feminine and elegant scratch card for beauty and cosmetics brands.",
  icon: "💖",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["beauty", "feminine", "elegant", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "rose-gold-dream",
  layout: "centered",
  imageUrl: "/recipes/scratch-card/rose-gold-bg.jpg",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Reveal Your Beauty Gift",
      subheadline: "Something special just for you ✨",
      scratchInstruction: "Scratch gently to reveal your reward",
      buttonText: "Claim My Gift",
      emailPlaceholder: "Your email",
      emailBeforeScratching: false,
      scratchThreshold: 45,
      scratchRadius: 28,
      prizes: [
        { id: "prize-1", label: "10% OFF", probability: 0.4 },
        { id: "prize-2", label: "Free Sample Set", probability: 0.3 },
        { id: "prize-3", label: "15% OFF", probability: 0.2 },
        { id: "prize-4", label: "Free Full-Size Product", probability: 0.1 },
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
      scratchCardBackgroundColor: "#FFFFFF",
      scratchOverlayColor: "#F9A8D4",
      scratchOverlayImage: "/recipes/scratch-card/rose-gold-overlay.jpg",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#FBCFE8",
      accentColor: "#F472B6",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      // Full background mode
      imageUrl: "/recipes/scratch-card/rose-gold-bg.jpg",
      imagePosition: "full",
      leadCaptureLayout: { desktop: "overlay", mobile: "stacked" },
      backgroundOverlayOpacity: 0.4,
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
// 5. MINIMAL SILVER (Tech/Modern)
// =============================================================================

const minimalSilver: StyledRecipe = {
  id: "scratch-card-minimal-silver",
  name: "Minimal Silver",
  tagline: "Scratch to Unlock",
  description: "Clean and modern scratch card for SaaS and tech brands.",
  icon: "⚡",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["tech", "minimal", "modern", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "minimal-silver",
  layout: "centered",
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Scratch to Unlock",
      subheadline: "Your exclusive discount awaits",
      scratchInstruction: "Scratch the card to reveal",
      buttonText: "Apply Discount",
      emailPlaceholder: "you@company.com",
      emailBeforeScratching: true,
      scratchThreshold: 50,
      scratchRadius: 22,
      prizes: [
        { id: "prize-1", label: "5% OFF", probability: 0.35 },
        { id: "prize-2", label: "10% OFF", probability: 0.35 },
        { id: "prize-3", label: "15% OFF", probability: 0.2 },
        { id: "prize-4", label: "20% OFF", probability: 0.1 },
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
      scratchCardBackgroundColor: "#F9FAFB",
      scratchOverlayColor: "#9CA3AF",
      scratchOverlayImage: "/recipes/scratch-card/minimal-silver-overlay.jpg",
      inputBackgroundColor: "#F9FAFB",
      inputBorderColor: "#E5E7EB",
      accentColor: "#3B82F6",
      fontFamily: "'Inter', system-ui, sans-serif",
      imagePosition: "none",
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
// 6. HOLIDAY MAGIC (Seasonal)
// =============================================================================

const holidayMagic: StyledRecipe = {
  id: "scratch-card-holiday-magic",
  name: "Holiday Magic",
  tagline: "Unwrap Your Holiday Surprise!",
  description: "Festive scratch card for seasonal campaigns and holiday promotions.",
  icon: "🎄",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["seasonal", "holiday", "festive", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "holiday-magic",
  layout: "centered",
  imageUrl: "/recipes/scratch-card/holiday-magic-bg.jpg",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Unwrap Your Holiday Surprise! 🎄",
      subheadline: "Santa brought something special",
      scratchInstruction: "Scratch to reveal your gift",
      buttonText: "Open My Gift",
      emailPlaceholder: "Your email",
      emailBeforeScratching: false,
      scratchThreshold: 40,
      scratchRadius: 30,
      prizes: [
        { id: "prize-1", label: "10% OFF", probability: 0.35 },
        { id: "prize-2", label: "15% OFF", probability: 0.3 },
        { id: "prize-3", label: "Free Gift Wrap", probability: 0.2 },
        { id: "prize-4", label: "25% OFF", probability: 0.1 },
        { id: "prize-5", label: "Free Shipping", probability: 0.05 },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "bounce",
      backgroundColor: "#7F1D1D",
      textColor: "#FFFFFF",
      descriptionColor: "#FDE68A",
      buttonColor: "#FCD34D",
      buttonTextColor: "#7F1D1D",
      scratchCardBackgroundColor: "#FEF3C7",
      scratchOverlayColor: "#60A5FA",
      scratchOverlayImage: "/recipes/scratch-card/holiday-magic-overlay.jpg",
      inputBackgroundColor: "rgba(255,255,255,0.9)",
      inputBorderColor: "#FDE68A",
      accentColor: "#FCD34D",
      fontFamily: "'Playfair Display', Georgia, serif",
      // Full background mode
      imageUrl: "/recipes/scratch-card/holiday-magic-bg.jpg",
      imagePosition: "full",
      leadCaptureLayout: { desktop: "overlay", mobile: "stacked" },
      backgroundOverlayOpacity: 0.4,
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
// 7. WOOD ARTISAN (Organic/Craft)
// =============================================================================

const woodArtisan: StyledRecipe = {
  id: "scratch-card-wood-artisan",
  name: "Wood Artisan",
  tagline: "Scratch Your Handcrafted Reward",
  description: "Natural and organic scratch card for handmade and artisan brands.",
  icon: "🌿",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["organic", "natural", "artisan", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "wood-artisan",
  layout: "centered",
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Scratch Your Handcrafted Reward",
      subheadline: "Made with love, just for you",
      scratchInstruction: "Scratch to reveal your artisan gift",
      buttonText: "Claim My Reward",
      emailPlaceholder: "Your email",
      emailBeforeScratching: false,
      scratchThreshold: 55,
      scratchRadius: 24,
      prizes: [
        { id: "prize-1", label: "10% OFF", probability: 0.4 },
        { id: "prize-2", label: "Free Shipping", probability: 0.3 },
        { id: "prize-3", label: "15% OFF", probability: 0.2 },
        { id: "prize-4", label: "Free Gift", probability: 0.1 },
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
      scratchCardBackgroundColor: "#FEF3C7",
      scratchOverlayColor: "#D97706",
      scratchOverlayImage: "/recipes/scratch-card/wood-artisan-overlay.jpg",
      inputBackgroundColor: "#FFFFFF",
      inputBorderColor: "#FDE68A",
      accentColor: "#92400E",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      imagePosition: "none",
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
// 8. HOLOGRAPHIC HYPE (Youth/Trend)
// =============================================================================

const holographicHype: StyledRecipe = {
  id: "scratch-card-holographic-hype",
  name: "Holographic Hype",
  tagline: "SCRATCH FOR THE TEA ☕",
  description: "Trendy Gen-Z scratch card for youth fashion and pop culture brands.",
  icon: "🔥",
  category: "email_leads",
  goal: "ENGAGEMENT",
  templateType: "SCRATCH_CARD",
  tags: ["trendy", "youth", "bold", "centered"] as RecipeTag[],
  component: "ScratchCardPopup",
  theme: "holographic-hype",
  layout: "centered",
  imageUrl: "/recipes/scratch-card/holographic-hype-bg.jpg",
  featured: true,
  inputs: [TRIGGER_INPUT],
  editableFields: SCRATCH_CARD_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "SCRATCH FOR THE TEA ☕",
      subheadline: "no cap, you're getting a deal",
      scratchInstruction: "slide to reveal your vibe",
      buttonText: "SLAY, CLAIM IT",
      emailPlaceholder: "drop your email",
      emailBeforeScratching: true,
      scratchThreshold: 45,
      scratchRadius: 26,
      prizes: [
        { id: "prize-1", label: "10% OFF", probability: 0.35 },
        { id: "prize-2", label: "15% OFF", probability: 0.3 },
        { id: "prize-3", label: "Mystery Gift", probability: 0.25 },
        { id: "prize-4", label: "20% OFF", probability: 0.1 },
      ],
      nameFieldEnabled: false,
      consentFieldEnabled: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "slide",
      backgroundColor: "linear-gradient(135deg, #C084FC 0%, #EC4899 50%, #F472B6 100%)",
      textColor: "#FFFFFF",
      descriptionColor: "#FDE68A",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#9333EA",
      scratchCardBackgroundColor: "#1F2937",
      scratchOverlayColor: "#E879F9",
      scratchOverlayImage: "/recipes/scratch-card/holographic-hype-overlay.jpg",
      inputBackgroundColor: "rgba(255,255,255,0.2)",
      inputBorderColor: "#FFFFFF",
      accentColor: "#FDE68A",
      fontFamily: "'Space Grotesk', 'Poppins', sans-serif",
      // Full background mode
      imageUrl: "/recipes/scratch-card/holographic-hype-bg.jpg",
      imagePosition: "full",
      leadCaptureLayout: { desktop: "overlay", mobile: "stacked" },
      backgroundOverlayOpacity: 0.3,
      borderRadius: 24,
      buttonBorderRadius: 999,
      inputBorderRadius: 16,
      textAlign: "center",
      contentSpacing: "compact",
      buttonBoxShadow: "0 4px 20px rgba(236, 72, 153, 0.4)",
    },
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 3000 },
        scroll_depth: { enabled: true, depth_percentage: 20 },
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

export const SCRATCH_CARD_DESIGN_RECIPES: StyledRecipe[] = [
  goldenReveal,
  neonArcade,
  paperLuck,
  roseGoldDream,
  minimalSilver,
  holidayMagic,
  woodArtisan,
  holographicHype,
];

export default SCRATCH_CARD_DESIGN_RECIPES;
