import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { TemplateType } from "~/domains/campaigns/types/campaign";

export interface RecipeDefinition {
    id: string;
    name: string;
    description: string;
    inputs: RecipeInput[];
    build: (context: RecipeContext) => Partial<CampaignFormData>;
}

export type RecipeInput =
    | { type: "product_picker"; label: string; key: "products" }
    | { type: "collection_picker"; label: string; key: "collections" }
    | { type: "discount_percentage"; label: string; defaultValue: number; key: "discountValue" };

export interface RecipeContext {
    products?: any[]; // Shopify product objects
    collections?: any[]; // Shopify collection objects
    discountValue?: number;
}

export const RECIPE_CATALOG: Partial<Record<TemplateType, RecipeDefinition[]>> = {
    FLASH_SALE: [
        {
            id: "product-spotlight",
            name: "Product Spotlight",
            description: "Promote a single hero product with a dedicated image and discount.",
            inputs: [
                { type: "product_picker", label: "Select Product", key: "products" },
                { type: "discount_percentage", label: "Discount Percentage", defaultValue: 20, key: "discountValue" }
            ],
            build: (context) => {
                const product = context.products?.[0];
                if (!product) return {};

                return {
                    name: `Flash Sale - ${product.title}`,
                    contentConfig: {
                        headline: `${context.discountValue}% OFF ${product.title}`,
                        subheadline: "Limited time offer on our best-seller.",
                        imageUrl: product.images?.[0]?.originalSrc || "",
                        buttonText: "Shop Now",
                        ctaUrl: `/products/${product.handle}`,
                        discountPercentage: context.discountValue,
                    },
                    pageTargeting: {
                        enabled: true,
                        pages: [],
                        customPatterns: [`/products/${product.handle}`],
                        excludePages: [],
                        productTags: [],
                        collections: []
                    },
                    discountConfig: {
                        enabled: true,
                        type: "single_use",
                        valueType: "PERCENTAGE",
                        value: context.discountValue,
                        applicability: {
                            scope: "products",
                            productIds: [product.id]
                        },
                        showInPreview: true,
                        autoApplyMode: "none",
                        codePresentation: "show_code"
                    }
                };
            }
        },
        {
            id: "collection-sale",
            name: "Collection Sale",
            description: "Run a sale on a specific collection.",
            inputs: [
                { type: "collection_picker", label: "Select Collection", key: "collections" },
                { type: "discount_percentage", label: "Discount Percentage", defaultValue: 15, key: "discountValue" }
            ],
            build: (context) => {
                const collection = context.collections?.[0];
                if (!collection) return {};

                return {
                    name: `Sale - ${collection.title}`,
                    contentConfig: {
                        headline: `${context.discountValue}% OFF ${collection.title}`,
                        subheadline: "Shop our exclusive collection.",
                        imageUrl: collection.image?.originalSrc || "",
                        buttonText: "View Collection",
                        ctaUrl: `/collections/${collection.handle}`,
                        discountPercentage: context.discountValue,
                    },
                    pageTargeting: {
                        enabled: true,
                        pages: [],
                        customPatterns: [`/collections/${collection.handle}`],
                        excludePages: [],
                        productTags: [],
                        collections: []
                    },
                    discountConfig: {
                        enabled: true,
                        type: "single_use",
                        valueType: "PERCENTAGE",
                        value: context.discountValue,
                        applicability: {
                            scope: "collections",
                            collectionIds: [collection.id]
                        },
                        showInPreview: true,
                        autoApplyMode: "none",
                        codePresentation: "show_code"
                    }
                };
            }
        }
    ],
    PRODUCT_UPSELL: [
        {
            id: "cart-cross-sell",
            name: "Cart Cross-Sell",
            description: "Suggest complementary items on the cart page.",
            inputs: [
                { type: "product_picker", label: "Select Upsell Product", key: "products" }
            ],
            build: (context) => {
                const product = context.products?.[0];
                if (!product) return {};

                return {
                    name: `Cart Upsell - ${product.title}`,
                    contentConfig: {
                        headline: "Don't forget this!",
                        subheadline: `Add ${product.title} to your order.`,
                        selectedProducts: [product.id],
                        productSelectionMethod: "manual"
                    },
                    pageTargeting: {
                        enabled: true,
                        pages: ["cart"],
                        customPatterns: [],
                        excludePages: [],
                        productTags: [],
                        collections: []
                    }
                };
            }
        }
    ],
    NEWSLETTER: [
        {
            id: "welcome-offer",
            name: "Welcome Offer",
            description: "Collect emails with a first-order discount.",
            inputs: [
                { type: "discount_percentage", label: "Discount Percentage", defaultValue: 10, key: "discountValue" }
            ],
            build: (context) => {
                return {
                    name: "Welcome Newsletter",
                    contentConfig: {
                        headline: `Get ${context.discountValue}% Off Your First Order`,
                        subheadline: "Subscribe to our newsletter and get exclusive offers.",
                        buttonText: "Subscribe",
                        emailPlaceholder: "Enter your email",
                        discountPercentage: context.discountValue,
                    },
                    discountConfig: {
                        enabled: true,
                        type: "single_use",
                        valueType: "PERCENTAGE",
                        value: context.discountValue,
                        applicability: {
                            scope: "all",
                        },
                        showInPreview: true,
                        autoApplyMode: "ajax",
                        deliveryMode: "show_code_fallback",
                        codePresentation: "show_code"
                    }
                };
            }
        }
    ],
    EXIT_INTENT: [
        {
            id: "exit-recovery",
            name: "Exit Recovery",
            description: "Catch visitors before they leave with a special offer.",
            inputs: [
                { type: "discount_percentage", label: "Discount Percentage", defaultValue: 15, key: "discountValue" }
            ],
            build: (context) => {
                return {
                    name: "Exit Intent Recovery",
                    contentConfig: {
                        headline: "Wait! Don't go yet!",
                        subheadline: `Here is ${context.discountValue}% OFF to complete your purchase.`,
                        buttonText: "Claim Offer",
                        discountPercentage: context.discountValue,
                    },
                    discountConfig: {
                        enabled: true,
                        type: "single_use",
                        valueType: "PERCENTAGE",
                        value: context.discountValue,
                        applicability: {
                            scope: "all",
                        },
                        showInPreview: true,
                        autoApplyMode: "ajax",
                        deliveryMode: "show_code_fallback",
                        codePresentation: "show_code"
                    }
                };
            }
        }
    ]
};
