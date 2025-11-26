/**
 * Global System Templates Data
 *
 * These templates are available to all stores and are seeded once globally.
 * Based on high-converting popup patterns.
 *
 * Uses Prisma.TemplateCreateInput for type safety and consistency with database schema.
 */

import type { Prisma } from "@prisma/client";
import { getServerFrequencyCapping } from "../app/domains/campaigns/utils/frequency-defaults.js";

/**
 * Template seed data type
 * Omits auto-generated fields (id, createdAt, updatedAt) and relations
 */
export type TemplateSeedData = Omit<
  Prisma.TemplateCreateInput,
  "id" | "createdAt" | "updatedAt" | "store" | "campaigns"
>;

export const GLOBAL_SYSTEM_TEMPLATES: TemplateSeedData[] = [
  // Newsletter Signup Template
  {
    name: "Newsletter Signup",
    description: "Simple email collection popup for building your subscriber list",
    category: "engagement",
    templateType: "NEWSLETTER",
    goals: ["NEWSLETTER_SIGNUP"],
    contentConfig: {
      headline: "Join Our Newsletter",
      subheadline: "Get exclusive offers and updates delivered to your inbox",
      buttonText: "Subscribe Now",
      successMessage: "Thank you for subscribing!",
      emailPlaceholder: "Enter your email",
      emailRequired: true,
      nameFieldEnabled: false,
      nameFieldRequired: false,
      consentFieldEnabled: false,
      consentFieldRequired: false,
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "buttonText", type: "text", label: "Button Text", category: "content" },
      { id: "successMessage", type: "text", label: "Success Message", category: "content" },
      { id: "emailPlaceholder", type: "text", label: "Email Placeholder", category: "content" },
      { id: "emailRequired", type: "boolean", label: "Require Email", category: "behavior" },
      { id: "nameFieldEnabled", type: "boolean", label: "Enable Name Field", category: "behavior" },
      { id: "nameFieldRequired", type: "boolean", label: "Require Name", category: "behavior" },
      { id: "consentFieldEnabled", type: "boolean", label: "Enable Consent Checkbox", category: "behavior" },
      { id: "consentFieldRequired", type: "boolean", label: "Require Consent", category: "behavior" },
    ],
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "medium" },
        frequency_capping: getServerFrequencyCapping("NEWSLETTER"),
      },
    },
    designConfig: {
      // Use the "ocean" newsletter theme as the default seeded look (matching the campaign)
      theme: "ocean",
      position: "center",
      size: "medium",
      popupSize: "standard",
      borderRadius: 8,
      animation: "fade",

      // Background image preset & URL
      backgroundImageMode: "preset",
      backgroundImagePresetKey: "ocean",
      imageUrl: "/apps/revenue-boost/assets/newsletter-backgrounds/ocean.jpg",
      imagePosition: "left",

      // Ocean theme colors (aligned with the campaign's ocean theme)
      backgroundColor: "#f0f9ff",
      textColor: "#0c4a6e",
      descriptionColor: "#0369a1",
      accentColor: "#0ea5e9",

      buttonColor: "#0ea5e9",
      buttonTextColor: "#ffffff",

      inputBackgroundColor: "#e0f2fe",
      inputTextColor: "#111827",
      inputBorderColor: "#7dd3fc",

      imageBgColor: "#e0f2fe",
      successColor: "#14b8a6",
      overlayOpacity: 0.8,

      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    discountConfig: {
      enabled: false,
      showInPreview: true,
      valueType: "PERCENTAGE",
      value: 10,
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
      expiryDays: 30,
    },
    isDefault: true,
    priority: 1,
    icon: "📧",
    conversionRate: 12.5,
  },
  // Flash Sale Template
  {
    name: "Flash Sale Alert",
    description: "Urgency-driven sales popup with countdown timer",
    category: "sales",
    templateType: "FLASH_SALE",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      // Core messaging
      headline: "🔥 2-Hour Flash Sale - 30% OFF!",
      subheadline: "Biggest discount of the year - don't miss out!",
      buttonText: "Shop Now & Save",
      successMessage: "Discount applied! Complete your order before the timer runs out.",
      ctaText: "Shop Now & Save",

      // Flash sale specifics
      urgencyMessage: "Sale ends in:",
      discountPercentage: 30,

      // Advanced features defaults (⚙️ Advanced Features)
      showCountdown: true,
      countdownDuration: 7200, // 2 hours in seconds
      hideOnExpiry: true,
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "urgencyMessage", type: "text", label: "Urgency Message", category: "content" },
      { id: "showCountdown", type: "boolean", label: "Enable Countdown Timer", category: "behavior" },
      { id: "discountPercentage", type: "number", label: "Discount Percentage", category: "behavior" },
    ],
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 2000 },
        frequency_capping: getServerFrequencyCapping("FLASH_SALE"),
      },
    },
    // Modern theme with red urgency colors
    designConfig: {
      theme: "modern",
      position: "center",
      size: "medium",
      popupSize: "wide",
      borderRadius: 8,
      animation: "fade",

      // Main colors - urgency red theme
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      descriptionColor: "#6b7280",
      accentColor: "#ef4444",

      // Button colors - red for urgency
      buttonColor: "#ef4444",
      buttonTextColor: "#ffffff",

      // Input field colors - light red tints
      inputBackgroundColor: "#fee2e2",
      inputTextColor: "#111827",
      inputBorderColor: "#fca5a5",

      // Image / surface colors
      imageBgColor: "#fef2f2",
      imagePosition: "left",
      backgroundImageMode: "none",

      // State colors
      successColor: "#10b981",

      // Overlay
      overlayOpacity: 0.5,

      // Typography
      fontFamily: "inherit",
      titleFontSize: "2rem",
      titleFontWeight: "800",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "500",
    },
    // Valid DiscountConfig defaults (💰 Discount Configuration)
    discountConfig: {
      enabled: true,
      showInPreview: true,
      // Note: Removed type: "shared" to enforce unique code generation for accurate attribution
      valueType: "PERCENTAGE",
      value: 30,
      prefix: "FLASH30-", // Will generate unique codes like FLASH30-ABC123
      expiryDays: 2,
      behavior: "SHOW_CODE_ONLY",
    },
    isDefault: true,
    priority: 2,
    icon: "🔥",
    conversionRate: 8.5,
  },
  // Spin to Win Template
  {
    name: "Spin to Win",
    description: "Gamified popup with spinning wheel for prizes and discounts",
    category: "engagement",
    templateType: "SPIN_TO_WIN",
    goals: ["NEWSLETTER_SIGNUP", "INCREASE_REVENUE"],
    contentConfig: {
      headline: "Spin to Win!",
      subheadline: "Try your luck for exclusive discounts",
      buttonText: "Spin Now",
      successMessage: "Thanks!",
      failureMessage: "Thanks for playing!",
      ctaText: "Spin Now",
      emailRequired: true,
      emailPlaceholder: "Enter your email to spin",
      collectName: true,
      showGdprCheckbox: true,
      gdprLabel: "I agree to receive marketing emails and accept the privacy policy",
      spinButtonText: "Spin to Win!",
      wheelBorderColor: "#ffffff",
      wheelBorderWidth: 7,
      wheelSegments: [
        {
          id: "segment-5-off",
          label: "5% OFF",
          probability: 0.35,
          color: "#a855f7",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 5,
            behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
            expiryDays: 30,
            type: "single_use" as const,
          },
        },
        {
          id: "segment-10-off",
          label: "10% OFF",
          probability: 0.25,
          color: "#9333ea",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 10,
            behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
            expiryDays: 30,
            type: "single_use" as const,
          },
        },
        {
          id: "segment-15-off",
          label: "15% OFF",
          probability: 0.15,
          color: "#7e22ce",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 15,
            behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
            expiryDays: 30,
            type: "single_use" as const,
          },
        },
        {
          id: "segment-20-off",
          label: "20% OFF",
          probability: 0.1,
          color: "#6b21a8",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 20,
            behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
            expiryDays: 30,
            type: "single_use" as const,
          },
        },
        {
          id: "segment-free-shipping",
          label: "FREE SHIPPING",
          probability: 0.1,
          color: "#581c87",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "FREE_SHIPPING" as const,
            behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
            expiryDays: 30,
            type: "single_use" as const,
          },
        },
        {
          id: "segment-try-again",
          label: "Try Again",
          probability: 0.05,
          color: "#c084fc",
          // No discount config for "try again" segment
        },
      ],
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "emailRequired", type: "boolean", label: "Require Email", category: "behavior" },
      { id: "prizes", type: "prize-list", label: "Prize Configuration", category: "behavior" },
    ],
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "medium" },
        frequency_capping: getServerFrequencyCapping("SPIN_TO_WIN"),
      },
    },
    designConfig: {
      // Purple gradient theme
      theme: "gradient",
      position: "center",
      size: "medium",
      popupSize: "wide",
      borderRadius: 24,
      animation: "fade",

      // Main colors - purple gradient
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff",
      descriptionColor: "#e0e7ff",
      accentColor: "#e0e7ff",

      // Button colors
      buttonColor: "#ffffff",
      buttonTextColor: "#667eea",

      // Input field colors - glassmorphism style
      inputBackgroundColor: "rgba(255, 255, 255, 0.15)",
      inputTextColor: "#ffffff",
      inputBorderColor: "rgba(255, 255, 255, 0.3)",
      inputBackdropFilter: "blur(10px)",

      // Image / surface colors
      imageBgColor: "rgba(255, 255, 255, 0.1)",
      imagePosition: "left",
      backgroundImageMode: "preset",
      backgroundImagePresetKey: "gradient",
      imageUrl: "/apps/revenue-boost/assets/newsletter-backgrounds/gradient.jpg",

      // State colors
      successColor: "#10b981",

      // Overlay
      overlayOpacity: 0.5,

      // Typography
      fontFamily: "inherit",
      titleFontSize: "2rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    isDefault: true,
    priority: 3,
    icon: "🎡",
    conversionRate: 15.2,
  },
  // Countdown Timer Banner
  {
    name: "Countdown Timer Banner",
    description: "Banner with countdown to drive urgency and conversions",
    category: "sales",
    templateType: "COUNTDOWN_TIMER",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      headline: "Hurry! Sale ends soon",
      subheadline: "Don't miss out on limited-time deals",
      buttonText: "Shop Now",
      successMessage: "Offer ends soon—don't miss out!",
      ctaText: "Shop Now",
      urgencyMessage: "Offer ends today",
      timerEnabled: true
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "urgencyMessage", type: "text", label: "Urgency Message", category: "content" },
      { id: "timerEnabled", type: "boolean", label: "Enable Countdown", category: "behavior" }
    ],
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 1000 },
        frequency_capping: getServerFrequencyCapping("COUNTDOWN_TIMER"),
      }
    },
    designConfig: {
      // Modern default colors
      backgroundColor: "#FFFFFF",
      textColor: "#1A202C",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      position: "top",
      size: "medium"
    },
    isDefault: true,
    priority: 4,
    icon: "⏱️",
    conversionRate: 6.2
  },
  // Scratch & Win
  {
    name: "Scratch & Win",
    description: "Gamified scratch card for engagement and rewards",
    category: "engagement",
    templateType: "SCRATCH_CARD",
    goals: ["ENGAGEMENT", "NEWSLETTER_SIGNUP"],
    contentConfig: {
      headline: "Scratch & Win",
      subheadline: "Reveal your surprise",
      buttonText: "Reveal",
      successMessage: "You won!",
      ctaText: "Reveal",
      emailBeforeScratching: true
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        time_delay: { enabled: true, delay: 5 },
        frequency_capping: getServerFrequencyCapping("SCRATCH_CARD"),
      }
    },
    designConfig: {
      // Bold theme default colors (aligned with an existing bold Scratch Card campaign)
      theme: "bold",
      position: "center",
      size: "medium",
      popupSize: "wide",
      animation: "fade",

      // Background image preset & URL
      backgroundImageMode: "preset",
      backgroundImagePresetKey: "bold",
      imageUrl: "/apps/revenue-boost/assets/newsletter-backgrounds/bold.jpg",
      imagePosition: "left",

      // Main colors
      backgroundColor: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
      textColor: "#ffffff",
      descriptionColor: "#fef3c7",
      accentColor: "#fde68a",
      successColor: "#10b981",

      // Button colors
      buttonColor: "#ffffff",
      buttonTextColor: "#ec4899",

      // Input field colors
      inputBackgroundColor: "rgba(255, 255, 255, 0.2)",
      inputTextColor: "#ffffff",
      inputBorderColor: "rgba(255, 255, 255, 0.3)",

      // Image / surface colors
      imageBgColor: "rgba(255, 255, 255, 0.15)",

      // Typography
      fontFamily: "inherit",
      titleFontSize: "2rem",
      titleFontWeight: "900",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "500",

      // Layout & overlay
      borderRadius: 8,
      overlayOpacity: 0.5,
    },
    isDefault: true,
    priority: 8,
    icon: "🎟️",
    conversionRate: 7.9
  },
  // Cart Recovery
  {
    name: "Cart Recovery",
    description: "Recover abandoned carts with a timely reminder",
    category: "sales",
    templateType: "CART_ABANDONMENT",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      headline: "You left something behind",
      subheadline: "Complete your purchase before it's gone",
      buttonText: "Resume Checkout",
      successMessage: "Your cart is ready — complete your purchase.",
      ctaText: "Resume Checkout"
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        idle_timer: { enabled: true, idle_duration: 30 },
        frequency_capping: getServerFrequencyCapping("CART_ABANDONMENT"),
      },
      // Advanced targeting disabled by default so Free plan users can use this template
      // Paid users can enable and configure session rules for cart targeting
      audienceTargeting: {
        enabled: false,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      // Modern default colors
      backgroundColor: "#FFFFFF",
      textColor: "#1A202C",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      position: "bottom",
      size: "medium"
    },
    isDefault: true,
    priority: 9,
    icon: "🛒",
    conversionRate: 5.6
  },
  // Product Spotlight
  {
    name: "Product Spotlight",
    description: "Showcase a product to drive incremental sales",
    category: "sales",
    templateType: "PRODUCT_UPSELL",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      headline: "Don't miss this favorite",
      subheadline: "Top-rated by customers like you",
      buttonText: "Add to Cart",
      successMessage: "Added to cart!",
      ctaText: "Add to Cart",
      productSelectionMethod: "ai",
      layout: "grid",
      columns: 2,
      maxProducts: 3,
      multiSelect: true,
      showImages: true,
      showPrices: true,
      showCompareAtPrice: true,
      showRatings: true,
      showReviewCount: true,
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3000 },
        frequency_capping: getServerFrequencyCapping("PRODUCT_UPSELL"),
      },
      // Advanced targeting disabled by default so Free plan users can use this template
      audienceTargeting: {
        enabled: false,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      // Glass theme - frosted glass effect
      theme: "glass",
      position: "center",
      size: "large",
      popupSize: "wide",
      borderRadius: 8,
      animation: "fade",

      // Main colors - glass effect
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      textColor: "#18181b",
      descriptionColor: "#52525b",
      accentColor: "#6366f1",

      // Button colors - indigo
      buttonColor: "#6366f1",
      buttonTextColor: "#ffffff",

      // Input field colors - glass effect
      inputBackgroundColor: "rgba(255, 255, 255, 0.5)",
      inputTextColor: "#111827",
      inputBorderColor: "rgba(212, 212, 216, 0.5)",
      inputBackdropFilter: "blur(10px)",

      // Image / surface colors
      imageBgColor: "rgba(244, 244, 245, 0.8)",
      imagePosition: "left",
      backgroundImageMode: "preset",
      backgroundImagePresetKey: "glass",
      imageUrl: "/apps/revenue-boost/assets/newsletter-backgrounds/glass.jpg",

      // State colors
      successColor: "#10b981",

      // Overlay
      overlayOpacity: 0.5,

      // Typography
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    isDefault: true,
    priority: 10,
    icon: "💡",
    conversionRate: 4.2
  },
  // Cart Upsell
  {
    name: "Cart Upsell",
    description: "Increase AOV with a relevant cart upsell",
    category: "sales",
    templateType: "PRODUCT_UPSELL",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      headline: "Complete your look",
      subheadline: "Pairs perfectly with items in your cart",
      buttonText: "Add {count} & Save",
      successMessage: "Added to cart!",
      ctaText: "Add {count} & Save",
      productSelectionMethod: "ai",
      layout: "grid",
      columns: 2,
      maxProducts: 4,
      multiSelect: true,
      showImages: true,
      showPrices: true,
      showCompareAtPrice: true,
      bundleDiscount: 15,
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        cart_drawer_open: { enabled: true },
        frequency_capping: getServerFrequencyCapping("PRODUCT_UPSELL"),
      },
      // Advanced targeting disabled by default so Free plan users can use this template
      audienceTargeting: {
        enabled: false,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      // Glass theme - frosted glass effect
      theme: "glass",
      position: "center",
      size: "large",
      popupSize: "wide",
      borderRadius: 8,
      animation: "fade",

      // Main colors - glass effect
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      textColor: "#18181b",
      descriptionColor: "#52525b",
      accentColor: "#6366f1",

      // Button colors - indigo
      buttonColor: "#6366f1",
      buttonTextColor: "#ffffff",

      // Input field colors - glass effect
      inputBackgroundColor: "rgba(255, 255, 255, 0.5)",
      inputTextColor: "#111827",
      inputBorderColor: "rgba(212, 212, 216, 0.5)",
      inputBackdropFilter: "blur(10px)",

      // Image / surface colors
      imageBgColor: "rgba(244, 244, 245, 0.8)",
      imagePosition: "left",
      backgroundImageMode: "preset",
      backgroundImagePresetKey: "glass",
      imageUrl: "/apps/revenue-boost/assets/newsletter-backgrounds/glass.jpg",

      // State colors
      successColor: "#10b981",

      // Overlay
      overlayOpacity: 0.5,

      // Typography
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    isDefault: true,
    priority: 11,
    icon: "🎁",
    conversionRate: 4.9
  },
  // Product Page Cross-Sell
  {
    name: "Product Page Cross-Sell",
    description: "Recommend complementary products on PDP",
    category: "sales",
    templateType: "PRODUCT_UPSELL",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      headline: "Customers also bought",
      subheadline: "Complete the set with these picks",
      buttonText: "Add {count} to Cart",
      successMessage: "Added to cart!",
      ctaText: "Add {count} to Cart",
      productSelectionMethod: "ai",
      layout: "grid",
      columns: 2,
      maxProducts: 3,
      multiSelect: true,
      showImages: true,
      showPrices: true,
      showCompareAtPrice: true,
      bundleDiscount: 20,
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        scroll_depth: { enabled: true, depth_percentage: 50 },
        frequency_capping: getServerFrequencyCapping("PRODUCT_UPSELL"),
      },
      // Advanced targeting disabled by default so Free plan users can use this template
      audienceTargeting: {
        enabled: false,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      // Glass theme - frosted glass effect
      theme: "glass",
      position: "center",
      size: "large",
      popupSize: "wide",
      borderRadius: 8,
      animation: "fade",

      // Main colors - glass effect
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      textColor: "#18181b",
      descriptionColor: "#52525b",
      accentColor: "#6366f1",

      // Button colors - indigo
      buttonColor: "#6366f1",
      buttonTextColor: "#ffffff",

      // Input field colors - glass effect
      inputBackgroundColor: "rgba(255, 255, 255, 0.5)",
      inputTextColor: "#111827",
      inputBorderColor: "rgba(212, 212, 216, 0.5)",
      inputBackdropFilter: "blur(10px)",

      // Image / surface colors
      imageBgColor: "rgba(244, 244, 245, 0.8)",
      imagePosition: "left",
      backgroundImageMode: "preset",
      backgroundImagePresetKey: "glass",
      imageUrl: "/apps/revenue-boost/assets/newsletter-backgrounds/glass.jpg",

      // State colors
      successColor: "#10b981",

      // Overlay
      overlayOpacity: 0.5,

      // Typography
      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "700",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "400",
    },
    isDefault: true,
    priority: 12,
    icon: "🔗",
    conversionRate: 3.8
  },

  // Social Proof Notifications
  {
    name: "Social Proof Notifications",
    description: "Show recent purchases to build trust",
    category: "engagement",
    templateType: "SOCIAL_PROOF",
    goals: ["ENGAGEMENT", "INCREASE_REVENUE"],
    contentConfig: {
      headline: "Recent activity",
      subheadline: "See what other shoppers are doing right now",
      buttonText: "Shop now",
      successMessage: "Customers are loving these products.",
      messageTemplate: "{{name}} from {{location}} just purchased {{product}}",
      messageTemplates: {
        purchase: "{{name}} from {{location}} just purchased {{product}}",
      },
      displayDuration: 6
    },
    fields: [
      { id: "messageTemplate", type: "text", label: "Message Template", category: "content" },
      { id: "displayDuration", type: "number", label: "Display Duration (s)", category: "behavior" }
    ],
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 2000 },
        frequency_capping: getServerFrequencyCapping("SOCIAL_PROOF"),
      },
      // Advanced targeting disabled by default so Free plan users can use this template
      audienceTargeting: {
        enabled: false,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      // Modern default colors (match app-wide modern blue preset)
      backgroundColor: "#FFFFFF",
      textColor: "#1A202C",
      position: "bottom",
      size: "small"
    },
    isDefault: true,
    priority: 14,
    icon: "💬",
    conversionRate: 2.9
  },
  // Free Shipping Threshold Bar
  {
    name: "Free Shipping Threshold Bar",
    description: "Motivate shoppers to reach free shipping threshold",
    category: "sales",
    templateType: "FREE_SHIPPING",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      threshold: 50,
      currency: "$",
      nearMissThreshold: 10,
      emptyMessage: "Add items to unlock free shipping",
      progressMessage: "You're {remaining} away from free shipping",
      nearMissMessage: "Only {remaining} to go!",
      unlockedMessage: "You've unlocked free shipping! 🎉",
      requireEmailToClaim: false,
      claimButtonLabel: "Claim discount",
      claimEmailPlaceholder: "Enter your email"
    },
    fields: [
      { id: "threshold", type: "number", label: "Free Shipping Threshold", category: "content" },
      { id: "progressMessage", type: "text", label: "Progress Message", category: "content" },
      { id: "unlockedMessage", type: "text", label: "Unlocked Message", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        cart_value: {
          enabled: true,
          min_value: 0,
          max_value: 50,
          check_interval: 2000,
        },
        frequency_capping: getServerFrequencyCapping("FREE_SHIPPING"),
      },
      // Advanced targeting disabled by default so Free plan users can use this template
      audienceTargeting: {
        enabled: false,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      // Modern default colors
      backgroundColor: "#FFFFFF",
      textColor: "#1A202C",
      position: "top",
      size: "small"
    },
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "FREE_SHIPPING",
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
      expiryDays: 30,
      minimumAmount: 50,
    },
    isDefault: true,
    priority: 15,
    icon: "🎁",
    conversionRate: 3.7
  },
  // Announcement Ribbon
  {
    name: "Announcement Ribbon",
    description: "Compact ribbon for announcements and store-wide messages",
    category: "announcement",
    templateType: "ANNOUNCEMENT",
    goals: ["ENGAGEMENT"],
    contentConfig: {
      headline: "Holiday shipping delays",
      buttonText: "Learn more",
      successMessage: "Thanks for reading our update.",
      ctaText: "Learn more"
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        frequency_capping: getServerFrequencyCapping("ANNOUNCEMENT"),
      }
    },
    designConfig: {
      // Modern default colors
      backgroundColor: "#FFFFFF",
      textColor: "#1A202C",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      position: "top",
      size: "small"
    },
    isDefault: true,
    priority: 16,
    icon: "📢",
    conversionRate: 1.8
  },

];

