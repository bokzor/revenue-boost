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
      // Use the "modern" newsletter theme as the default seeded look
      theme: "modern",
      position: "center",
      size: "medium",
      popupSize: "standard",
      borderRadius: 8,
      animation: "fade",

      imageUrl: "/newsletter-backgrounds/modern.png",
      imagePosition: "left",

      // Modern theme colors (aligned with NEWSLETTER_THEMES.modern)
      backgroundColor: "#ffffff",
      textColor: "#111827",
      descriptionColor: "#52525b",
      accentColor: "#dbeafe",

      buttonColor: "#3b82f6",
      buttonTextColor: "#ffffff",

      inputBackgroundColor: "#f3f4f6",
      inputTextColor: "#111827",
      inputBorderColor: "#d4d4d8",

      imageBgColor: "#f4f4f5",
      successColor: "#10b981",
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
      deliveryMode: "show_code_fallback",
      autoApplyMode: "ajax",
      codePresentation: "show_code",
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
    // Use Modern theme-inspired colors for seeded design
    designConfig: {
      theme: "modern",
      position: "center",
      size: "medium",
      popupSize: "wide",
      borderRadius: 8,
      animation: "fade",
      imagePosition: "left",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      descriptionColor: "#52525b",
      accentColor: "#dbeafe",
      buttonColor: "#3b82f6",
      buttonTextColor: "#ffffff",
      inputBackgroundColor: "#f3f4f6",
      inputBorderColor: "#d4d4d8",
      imageBgColor: "#f4f4f5",
      successColor: "#10b981",
      overlayOpacity: 0.8,
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
      deliveryMode: "show_code_always",
      autoApplyMode: "ajax",
      codePresentation: "show_code",
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
      successMessage: "You won {{prize}}! Use code {{code}} at checkout.",
      failureMessage: "Thanks for playing!",
      ctaText: "Spin Now",
      emailRequired: true,
      emailPlaceholder: "Enter your email to spin",
      collectName: true,
      showGdprCheckbox: true,
      gdprLabel: "I agree to receive marketing emails and accept the privacy policy",
      wheelSegments: [
        {
          id: "segment-5-off",
          label: "5% OFF",
          probability: 0.35,
          color: "#10B981",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 5,
            deliveryMode: "show_code_fallback" as const,
            expiryDays: 30,
            type: "single_use" as const,
            autoApplyMode: "ajax" as const,
            codePresentation: "show_code" as const,
          },
        },
        {
          id: "segment-10-off",
          label: "10% OFF",
          probability: 0.25,
          color: "#3B82F6",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 10,
            deliveryMode: "show_code_fallback" as const,
            expiryDays: 30,
            type: "single_use" as const,
            autoApplyMode: "ajax" as const,
            codePresentation: "show_code" as const,
          },
        },
        {
          id: "segment-15-off",
          label: "15% OFF",
          probability: 0.15,
          color: "#F59E0B",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 15,
            deliveryMode: "show_code_fallback" as const,
            expiryDays: 30,
            type: "single_use" as const,
            autoApplyMode: "ajax" as const,
            codePresentation: "show_code" as const,
          },
        },
        {
          id: "segment-20-off",
          label: "20% OFF",
          probability: 0.1,
          color: "#EF4444",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "PERCENTAGE" as const,
            value: 20,
            deliveryMode: "show_code_fallback" as const,
            expiryDays: 30,
            type: "single_use" as const,
            autoApplyMode: "ajax" as const,
            codePresentation: "show_code" as const,
          },
        },
        {
          id: "segment-free-shipping",
          label: "FREE SHIPPING",
          probability: 0.1,
          color: "#8B5CF6",
          discountConfig: {
            enabled: true,
            showInPreview: true,
            valueType: "FREE_SHIPPING" as const,
            deliveryMode: "show_code_fallback" as const,
            expiryDays: 30,
            type: "single_use" as const,
            autoApplyMode: "ajax" as const,
            codePresentation: "show_code" as const,
          },
        },
        {
          id: "segment-try-again",
          label: "Try Again",
          probability: 0.05,
          color: "#6B7280",
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
      // Minimal theme default colors (aligned with NEWSLETTER_THEMES.minimal)
      theme: "minimal",
      position: "center",
      size: "medium",
      borderRadius: 24,
      animation: "fade",

      // Main colors
      backgroundColor: "#fafafa",
      textColor: "#18181b",
      descriptionColor: "#71717a",
      accentColor: "#e4e4e7",

      // Button colors
      buttonColor: "#18181b",
      buttonTextColor: "#ffffff",

      // Input field colors
      inputBackgroundColor: "#f4f4f5",
      inputTextColor: "#111827",
      inputBorderColor: "#d4d4d8",

      // Image / surface colors
      imageBgColor: "#f4f4f5",

      // State colors
      successColor: "#22c55e",

      // Overlay
      overlayOpacity: 0.5,
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
      ctaText: "Reveal"
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
      // Modern default colors
      backgroundColor: "#FFFFFF",
      textColor: "#1A202C",
      buttonColor: "#3B82F6",
      buttonTextColor: "#FFFFFF",
      position: "center",
      size: "medium"
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
      audienceTargeting: {
        enabled: true,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: true,
          conditions: [
            {
              field: "cartItemCount",
              operator: "gt",
              value: 0,
            },
          ],
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
      maxProducts: 3,
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
      audienceTargeting: {
        enabled: true,
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
      position: "right",
      size: "medium"
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
      layout: "carousel",
      maxProducts: 5,
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
      audienceTargeting: {
        enabled: true,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: true,
          conditions: [
            {
              field: "cartItemCount",
              operator: "gt",
              value: 0,
            },
          ],
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
      position: "right",
      size: "medium"
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
      maxProducts: 3,
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
      audienceTargeting: {
        enabled: true,
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
      position: "center",
      size: "medium"
    },
    isDefault: true,
    priority: 12,
    icon: "🔗",
    conversionRate: 3.8
  },
  // Post-Add Upsell
  {
    name: "Post-Add Upsell",
    description: "Offer a relevant upsell after add-to-cart",
    category: "sales",
    templateType: "PRODUCT_UPSELL",
    goals: ["INCREASE_REVENUE"],
    contentConfig: {
      headline: "Great pick! Add this too",
      subheadline: "Bundle and save more",
      buttonText: "Add {count} & Save",
      successMessage: "Added to cart!",
      ctaText: "Add {count} & Save",
      productSelectionMethod: "ai",
      layout: "card",
      maxProducts: 2,
      bundleDiscount: 10,
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        add_to_cart: { enabled: true },
        frequency_capping: getServerFrequencyCapping("PRODUCT_UPSELL"),
      },
      audienceTargeting: {
        enabled: true,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: true,
          conditions: [
            {
              field: "cartItemCount",
              operator: "gt",
              value: 0,
            },
          ],
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
      position: "right",
      size: "medium"
    },
    isDefault: true,
    priority: 13,
    icon: "🛍️",
    conversionRate: 4.4
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
      audienceTargeting: {
        enabled: true,
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
      audienceTargeting: {
        enabled: true,
        shopifySegmentIds: [],
        sessionRules: {
          enabled: true,
          conditions: [
            {
              field: "cartItemCount",
              operator: "gt",
              value: 0,
            },
          ],
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
      deliveryMode: "auto_apply_only",
      autoApplyMode: "ajax",
      codePresentation: "show_code",
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

