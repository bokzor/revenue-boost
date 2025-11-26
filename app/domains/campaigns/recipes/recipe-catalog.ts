import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import type { ProductPickerSelection } from "../components/form/ProductPicker";

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  allowedTemplateNames?: string[];
  inputs: RecipeInput[];
  build: (context: RecipeContext) => Partial<CampaignFormData>;
}

export type RecipeInput =
  | { type: "product_picker"; label: string; key: string; multiSelect?: boolean }
  | { type: "collection_picker"; label: string; key: string; multiSelect?: boolean }
  | {
      type: "discount_percentage";
      label: string;
      defaultValue: number;
      key: string;
    }
  | {
      type: "currency_amount";
      label: string;
      defaultValue: number;
      key: string;
    };

export interface RecipeContext {
  products?: ProductPickerSelection[];
  collections?: ProductPickerSelection[];
  triggerProducts?: ProductPickerSelection[];
  offerProducts?: ProductPickerSelection[];
  discountValue?: number;
  threshold?: number;
}

const getNumberFromContext = (value: number | undefined, fallback: number): number => {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
};

export const RECIPE_CATALOG: Partial<Record<TemplateType, RecipeDefinition[]>> = {
  FLASH_SALE: [
    {
      id: "product-spotlight",
      name: "Product Spotlight",
      description: "Promote a single hero product with a dedicated image and discount.",
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
          name: `Flash Sale - ${product.title}`,
          contentConfig: {
            headline: `${discountValue}% OFF ${product.title}`,
            subheadline: "Limited time offer on our best-seller.",
            imageUrl: product.images?.[0]?.originalSrc || "",
            buttonText: "Shop Now",
            ctaUrl: `/products/${product.handle}`,
            discountPercentage: discountValue,
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
            behavior: "SHOW_CODE_ONLY",
          },
        };
      },
    },
    {
      id: "collection-sale",
      name: "Collection Sale",
      description: "Run a sale on a specific collection.",
      inputs: [
        {
          type: "collection_picker",
          label: "Select Collection",
          key: "collections",
        },
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
          name: `Sale - ${collection.title}`,
          contentConfig: {
            headline: `${discountValue}% OFF ${collection.title}`,
            subheadline: "Shop our exclusive collection.",
            imageUrl: collection.images?.[0]?.originalSrc || "",
            buttonText: "View Collection",
            ctaUrl: `/collections/${collection.handle}`,
            discountPercentage: discountValue,
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
            behavior: "SHOW_CODE_ONLY",
          },
        };
      },
    },
  ],
  PRODUCT_UPSELL: [
    {
      id: "product-spotlight-upsell",
      name: "Product Spotlight",
      description: "Showcase a specific product to drive discovery.",
      allowedTemplateNames: ["Product Spotlight"],
      inputs: [
        {
          type: "product_picker",
          label: "Select Product to Highlight",
          key: "products",
        },
        {
          type: "discount_percentage",
          label: "Discount Percentage",
          defaultValue: 10,
          key: "discountValue",
        },
      ],
      build: (context) => {
        const discountValue = getNumberFromContext(context.discountValue, 10);
        const product = context.products?.[0];
        if (!product) return {};

        return {
          name: `Spotlight: ${product.title}`,
          contentConfig: {
            headline: "Have you seen this?",
            subheadline: `Check out our popular ${product.title}`,
            buttonText: "View Product",
            bundleDiscount: discountValue,
            // Use existing schema fields instead of mappingRules
            productSelectionMethod: "manual" as const,
            selectedProducts: [product.id],
          },
          pageTargeting: {
            enabled: true,
            pages: ["home"],
            customPatterns: [],
            excludePages: [],
            productTags: [],
            collections: [],
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
      id: "product-page-upsell",
      name: "Specific Product Cross-Sell",
      description: "Recommend a specific product when a customer views another product.",
      allowedTemplateNames: ["Product Page Cross-Sell"],
      inputs: [
        {
          type: "product_picker",
          label: "When viewing this product (Trigger)",
          key: "triggerProducts",
        },
        {
          type: "product_picker",
          label: "Recommend this product (Upsell)",
          key: "offerProducts",
        },
        {
          type: "discount_percentage",
          label: "Bundle Discount",
          defaultValue: 15,
          key: "discountValue",
        },
      ],
      build: (context) => {
        const discountValue = getNumberFromContext(context.discountValue, 15);
        const triggerProduct = context.triggerProducts?.[0];
        const offerProduct = context.offerProducts?.[0];

        if (!triggerProduct || !offerProduct) return {};

        return {
          name: `Cross-Sell: ${triggerProduct.title} -> ${offerProduct.title}`,
          contentConfig: {
            headline: "Perfect together",
            subheadline: `Add ${offerProduct.title} to complete your set.`,
            buttonText: "Add to Cart",
            bundleDiscount: discountValue,
            // Use existing schema fields instead of mappingRules
            productSelectionMethod: "manual" as const,
            selectedProducts: [offerProduct.id],
          },
          pageTargeting: {
            enabled: true,
            pages: [],
            customPatterns: [`/products/${triggerProduct.handle}`],
            excludePages: [],
            productTags: [],
            collections: [],
          },
          discountConfig: {
            enabled: true,
            type: "single_use",
            valueType: "PERCENTAGE",
            value: discountValue,
            applicability: {
              scope: "products",
              productIds: [offerProduct.id],
            },
            showInPreview: true,
            behavior: "SHOW_CODE_AND_AUTO_APPLY",
          },
        };
      },
    },
    {
      id: "cart-cross-sell",
      name: "Cart Cross-Sell",
      description: "Suggest complementary items when specific items are in the cart.",
      allowedTemplateNames: ["Cart Upsell"],
      inputs: [
        {
          type: "product_picker",
          label: "When cart contains (Trigger)",
          key: "triggerProducts",
        },
        {
          type: "product_picker",
          label: "Recommend (Upsell)",
          key: "offerProducts",
        },
      ],
      build: (context) => {
        const discountValue = getNumberFromContext(context.discountValue, 10);
        const triggerProduct = context.triggerProducts?.[0];
        const offerProduct = context.offerProducts?.[0];

        if (!triggerProduct || !offerProduct) return {};

        return {
          name: `Cart Upsell: ${triggerProduct.title}`,
          contentConfig: {
            headline: "Don't forget this!",
            subheadline: `Add ${offerProduct.title} to your order.`,
            // Use existing schema fields instead of mappingRules
            productSelectionMethod: "manual" as const,
            selectedProducts: [offerProduct.id],
          },
        };
      },
    },
    {
      id: "post-add-upsell",
      name: "Post-Add Upsell",
      description: "Offer a relevant upsell immediately after a customer adds a product to cart.",
      allowedTemplateNames: ["Post-Add Upsell"],
      inputs: [
        {
          type: "product_picker",
          label: "When adding these products (Trigger)",
          key: "triggerProducts",
          multiSelect: true,
        },
        {
          type: "product_picker",
          label: "Recommend these products (Upsell)",
          key: "offerProducts",
          multiSelect: true,
        },
        {
          type: "discount_percentage",
          label: "Discount Percentage",
          defaultValue: 10,
          key: "discountValue",
        },
      ],
      build: (context) => {
        const discountValue = getNumberFromContext(context.discountValue, 10);
        const triggerProducts = context.triggerProducts || [];
        const offerProducts = context.offerProducts || [];

        if (triggerProducts.length === 0 || offerProducts.length === 0) return {};

        const triggerProductIds = triggerProducts.map((p) => p.id);
        const offerProductIds = offerProducts.map((p) => p.id);
        const triggerNames = triggerProducts.map((p) => p.title).join(", ");
        const offerNames = offerProducts.map((p) => p.title).join(", ");

        return {
          name: `Post-Add: ${triggerProducts[0].title}${triggerProducts.length > 1 ? ` +${triggerProducts.length - 1} more` : ""}`,
          contentConfig: {
            headline: "Great choice!",
            subheadline:
              triggerProducts.length === 1 && offerProducts.length === 1
                ? `Customers who bought ${triggerNames} also loved ${offerNames}`
                : `Complete your order with these recommended products`,
            bundleDiscount: discountValue,
            // Use existing schema fields instead of mappingRules
            productSelectionMethod: "manual" as const,
            selectedProducts: offerProductIds,
          },
          targetRules: {
            enhancedTriggers: {
              add_to_cart: {
                enabled: true,
                productIds: triggerProductIds,
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
              productIds: offerProductIds,
            },
            showInPreview: true,
            behavior: "SHOW_CODE_AND_AUTO_APPLY",
          },
        };
      },
    },
  ],
  CART_ABANDONMENT: [
    {
      id: "cart-recovery",
      name: "Cart Recovery",
      description: "Recover abandoned carts with a timely reminder.",
      inputs: [
        {
          type: "discount_percentage",
          label: "Recovery Discount",
          defaultValue: 10,
          key: "discountValue",
        },
      ],
      build: (context) => {
        const discountValue = getNumberFromContext(context.discountValue, 10);
        return {
          name: "Cart Recovery",
          contentConfig: {
            headline: "You left something behind!",
            subheadline: "Complete your order now and save.",
            discountPercentage: discountValue,
          },
          discountConfig: {
            enabled: true,
            type: "single_use",
            valueType: "PERCENTAGE",
            value: discountValue,
            applicability: {
              scope: "all",
            },
            showInPreview: true,
            behavior: "SHOW_CODE_AND_AUTO_APPLY",
          },
        };
      },
    },
  ],
  FREE_SHIPPING: [
    {
      id: "shipping-threshold",
      name: "Free Shipping Bar",
      description: "Motivate customers to reach a free shipping threshold.",
      inputs: [
        {
          type: "currency_amount",
          label: "Free Shipping Threshold",
          defaultValue: 50,
          key: "threshold",
        },
      ],
      build: (context) => {
        const threshold = getNumberFromContext(context.threshold, 50);
        return {
          name: "Free Shipping Goal",
          contentConfig: {
            threshold,
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
  ],
  NEWSLETTER: [
    {
      id: "welcome-offer",
      name: "Welcome Offer",
      description: "Collect emails with a first-order discount.",
      inputs: [
        {
          type: "discount_percentage",
          label: "Discount Percentage",
          defaultValue: 10,
          key: "discountValue",
        },
      ],
      build: (context) => {
        const discountValue = getNumberFromContext(context.discountValue, 10);
        return {
          name: "Welcome Newsletter",
          contentConfig: {
            headline: `Get ${discountValue}% Off Your First Order`,
            subheadline: "Subscribe to our newsletter and get exclusive offers.",
            buttonText: "Subscribe",
            emailPlaceholder: "Enter your email",
            discountPercentage: discountValue,
          },
          discountConfig: {
            enabled: true,
            type: "single_use",
            valueType: "PERCENTAGE",
            value: discountValue,
            applicability: {
              scope: "all",
            },
            showInPreview: true,
            behavior: "SHOW_CODE_AND_AUTO_APPLY",
          },
        };
      },
    },
  ],
  ANNOUNCEMENT: [
    {
      id: "exit-recovery",
      name: "Exit Recovery",
      description: "Catch visitors before they leave with a special offer.",
      inputs: [
        {
          type: "discount_percentage",
          label: "Discount Percentage",
          defaultValue: 15,
          key: "discountValue",
        },
      ],
      build: (context) => {
        const discountValue = getNumberFromContext(context.discountValue, 15);
        return {
          name: "Exit Intent Recovery",
          contentConfig: {
            headline: "Wait! Don't go yet!",
            subheadline: `Here is ${discountValue}% OFF to complete your purchase.`,
            buttonText: "Claim Offer",
            discountPercentage: discountValue,
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
            applicability: {
              scope: "all",
            },
            showInPreview: true,
            behavior: "SHOW_CODE_AND_AUTO_APPLY",
          },
        };
      },
    },
  ],
};
