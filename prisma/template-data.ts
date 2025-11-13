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
      theme: "bold",
      position: "center",
      size: "medium",
      popupSize: "standard",
      borderRadius: 8,
      animation: "fade",

      imageUrl: "/newsletter-backgrounds/bold.png",
      imagePosition: "left",

      backgroundColor: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
      textColor: "#ffffff",
      descriptionColor: "#fef3c7",
      accentColor: "#fde68a",

      buttonColor: "#ffffff",
      buttonTextColor: "#ec4899",

      inputBackgroundColor: "rgba(255, 255, 255, 0.2)",
      inputTextColor: "#111827",
      inputBorderColor: "rgba(255, 255, 255, 0.3)",

      imageBgColor: "rgba(255, 255, 255, 0.15)",
      successColor: "#10b981",
      overlayOpacity: 0.5,

      fontFamily: "inherit",
      titleFontSize: "1.875rem",
      titleFontWeight: "900",
      descriptionFontSize: "1rem",
      descriptionFontWeight: "500",
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
      headline: "🔥 Flash Sale - 30% OFF!",
      subheadline: "Limited time offer - ends soon!",
      ctaText: "Shop Now & Save",
      urgencyMessage: "Only 2 hours left!",
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "urgencyMessage", type: "text", label: "Urgency Message", category: "content" },
      { id: "timerEnabled", type: "boolean", label: "Enable Countdown Timer", category: "behavior" },
      { id: "discountValue", type: "number", label: "Discount Percentage", category: "behavior" },
    ],
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 2000 },
        frequency_capping: getServerFrequencyCapping("FLASH_SALE"),
      },
    },
    designConfig: {
      backgroundColor: "#FF6B6B",
      textColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      buttonTextColor: "#FF6B6B",
      position: "center",
      size: "medium",
    },
    discountConfig: {
      enabled: true,
      type: "percentage",
      value: 30,
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
      ctaText: "Spin Now",
      emailRequired: true,
      prizes: [
        { label: "10% OFF", probability: 30 },
        { label: "15% OFF", probability: 20 },
        { label: "20% OFF", probability: 10 },
        { label: "Free Shipping", probability: 25 },
        { label: "Try Again", probability: 15 },
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
      backgroundColor: "#4A90E2",
      textColor: "#FFFFFF",
      buttonColor: "#FFD700",
      buttonTextColor: "#000000",
      position: "center",
      size: "large",
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
      backgroundColor: "#222222",
      textColor: "#FFFFFF",
      buttonColor: "#FFD700",
      buttonTextColor: "#000000",
      position: "top",
      size: "small"
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
    goals: ["ENGAGEMENT"],
    contentConfig: {
      headline: "Scratch & Win",
      subheadline: "Reveal your surprise",
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
      backgroundColor: "#FFFFFF",
      textColor: "#1A1A1A",
      buttonColor: "#22C55E",
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
      subheadline: "Complete your purchase before its gone",
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
        segments: ["Cart Abandoner", "Active Shopper"],
        customRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      backgroundColor: "#FFF7ED",
      textColor: "#7C2D12",
      buttonColor: "#EA580C",
      buttonTextColor: "#FFFFFF",
      position: "bottom",
      size: "small"
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
      ctaText: "Add to Cart"
    },
    fields: [
      { id: "headline", type: "text", label: "Headline", category: "content" },
      { id: "subheadline", type: "text", label: "Subheadline", category: "content" },
      { id: "ctaText", type: "text", label: "Button Text", category: "content" }
    ],
    targetRules: {
      enhancedTriggers: {
        product_view: { enabled: true, time_on_page: 10 },
        frequency_capping: getServerFrequencyCapping("PRODUCT_UPSELL"),
      },
      audienceTargeting: {
        enabled: true,
        segments: ["Product Viewer"],
        customRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      backgroundColor: "#F0F9FF",
      textColor: "#0C4A6E",
      buttonColor: "#0284C7",
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
      ctaText: "Add & Save"
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
        segments: ["Active Shopper", "Cart Abandoner"],
        customRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      backgroundColor: "#ECFEFF",
      textColor: "#134E4A",
      buttonColor: "#0EA5E9",
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
      ctaText: "Add to Cart"
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
        segments: ["Product Viewer"],
        customRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      backgroundColor: "#FEFCE8",
      textColor: "#713F12",
      buttonColor: "#D97706",
      buttonTextColor: "#FFFFFF",
      position: "bottom",
      size: "small"
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
      ctaText: "Add Now"
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
        segments: ["Active Shopper"],
        customRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      backgroundColor: "#EEF2FF",
      textColor: "#3730A3",
      buttonColor: "#6366F1",
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
      messageTemplate: "{{name}} from {{location}} just purchased",
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
        segments: ["New Visitor", "First Time Buyer", "Product Viewer"],
        customRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      backgroundColor: "#111827",
      textColor: "#F3F4F6",
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
      initialMessage: "You're ${{remaining}} away from free shipping",
      successMessage: "You unlocked Free Shipping!"
    },
    fields: [
      { id: "threshold", type: "number", label: "Free Shipping Threshold", category: "content" },
      { id: "initialMessage", type: "text", label: "Initial Message", category: "content" },
      { id: "successMessage", type: "text", label: "Success Message", category: "content" }
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
        segments: ["Active Shopper", "Cart Abandoner"],
        customRules: {
          enabled: false,
          conditions: [],
          logicOperator: "AND",
        },
      },
    },
    designConfig: {
      backgroundColor: "#DCFCE7",
      textColor: "#14532D",
      position: "top",
      size: "small"
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
      backgroundColor: "#1F2937",
      textColor: "#E5E7EB",
      buttonColor: "#10B981",
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


