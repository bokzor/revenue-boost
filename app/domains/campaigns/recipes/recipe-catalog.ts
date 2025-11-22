import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { TemplateType } from "~/domains/campaigns/types/campaign";

export interface RecipeDefinition {
    id: string;
    name: string;
    description: string;
    allowedTemplateNames?: string[];
    inputs: RecipeInput[];
    build: (context: RecipeContext) => Partial<CampaignFormData>;
}

export type RecipeInput =
    | { type: "product_picker"; label: string; key: string }
    | { type: "collection_picker"; label: string; key: string }
    | { type: "discount_percentage"; label: string; defaultValue: number; key: string }
    | { type: "currency_amount"; label: string; defaultValue: number; key: string };

export interface RecipeContext {
    [key: string]: any;
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
                        customPatterns: [],
                        excludePages: [],
                        productTags: [],
                        collections: []
                    },
                    targetRules: {
                        enhancedTriggers: {
                            page_load: { enabled: false },
                            product_view: {
                                enabled: true,
                                product_ids: [product.id],
                                time_on_page: 3
                            }
                        }
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
                        customPatterns: [],
                        excludePages: [],
                        productTags: [],
                        collections: [collection.id]
                    },
                    targetRules: {
                        enhancedTriggers: {
                            page_load: { enabled: true, delay: 3000 }
                        }
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
            id: "product-spotlight-upsell",
            name: "Product Spotlight",
            description: "Showcase a specific product to drive discovery.",
            allowedTemplateNames: ["Product Spotlight"],
            inputs: [
                { type: "product_picker", label: "Select Product to Highlight", key: "products" },
                { type: "discount_percentage", label: "Discount Percentage", defaultValue: 10, key: "discountValue" }
            ],
            build: (context) => {
                const product = context.products?.[0];
                if (!product) return {};

                return {
                    name: `Spotlight: ${product.title}`,
                    contentConfig: {
                        headline: "Have you seen this?",
                        subheadline: `Check out our popular ${product.title}`,
                        buttonText: "View Product",
                        bundleDiscount: context.discountValue,
                        mappingRules: [
                            {
                                id: `rule_spotlight_${product.id}`,
                                priority: 10,
                                trigger: {
                                    type: "all"
                                },
                                recommendation: {
                                    mode: "manual",
                                    products: [product.id]
                                }
                            }
                        ]
                    },
                    pageTargeting: {
                        enabled: true,
                        pages: ["home"],
                        customPatterns: [],
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
                        autoApplyMode: "ajax",
                        codePresentation: "hide_code"
                    }
                };
            }
        },
        {
            id: "product-page-upsell",
            name: "Specific Product Cross-Sell",
            description: "Recommend a specific product when a customer views another product.",
            allowedTemplateNames: ["Product Page Cross-Sell"],
            inputs: [
                { type: "product_picker", label: "When viewing this product (Trigger)", key: "triggerProducts" },
                { type: "product_picker", label: "Recommend this product (Upsell)", key: "offerProducts" },
                { type: "discount_percentage", label: "Bundle Discount", defaultValue: 15, key: "discountValue" }
            ],
            build: (context) => {
                const triggerProduct = context.triggerProducts?.[0];
                const offerProduct = context.offerProducts?.[0];

                if (!triggerProduct || !offerProduct) return {};

                return {
                    name: `Cross-Sell: ${triggerProduct.title} -> ${offerProduct.title}`,
                    contentConfig: {
                        headline: "Perfect together",
                        subheadline: `Add ${offerProduct.title} to complete your set.`,
                        buttonText: "Add to Cart",
                        bundleDiscount: context.discountValue,
                        mappingRules: [
                            {
                                id: `rule_${triggerProduct.id}_${offerProduct.id}`,
                                priority: 10,
                                trigger: {
                                    type: "product_view",
                                    values: [triggerProduct.id]
                                },
                                recommendation: {
                                    mode: "manual",
                                    products: [offerProduct.id]
                                }
                            },
                            {
                                id: "default_ai",
                                priority: 0,
                                trigger: { type: "all" },
                                recommendation: { mode: "ai" }
                            }
                        ]
                    },
                    pageTargeting: {
                        enabled: true,
                        pages: [],
                        customPatterns: [`/products/${triggerProduct.handle}`],
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
                            productIds: [offerProduct.id]
                        },
                        showInPreview: true,
                        autoApplyMode: "ajax",
                        codePresentation: "hide_code"
                    }
                };
            }
        },
        {
            id: "cart-cross-sell",
            name: "Cart Cross-Sell",
            description: "Suggest complementary items when specific items are in the cart.",
            allowedTemplateNames: ["Cart Upsell"],
            inputs: [
                { type: "product_picker", label: "When cart contains (Trigger)", key: "triggerProducts" },
                { type: "product_picker", label: "Recommend (Upsell)", key: "offerProducts" }
            ],
            build: (context) => {
                const triggerProduct = context.triggerProducts?.[0];
                const offerProduct = context.offerProducts?.[0];

                if (!triggerProduct || !offerProduct) return {};

                return {
                    name: `Cart Upsell: ${triggerProduct.title}`,
                    contentConfig: {
                        headline: "Don't forget this!",
                        subheadline: `Add ${offerProduct.title} to your order.`,
                        mappingRules: [
                            {
                                id: `rule_cart_${triggerProduct.id}`,
                                priority: 10,
                                trigger: {
                                    type: "product_in_cart",
                                    values: [triggerProduct.id]
                                },
                                recommendation: {
                                    mode: "manual",
                                    products: [offerProduct.id]
                                }
                            },
                             {
                                id: "default_ai",
                                priority: 0,
                                trigger: { type: "all" },
                                recommendation: { mode: "ai" }
                            }
                        ]
                    }
                };
            }
        },
        {
            id: "post-add-upsell",
            name: "Post-Add Upsell",
            description: "Offer a relevant upsell immediately after a customer adds a product to cart.",
            allowedTemplateNames: ["Post-Add Upsell"],
            inputs: [
                { type: "product_picker", label: "When adding this product (Trigger)", key: "triggerProducts" },
                { type: "product_picker", label: "Recommend this product (Upsell)", key: "offerProducts" },
                { type: "discount_percentage", label: "Discount Percentage", defaultValue: 10, key: "discountValue" }
            ],
            build: (context) => {
                const triggerProduct = context.triggerProducts?.[0];
                const offerProduct = context.offerProducts?.[0];

                if (!triggerProduct || !offerProduct) return {};

                return {
                    name: `Post-Add: ${triggerProduct.title}`,
                    contentConfig: {
                        headline: "Great choice!",
                        subheadline: `Customers who bought ${triggerProduct.title} also loved ${offerProduct.title}`,
                        bundleDiscount: context.discountValue,
                        mappingRules: [
                            {
                                id: `rule_add_${triggerProduct.id}`,
                                priority: 10,
                                trigger: {
                                    type: "product_added_to_cart",
                                    values: [triggerProduct.id]
                                },
                                recommendation: {
                                    mode: "manual",
                                    products: [offerProduct.id]
                                }
                            },
                            {
                                id: "default_ai",
                                priority: 0,
                                trigger: { type: "all" },
                                recommendation: { mode: "ai" }
                            }
                        ]
                    },
                    targetRules: {
                        enhancedTriggers: {
                            add_to_cart: {
                                enabled: true,
                                productIds: [triggerProduct.id]
                            }
                        }
                    },
                    discountConfig: {
                        enabled: true,
                        type: "single_use",
                        valueType: "PERCENTAGE",
                        value: context.discountValue,
                        applicability: {
                            scope: "products",
                            productIds: [offerProduct.id]
                        },
                        showInPreview: true,
                        autoApplyMode: "ajax",
                        codePresentation: "hide_code"
                    }
                };
            }
        }
    ],
    CART_ABANDONMENT: [
        {
            id: "cart-recovery",
            name: "Cart Recovery",
            description: "Recover abandoned carts with a timely reminder.",
            inputs: [
                { type: "discount_percentage", label: "Recovery Discount", defaultValue: 10, key: "discountValue" }
            ],
            build: (context) => {
                return {
                    name: "Cart Recovery",
                    contentConfig: {
                         headline: "You left something behind!",
                         subheadline: "Complete your order now and save.",
                         discountPercentage: context.discountValue
                    },
                    discountConfig: {
                        enabled: true,
                        type: "single_use",
                        valueType: "PERCENTAGE",
                        value: context.discountValue,
                        applicability: {
                            scope: "all"
                        },
                        showInPreview: true,
                        autoApplyMode: "ajax",
                        codePresentation: "show_code",
                        deliveryMode: "show_code_fallback"
                    }
                };
            }
        }
    ],
    FREE_SHIPPING: [
        {
            id: "shipping-threshold",
            name: "Free Shipping Bar",
            description: "Motivate customers to reach a free shipping threshold.",
            inputs: [
                { type: "currency_amount", label: "Free Shipping Threshold", defaultValue: 50, key: "threshold" }
            ],
            build: (context) => {
                return {
                    name: "Free Shipping Goal",
                    contentConfig: {
                        threshold: context.threshold
                    },
                    discountConfig: {
                        enabled: true,
                        valueType: "FREE_SHIPPING",
                        minimumAmount: context.threshold,
                        showInPreview: true,
                        autoApplyMode: "ajax",
                        codePresentation: "show_code",
                        deliveryMode: "auto_apply_only"
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
    ANNOUNCEMENT: [
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
                    targetRules: {
                        enhancedTriggers: {
                            exit_intent: { enabled: true, sensitivity: "medium" }
                        }
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
};
