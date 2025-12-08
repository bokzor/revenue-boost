/**
 * Marketing Demo Configurations
 *
 * Pre-configured, visually appealing demo configs for all 11 template types.
 * These are designed to showcase the templates in the best light for marketing purposes.
 *
 * All configs include `previewMode: true` to enable full E2E flow simulation
 * without making actual API calls.
 */

import type { TemplateType } from "~/domains/campaigns/types/campaign";

// =============================================================================
// SHARED DESIGN DEFAULTS
// =============================================================================

const BRAND_COLORS = {
  primary: "#6366F1", // Indigo
  primaryText: "#FFFFFF",
  secondary: "#10B981", // Emerald
  background: "#FFFFFF",
  text: "#1F2937",
  muted: "#6B7280",
  accent: "#F59E0B", // Amber
};

const BASE_DESIGN = {
  backgroundColor: BRAND_COLORS.background,
  textColor: BRAND_COLORS.text,
  buttonColor: BRAND_COLORS.primary,
  buttonTextColor: BRAND_COLORS.primaryText,
  borderRadius: 16,
  animation: "fade" as const,
  previewMode: true,
  showCloseButton: true,
  showBranding: false, // Hide "Powered by" for marketing
};

// =============================================================================
// TEMPLATE DEMO CONFIGS
// =============================================================================

export const DEMO_CONFIGS: Record<
  TemplateType,
  { content: Record<string, unknown>; design: Record<string, unknown> }
> = {
  NEWSLETTER: {
    content: {
      headline: "Get 15% Off Your First Order",
      subheadline: "Join 50,000+ subscribers for exclusive deals and new arrivals",
      emailPlaceholder: "Enter your email",
      submitButtonText: "Unlock My Discount",
      successMessage: "Welcome! Check your inbox for your discount code.",
      nameFieldEnabled: false,
      consentFieldEnabled: true,
      consentFieldText: "I agree to receive marketing emails",
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "medium",
      imagePosition: "left",
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop",
      discount: {
        enabled: true,
        percentage: 15,
        code: "WELCOME15",
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      },
    },
  },

  SPIN_TO_WIN: {
    content: {
      headline: "Spin & Win!",
      subheadline: "Try your luck for exclusive discounts",
      emailPlaceholder: "Enter your email to spin",
      spinButtonText: "Spin the Wheel",
      wheelSegments: [
        {
          id: "1",
          label: "10% OFF",
          color: "#6366F1",
          probability: 0.25,
          discountConfig: { enabled: true, value: 10, valueType: "PERCENTAGE" },
        },
        {
          id: "2",
          label: "15% OFF",
          color: "#10B981",
          probability: 0.2,
          discountConfig: { enabled: true, value: 15, valueType: "PERCENTAGE" },
        },
        {
          id: "3",
          label: "FREE SHIP",
          color: "#F59E0B",
          probability: 0.2,
          discountConfig: { enabled: true, valueType: "FREE_SHIPPING" },
        },
        {
          id: "4",
          label: "20% OFF",
          color: "#EC4899",
          probability: 0.15,
          discountConfig: { enabled: true, value: 20, valueType: "PERCENTAGE" },
        },
        {
          id: "5",
          label: "Try Again",
          color: "#9CA3AF",
          probability: 0.1,
          discountConfig: { enabled: false },
        },
        {
          id: "6",
          label: "25% OFF",
          color: "#8B5CF6",
          probability: 0.1,
          discountConfig: { enabled: true, value: 25, valueType: "PERCENTAGE" },
        },
      ],
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "large",
      accentColor: BRAND_COLORS.accent,
    },
  },

  SCRATCH_CARD: {
    content: {
      headline: "Scratch to Reveal Your Prize!",
      subheadline: "Everyone's a winner today",
      emailPlaceholder: "Enter your email",
      scratchInstruction: "Use your finger or mouse to scratch",
      buttonText: "Claim My Prize",
      prizes: [
        { id: "1", label: "10% OFF", probability: 0.4, discountCode: "SCRATCH10" },
        { id: "2", label: "15% OFF", probability: 0.35, discountCode: "SCRATCH15" },
        { id: "3", label: "20% OFF", probability: 0.25, discountCode: "SCRATCH20" },
      ],
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "medium",
      backgroundColor: "#FEF3C7",
      accentColor: BRAND_COLORS.accent,
    },
  },

  FLASH_SALE: {
    content: {
      headline: "⚡ Flash Sale - 50% OFF",
      subheadline: "Limited time only! Don't miss out.",
      urgencyMessage: "Hurry! Sale ends soon",
      buttonText: "Shop Now",
      showCountdown: true,
      countdownDuration: 3600, // 1 hour
      discountPercentage: 50,
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "medium",
      backgroundColor: "#FEF2F2",
      buttonColor: "#DC2626",
      textColor: "#7F1D1D",
      displayMode: "popup",
    },
  },

  COUNTDOWN_TIMER: {
    content: {
      headline: "Sale Ends In...",
      subheadline: "Get 30% off everything before time runs out!",
      ctaText: "Shop the Sale",
      ctaUrl: "/collections/sale",
      countdownDuration: 7200, // 2 hours
      colorScheme: "urgent",
    },
    design: {
      ...BASE_DESIGN,
      position: "top",
      displayMode: "banner",
      backgroundColor: "#7C3AED",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#7C3AED",
    },
  },

  FREE_SHIPPING: {
    content: {
      threshold: 75,
      currency: "$",
      emptyMessage: "Add items to unlock FREE shipping!",
      progressMessage: "You're ${remaining} away from FREE shipping",
      nearMissMessage: "Almost there! Just ${remaining} to go!",
      unlockedMessage: "🎉 You've unlocked FREE shipping!",
      previewCartTotal: 45, // Show progress state
    },
    design: {
      ...BASE_DESIGN,
      position: "top",
      displayMode: "banner",
      backgroundColor: BRAND_COLORS.secondary,
      textColor: "#FFFFFF",
    },
  },

  CART_ABANDONMENT: {
    content: {
      headline: "Wait! Don't Leave Empty-Handed",
      subheadline: "Complete your purchase and save 10%",
      buttonText: "Complete Purchase",
      showCartItems: true,
      showUrgency: true,
      urgencyTimer: 600, // 10 minutes
      urgencyMessage: "Items reserved for limited time",
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "medium",
    },
  },

  PRODUCT_UPSELL: {
    content: {
      headline: "Complete Your Look",
      subheadline: "Customers who bought this also loved",
      buttonText: "Add to Cart",
      layout: "grid",
      columns: 2,
      maxProducts: 4,
      showPrices: true,
      showCompareAtPrice: true,
      showRatings: true,
      bundleDiscount: 15,
      bundleDiscountText: "Save 15% when you add 2+ items",
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "large",
    },
  },

  SOCIAL_PROOF: {
    content: {
      enablePurchaseNotifications: true,
      enableVisitorNotifications: true,
      enableReviewNotifications: false,
      cornerPosition: "bottom-left",
      displayDuration: 5,
      rotationInterval: 8,
    },
    design: {
      ...BASE_DESIGN,
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      borderRadius: 12,
    },
  },

  ANNOUNCEMENT: {
    content: {
      headline: "🚀 New Collection Now Live!",
      subheadline: "Shop the Spring 2024 collection",
      buttonText: "Explore Now",
      ctaUrl: "/collections/new",
      sticky: true,
      colorScheme: "custom",
    },
    design: {
      ...BASE_DESIGN,
      position: "top",
      displayMode: "banner",
      backgroundColor: "#1F2937",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#1F2937",
    },
  },

  EXIT_INTENT: {
    content: {
      headline: "Wait! Before You Go...",
      subheadline: "Here's 10% off your first order",
      emailPlaceholder: "Enter your email",
      submitButtonText: "Get My Discount",
      successMessage: "Check your inbox for your discount!",
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "medium",
      backgroundColor: "#FEF3C7",
      textColor: "#92400E",
      buttonColor: "#D97706",
      discount: {
        enabled: true,
        percentage: 10,
        code: "STAY10",
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      },
    },
  },

  // =============================================================================
  // NEW UPSELL POPUP TEMPLATES
  // =============================================================================

  CLASSIC_UPSELL: {
    content: {
      headline: "Special Offer Just For You",
      subheadline: "Don't miss out on this exclusive deal",
      buttonText: "Add to Cart",
      secondaryCtaLabel: "No thanks",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      bundleDiscount: 15,
      currency: "USD",
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "medium",
    },
  },

  MINIMAL_SLIDE_UP: {
    content: {
      headline: "Complete Your Order",
      subheadline: "Add this for just",
      buttonText: "Quick Add",
      secondaryCtaLabel: "Continue shopping",
      productSelectionMethod: "ai",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      currency: "USD",
    },
    design: {
      ...BASE_DESIGN,
      position: "bottom",
      size: "small",
      animation: "slide",
    },
  },

  PREMIUM_FULLSCREEN: {
    content: {
      headline: "Exclusive Offer",
      subheadline: "Upgrade your experience with our premium selection",
      buttonText: "Claim This Deal",
      secondaryCtaLabel: "Maybe later",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      showReviewCount: true,
      bundleDiscount: 20,
      currency: "USD",
      features: [
        "Premium quality materials",
        "Free express shipping",
        "30-day money-back guarantee",
      ],
      urgencyMessage: "🔥 Limited time offer - Only 3 left in stock!",
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "fullscreen",
    },
  },

  COUNTDOWN_URGENCY: {
    content: {
      headline: "Flash Deal!",
      subheadline: "This exclusive offer expires soon",
      buttonText: "Claim This Deal Now",
      secondaryCtaLabel: "No thanks",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      bundleDiscount: 25,
      currency: "USD",
      expiresInSeconds: 300,
      socialProofMessage: "🔥 47 people are viewing this right now",
    },
    design: {
      ...BASE_DESIGN,
      position: "center",
      size: "medium",
      buttonColor: "#DC2626", // Red for urgency
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get demo config for a specific template type
 */
export function getDemoConfig(templateType: TemplateType) {
  return DEMO_CONFIGS[templateType] || DEMO_CONFIGS.NEWSLETTER;
}

/**
 * Get all template types with their demo configs
 */
export function getAllDemoConfigs() {
  return Object.entries(DEMO_CONFIGS).map(([type, config]) => ({
    templateType: type as TemplateType,
    ...config,
  }));
}

/**
 * Template metadata for marketing display
 */
export const TEMPLATE_MARKETING_INFO: Record<
  TemplateType,
  { title: string; description: string; category: string }
> = {
  NEWSLETTER: {
    title: "Newsletter Signup",
    description: "Grow your email list with beautiful opt-in popups",
    category: "Lead Generation",
  },
  SPIN_TO_WIN: {
    title: "Spin to Win",
    description: "Gamify discounts with an interactive wheel",
    category: "Gamification",
  },
  SCRATCH_CARD: {
    title: "Scratch Card",
    description: "Reveal prizes with an interactive scratch experience",
    category: "Gamification",
  },
  FLASH_SALE: {
    title: "Flash Sale",
    description: "Create urgency with limited-time offers",
    category: "Sales & Urgency",
  },
  COUNTDOWN_TIMER: {
    title: "Countdown Timer",
    description: "Drive action with time-sensitive promotions",
    category: "Sales & Urgency",
  },
  FREE_SHIPPING: {
    title: "Free Shipping Bar",
    description: "Increase AOV with shipping threshold incentives",
    category: "Conversion",
  },
  CART_ABANDONMENT: {
    title: "Cart Recovery",
    description: "Recover abandoned carts with targeted popups",
    category: "Conversion",
  },
  PRODUCT_UPSELL: {
    title: "Product Upsell",
    description: "Boost order value with smart recommendations",
    category: "Conversion",
  },
  SOCIAL_PROOF: {
    title: "Social Proof",
    description: "Build trust with real-time purchase notifications",
    category: "Trust & Social",
  },
  ANNOUNCEMENT: {
    title: "Announcement Bar",
    description: "Share news, promotions, and updates",
    category: "Communication",
  },
  EXIT_INTENT: {
    title: "Exit Intent",
    description: "Capture leaving visitors with last-chance offers",
    category: "Lead Generation",
  },
  // New upsell popup templates
  CLASSIC_UPSELL: {
    title: "Classic Upsell",
    description: "Traditional centered modal for single product offers",
    category: "Conversion",
  },
  MINIMAL_SLIDE_UP: {
    title: "Minimal Slide-Up",
    description: "Non-intrusive bottom sheet for mobile shoppers",
    category: "Conversion",
  },
  PREMIUM_FULLSCREEN: {
    title: "Premium Fullscreen",
    description: "Immersive full-page offer for luxury products",
    category: "Conversion",
  },
  COUNTDOWN_URGENCY: {
    title: "Flash Deal Countdown",
    description: "Time-limited offers with live countdown timer",
    category: "Sales & Urgency",
  },
};
