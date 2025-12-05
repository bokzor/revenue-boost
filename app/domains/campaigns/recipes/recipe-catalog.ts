import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { CampaignGoal, TemplateType } from "~/domains/campaigns/types/campaign";
import type { ProductPickerSelection } from "../components/form/ProductPicker";
import type { NewsletterThemeKey } from "~/config/color-presets";

// ============================================================================
// RECIPE CATEGORIES
// ============================================================================

export type RecipeCategory =
  | "email_leads" // 📧 Email & Leads
  | "sales_promos" // 🔥 Sales & Promos
  | "cart_recovery" // 🛒 Cart & Recovery
  | "announcements"; // 📢 Announcements

export interface RecipeCategoryMeta {
  label: string;
  icon: string;
  description: string;
  defaultGoal: CampaignGoal;
}

export const RECIPE_CATEGORIES: Record<RecipeCategory, RecipeCategoryMeta> = {
  email_leads: {
    label: "Email & Leads",
    icon: "📧",
    description: "Grow your email list with compelling offers",
    defaultGoal: "NEWSLETTER_SIGNUP",
  },
  sales_promos: {
    label: "Sales & Promos",
    icon: "🔥",
    description: "Drive sales with discounts and urgency",
    defaultGoal: "INCREASE_REVENUE",
  },
  cart_recovery: {
    label: "Cart & Recovery",
    icon: "🛒",
    description: "Recover abandoned carts and increase AOV",
    defaultGoal: "INCREASE_REVENUE", // or CART_RECOVERY when added
  },
  announcements: {
    label: "Announcements",
    icon: "📢",
    description: "Inform customers about news and updates",
    defaultGoal: "ENGAGEMENT",
  },
};

// ============================================================================
// RECIPE STRUCTURE (locked layout decisions)
// ============================================================================

export interface RecipeStructure {
  layout: "centered" | "split-left" | "split-right" | "fullscreen" | "banner" | "sidebar";
  position: "center" | "top" | "bottom" | "right" | "left";
  size: "small" | "medium" | "large";
  animation: "fade" | "slide" | "bounce" | "none";
  sections: {
    image?: boolean;
    subtitle?: boolean;
    countdown?: boolean;
    cartItems?: boolean;
    products?: boolean;
    progressBar?: boolean;
  };
}

// ============================================================================
// RECIPE DEFINITION
// ============================================================================

export interface RecipeDefinition {
  // Identity
  id: string;
  name: string;
  tagline: string; // Short compelling description
  description: string; // Longer explanation
  icon: string; // Emoji for quick recognition

  // Classification
  category: RecipeCategory;
  goal: CampaignGoal;
  templateType: TemplateType;

  // Structure (locked - recipe decides)
  structure: RecipeStructure;

  // Theme (uses existing theme system)
  suggestedTheme: NewsletterThemeKey;

  // Quick setup inputs (1-3 max)
  inputs: RecipeInput[];

  // Allowed template names for filtering (optional, backward compat)
  allowedTemplateNames?: string[];

  // Build function
  build: (context: RecipeContext) => Partial<CampaignFormData>;
}

export type RecipeInput =
  | { type: "product_picker"; label: string; key: string; multiSelect?: boolean }
  | { type: "collection_picker"; label: string; key: string; multiSelect?: boolean }
  | { type: "discount_percentage"; label: string; defaultValue: number; key: string }
  | { type: "currency_amount"; label: string; defaultValue: number; key: string }
  | { type: "text"; label: string; key: string; defaultValue?: string }
  | { type: "datetime"; label: string; key: string }
  | { type: "duration_hours"; label: string; key: string; defaultValue?: number };

export interface RecipeContext {
  products?: ProductPickerSelection[];
  collections?: ProductPickerSelection[];
  triggerProducts?: ProductPickerSelection[];
  offerProducts?: ProductPickerSelection[];
  discountValue?: number;
  threshold?: number;
  durationHours?: number;
  message?: string;
  saleName?: string;
  eventDate?: string;
  selectedTheme?: NewsletterThemeKey;
}

// ============================================================================
// HELPERS
// ============================================================================

const getNumberFromContext = (value: number | undefined, fallback: number): number => {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
};

// ============================================================================
// 🔥 SALES & PROMOS RECIPES
// ============================================================================

const SALES_PROMOS_RECIPES: RecipeDefinition[] = [
  {
    id: "product-spotlight",
    name: "Product Spotlight",
    tagline: "Featured: [Product] - 20% off today!",
    description: "Promote a single hero product with a dedicated image and discount.",
    icon: "✨",
    category: "sales_promos",
    goal: "INCREASE_REVENUE",
    templateType: "FLASH_SALE",
    structure: {
      layout: "split-left",
      position: "center",
      size: "large",
      animation: "fade",
      sections: { image: true, subtitle: true, countdown: false },
    },
    suggestedTheme: "elegant",
    inputs: [
      { type: "product_picker", label: "Select Product", key: "products" },
      {
        type: "discount_percentage",
        label: "Discount Percentage",
        defaultValue: 20,
        key: "discountValue",
      },
    ],
    build: (context) => {
      const discountValue = getNumberFromContext(context.discountValue, 20);
      const product = context.products?.[0];
      if (!product) return {};

      return {
        name: `Spotlight: ${product.title}`,
        designConfig: {
          theme: context.selectedTheme || "elegant",
          position: "center",
          size: "large",
          animation: "fade",
        },
        contentConfig: {
          headline: `${discountValue}% OFF ${product.title}`,
          subheadline: "Limited time offer on our best-seller.",
          imageUrl: product.images?.[0]?.originalSrc || "",
          buttonText: "Shop Now",
          ctaUrl: `/products/${product.handle}`,
        },
        pageTargeting: {
          enabled: true,
          pages: [],
          customPatterns: [],
          excludePages: [],
          productTags: [],
          collections: [],
        },
        targetRules: {
          enhancedTriggers: {
            page_load: { enabled: false },
            product_view: {
              enabled: true,
              product_ids: [product.id],
              time_on_page: 3,
            },
          },
        },
        discountConfig: {
          enabled: true,
          type: "single_use",
          valueType: "PERCENTAGE",
          value: discountValue,
          applicability: {
            scope: "products",
            productIds: [product.id],
          },
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
  {
    id: "flash-sale",
    name: "Flash Sale",
    tagline: "24 hours only! 30% off everything",
    description: "Create urgency with a time-limited sitewide discount.",
    icon: "⚡",
    category: "sales_promos",
    goal: "INCREASE_REVENUE",
    templateType: "FLASH_SALE",
    structure: {
      layout: "centered",
      position: "center",
      size: "large",
      animation: "bounce",
      sections: { image: false, subtitle: true, countdown: true },
    },
    suggestedTheme: "bold",
    inputs: [
      { type: "discount_percentage", label: "Discount", defaultValue: 30, key: "discountValue" },
      { type: "duration_hours", label: "Duration (hours)", defaultValue: 24, key: "durationHours" },
    ],
    build: (context) => {
      const discountValue = getNumberFromContext(context.discountValue, 30);
      const durationHours = getNumberFromContext(context.durationHours, 24);

      return {
        name: "Flash Sale",
        designConfig: {
          theme: context.selectedTheme || "bold",
          position: "center",
          size: "large",
          animation: "bounce",
        },
        contentConfig: {
          headline: `Flash Sale: ${discountValue}% Off Everything!`,
          subheadline: "Limited time only",
          urgencyMessage: "Ends in",
          showCountdown: true,
          countdownDuration: durationHours * 3600,
          buttonText: "Shop Now",
        },
        targetRules: {
          enhancedTriggers: {
            page_load: { enabled: true, delay: 2000 },
          },
        },
        discountConfig: {
          enabled: true,
          type: "shared",
          valueType: "PERCENTAGE",
          value: discountValue,
          applicability: { scope: "all" },
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
  {
    id: "collection-sale",
    name: "Collection Sale",
    tagline: "Summer Collection - Up to 40% off",
    description: "Run a sale on a specific collection.",
    icon: "🏷️",
    category: "sales_promos",
    goal: "INCREASE_REVENUE",
    templateType: "FLASH_SALE",
    structure: {
      layout: "split-left",
      position: "center",
      size: "large",
      animation: "fade",
      sections: { image: true, subtitle: true, countdown: false },
    },
    suggestedTheme: "modern",
    inputs: [
      { type: "collection_picker", label: "Select Collection", key: "collections" },
      {
        type: "discount_percentage",
        label: "Discount Percentage",
        defaultValue: 15,
        key: "discountValue",
      },
    ],
    build: (context) => {
      const discountValue = getNumberFromContext(context.discountValue, 15);
      const collection = context.collections?.[0];
      if (!collection) return {};

      return {
        name: `Sale: ${collection.title}`,
        designConfig: {
          theme: context.selectedTheme || "modern",
          position: "center",
          size: "large",
          animation: "fade",
        },
        contentConfig: {
          headline: `${discountValue}% OFF ${collection.title}`,
          subheadline: "Shop our exclusive collection.",
          imageUrl: collection.images?.[0]?.originalSrc || "",
          buttonText: "View Collection",
          ctaUrl: `/collections/${collection.handle}`,
        },
        pageTargeting: {
          enabled: true,
          pages: [],
          customPatterns: [],
          excludePages: [],
          productTags: [],
          collections: [collection.id],
        },
        targetRules: {
          enhancedTriggers: {
            page_load: { enabled: true, delay: 3000 },
          },
        },
        discountConfig: {
          enabled: true,
          type: "single_use",
          valueType: "PERCENTAGE",
          value: discountValue,
          applicability: {
            scope: "collections",
            collectionIds: [collection.id],
          },
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
];

// ============================================================================
// 🛒 CART & RECOVERY RECIPES
// ============================================================================

const CART_RECOVERY_RECIPES: RecipeDefinition[] = [
  {
    id: "complete-your-look",
    name: "Complete Your Look",
    tagline: "Customers also bought these...",
    description: "Product recommendations based on cart contents.",
    icon: "👗",
    category: "cart_recovery",
    goal: "INCREASE_REVENUE",
    templateType: "PRODUCT_UPSELL",
    structure: {
      layout: "sidebar",
      position: "right",
      size: "medium",
      animation: "slide",
      sections: { products: true, subtitle: true },
    },
    suggestedTheme: "minimal",
    allowedTemplateNames: ["Product Spotlight"],
    inputs: [
      { type: "product_picker", label: "Select Product to Highlight", key: "products" },
      {
        type: "discount_percentage",
        label: "Bundle Discount",
        defaultValue: 15,
        key: "discountValue",
      },
    ],
    build: (context) => {
      const discountValue = getNumberFromContext(context.discountValue, 15);
      const product = context.products?.[0];
      if (!product) return {};

      return {
        name: `Complete Your Look`,
        designConfig: {
          theme: context.selectedTheme || "minimal",
          position: "right",
          size: "medium",
          animation: "slide",
        },
        contentConfig: {
          headline: "Complete Your Look",
          subheadline: "Customers also love these",
          buttonText: "Add to Cart",
          bundleDiscount: discountValue,
          productSelectionMethod: "manual" as const,
          selectedProducts: [product.id],
        },
        discountConfig: {
          enabled: true,
          type: "single_use",
          valueType: "PERCENTAGE",
          value: discountValue,
          applicability: {
            scope: "products",
            productIds: [product.id],
          },
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
  {
    id: "cart-recovery",
    name: "Don't Leave Your Cart",
    tagline: "Complete your order and get 15% off",
    description: "Recover abandoning visitors with a discount incentive.",
    icon: "🛒",
    category: "cart_recovery",
    goal: "INCREASE_REVENUE",
    templateType: "CART_ABANDONMENT",
    structure: {
      layout: "centered",
      position: "center",
      size: "medium",
      animation: "fade",
      sections: { cartItems: true, subtitle: true },
    },
    suggestedTheme: "modern",
    inputs: [
      {
        type: "discount_percentage",
        label: "Recovery Discount",
        defaultValue: 15,
        key: "discountValue",
      },
    ],
    build: (context) => {
      const discountValue = getNumberFromContext(context.discountValue, 15);
      return {
        name: "Cart Recovery",
        designConfig: {
          theme: context.selectedTheme || "modern",
          position: "center",
          size: "medium",
        },
        contentConfig: {
          headline: "Don't forget your items!",
          subheadline: `Complete your order and get ${discountValue}% off`,
          buttonText: "Complete Order",
          showCartItems: true,
        },
        targetRules: {
          enhancedTriggers: {
            exit_intent: { enabled: true, sensitivity: "medium" },
            cart_value: { enabled: true, minValue: 1 },
          },
        },
        discountConfig: {
          enabled: true,
          type: "single_use",
          valueType: "PERCENTAGE",
          value: discountValue,
          applicability: { scope: "all" },
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
  {
    id: "free-shipping-progress",
    name: "Free Shipping Progress",
    tagline: "Spend $25 more for FREE shipping!",
    description: "Progress bar motivating customers to reach free shipping threshold.",
    icon: "🚚",
    category: "cart_recovery",
    goal: "INCREASE_REVENUE",
    templateType: "FREE_SHIPPING",
    structure: {
      layout: "banner",
      position: "top",
      size: "small",
      animation: "slide",
      sections: { progressBar: true },
    },
    suggestedTheme: "modern",
    inputs: [
      {
        type: "currency_amount",
        label: "Free Shipping Threshold",
        defaultValue: 75,
        key: "threshold",
      },
    ],
    build: (context) => {
      const threshold = getNumberFromContext(context.threshold, 75);
      return {
        name: "Free Shipping Progress",
        designConfig: {
          theme: context.selectedTheme || "modern",
          position: "top",
        },
        contentConfig: {
          threshold,
          currency: "$",
          barPosition: "top",
          emptyMessage: "Add items to unlock free shipping",
          progressMessage: "You're {remaining} away from free shipping!",
          unlockedMessage: "🎉 You've unlocked free shipping!",
        },
        discountConfig: {
          enabled: true,
          valueType: "FREE_SHIPPING",
          minimumAmount: threshold,
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
];

// ============================================================================
// 📧 EMAIL & LEADS RECIPES
// ============================================================================

const EMAIL_LEADS_RECIPES: RecipeDefinition[] = [
  {
    id: "welcome-discount",
    name: "Welcome Discount",
    tagline: "Get 10% off your first order",
    description:
      "Classic email capture with a first-order discount. Best for new visitor conversion.",
    icon: "🎁",
    category: "email_leads",
    goal: "NEWSLETTER_SIGNUP",
    templateType: "NEWSLETTER",
    structure: {
      layout: "split-left",
      position: "center",
      size: "medium",
      animation: "fade",
      sections: { image: true, subtitle: true },
    },
    suggestedTheme: "modern",
    inputs: [
      { type: "discount_percentage", label: "Discount", defaultValue: 10, key: "discountValue" },
    ],
    build: (context) => {
      const discountValue = getNumberFromContext(context.discountValue, 10);
      return {
        name: "Welcome Discount",
        designConfig: {
          theme: context.selectedTheme || "modern",
          position: "center",
          size: "medium",
          animation: "fade",
        },
        contentConfig: {
          headline: `Get ${discountValue}% Off Your First Order`,
          subheadline: "Subscribe to our newsletter for exclusive offers and updates.",
          buttonText: "Claim My Discount",
          emailPlaceholder: "Enter your email",
          successMessage: "Check your email for your discount code!",
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
          value: discountValue,
          applicability: { scope: "all" },
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
  {
    id: "exit-offer",
    name: "Exit Offer",
    tagline: "Wait! Here's 15% off before you go",
    description: "Capture leaving visitors with an exit-intent discount offer.",
    icon: "🚪",
    category: "email_leads",
    goal: "NEWSLETTER_SIGNUP",
    templateType: "NEWSLETTER",
    structure: {
      layout: "centered",
      position: "center",
      size: "medium",
      animation: "bounce",
      sections: { image: false, subtitle: true },
    },
    suggestedTheme: "dark",
    inputs: [
      { type: "discount_percentage", label: "Discount", defaultValue: 15, key: "discountValue" },
    ],
    build: (context) => {
      const discountValue = getNumberFromContext(context.discountValue, 15);
      return {
        name: "Exit Offer",
        designConfig: {
          theme: context.selectedTheme || "dark",
          position: "center",
          size: "medium",
          animation: "bounce",
        },
        contentConfig: {
          headline: "Wait! Don't leave empty-handed",
          subheadline: `Get ${discountValue}% off your first order`,
          buttonText: "Claim My Discount",
          emailPlaceholder: "Enter your email",
        },
        targetRules: {
          enhancedTriggers: {
            exit_intent: { enabled: true, sensitivity: "medium" },
          },
        },
        discountConfig: {
          enabled: true,
          type: "single_use",
          valueType: "PERCENTAGE",
          value: discountValue,
          applicability: { scope: "all" },
          showInPreview: true,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };
    },
  },
  {
    id: "vip-early-access",
    name: "VIP Early Access",
    tagline: "Join the VIP list for exclusive access",
    description: "Email capture without discount. For building anticipation for launches or sales.",
    icon: "👑",
    category: "email_leads",
    goal: "NEWSLETTER_SIGNUP",
    templateType: "NEWSLETTER",
    structure: {
      layout: "centered",
      position: "center",
      size: "medium",
      animation: "fade",
      sections: { image: false, subtitle: true },
    },
    suggestedTheme: "luxury",
    inputs: [],
    build: (context) => ({
      name: "VIP Early Access",
      designConfig: {
        theme: context.selectedTheme || "luxury",
        position: "center",
        size: "medium",
      },
      contentConfig: {
        headline: "Get VIP Early Access",
        subheadline: "Be the first to know about new arrivals and exclusive sales",
        buttonText: "Join VIP List",
        emailPlaceholder: "Enter your email",
        successMessage: "You're on the list! We'll notify you first.",
      },
      // No discount for VIP signup
    }),
  },
];

// ============================================================================
// 📢 ANNOUNCEMENTS RECIPES
// ============================================================================

const ANNOUNCEMENTS_RECIPES: RecipeDefinition[] = [
  {
    id: "sale-announcement",
    name: "Sale Announcement",
    tagline: "Summer Sale Now Live!",
    description: "Announce an ongoing sale across the store.",
    icon: "📣",
    category: "announcements",
    goal: "ENGAGEMENT",
    templateType: "ANNOUNCEMENT",
    structure: {
      layout: "banner",
      position: "top",
      size: "small",
      animation: "slide",
      sections: {},
    },
    suggestedTheme: "bold",
    inputs: [{ type: "text", label: "Sale Name", key: "saleName", defaultValue: "Summer Sale" }],
    build: (context) => ({
      name: "Sale Announcement",
      designConfig: {
        theme: context.selectedTheme || "bold",
        position: "top",
      },
      contentConfig: {
        headline: `${context.saleName || "Summer Sale"} Now Live!`,
        buttonText: "Shop the Sale",
        ctaUrl: "/collections/sale",
        sticky: true,
      },
    }),
  },
];

// ============================================================================
// COMBINED CATALOG (flat array)
// ============================================================================

export const ALL_RECIPES: RecipeDefinition[] = [
  ...EMAIL_LEADS_RECIPES,
  ...SALES_PROMOS_RECIPES,
  ...CART_RECOVERY_RECIPES,
  ...ANNOUNCEMENTS_RECIPES,
];

// ============================================================================
// LEGACY CATALOG (by template type - for backward compatibility)
// ============================================================================

export const RECIPE_CATALOG: Partial<Record<TemplateType, RecipeDefinition[]>> = {
  FLASH_SALE: SALES_PROMOS_RECIPES.filter((r) => r.templateType === "FLASH_SALE"),
  PRODUCT_UPSELL: CART_RECOVERY_RECIPES.filter((r) => r.templateType === "PRODUCT_UPSELL"),
  CART_ABANDONMENT: CART_RECOVERY_RECIPES.filter((r) => r.templateType === "CART_ABANDONMENT"),
  FREE_SHIPPING: CART_RECOVERY_RECIPES.filter((r) => r.templateType === "FREE_SHIPPING"),
  NEWSLETTER: EMAIL_LEADS_RECIPES.filter((r) => r.templateType === "NEWSLETTER"),
  SPIN_TO_WIN: EMAIL_LEADS_RECIPES.filter((r) => r.templateType === "SPIN_TO_WIN"),
  ANNOUNCEMENT: ANNOUNCEMENTS_RECIPES.filter((r) => r.templateType === "ANNOUNCEMENT"),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get all recipes in a category */
export function getRecipesByCategory(category: RecipeCategory): RecipeDefinition[] {
  return ALL_RECIPES.filter((r) => r.category === category);
}

/** Get recipe by ID */
export function getRecipeById(id: string): RecipeDefinition | undefined {
  return ALL_RECIPES.find((r) => r.id === id);
}

/** Get all categories with their recipes */
export function getCategorizedRecipes(): Record<RecipeCategory, RecipeDefinition[]> {
  return {
    email_leads: getRecipesByCategory("email_leads"),
    sales_promos: getRecipesByCategory("sales_promos"),
    cart_recovery: getRecipesByCategory("cart_recovery"),
    announcements: getRecipesByCategory("announcements"),
  };
}

/** Get recipes for a specific template type (legacy support) */
export function getRecipesForTemplate(templateType: TemplateType): RecipeDefinition[] {
  return RECIPE_CATALOG[templateType] || [];
}
