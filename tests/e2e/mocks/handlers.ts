/**
 * MSW Handlers for E2E Testing
 *
 * These handlers intercept network requests during E2E tests to mock:
 * 1. Shopify Admin API (GraphQL)
 * 2. App internal APIs
 * 3. Authentication endpoints
 */

import { http, HttpResponse, graphql } from "msw";

// =============================================================================
// MOCK DATA
// =============================================================================

export const MOCK_STORE = {
  id: "test-store-id",
  shopifyDomain: "test-store.myshopify.com",
  name: "Test Store",
  email: "test@example.com",
  plan: "development",
};

export const MOCK_RECIPES = [
  {
    id: "recipe-newsletter",
    name: "🎁 Welcome Discount",
    description: "10% off for new subscribers",
    goal: "NEWSLETTER_SIGNUP",
    templateType: "NEWSLETTER",
    previewImageUrl: "/images/recipes/newsletter.png",
    contentConfig: {
      headline: "Get 10% Off Your First Order",
      subheadline: "Join our newsletter and save!",
      buttonText: "Subscribe",
      emailPlaceholder: "Enter your email",
      successMessage: "Thanks for subscribing!",
    },
    designConfig: {
      layout: "CENTERED",
      theme: "LIGHT",
      primaryColor: "#000000",
      backgroundColor: "#FFFFFF",
    },
  },
  {
    id: "recipe-spin-to-win",
    name: "🎡 Spin to Win",
    description: "Gamified email capture",
    goal: "NEWSLETTER_SIGNUP",
    templateType: "SPIN_TO_WIN",
    previewImageUrl: "/images/recipes/spin-to-win.png",
    contentConfig: {
      headline: "Spin & Win!",
      buttonText: "Spin Now",
      wheelSegments: [
        { label: "10% Off", value: "10", probability: 30, color: "#FF6B6B" },
        { label: "Free Shipping", value: "FREE_SHIP", probability: 20, color: "#4ECDC4" },
        { label: "Try Again", value: "NONE", probability: 50, color: "#95E1D3" },
      ],
    },
    designConfig: {
      layout: "CENTERED",
      theme: "DARK",
      primaryColor: "#FF6B6B",
      backgroundColor: "#1A1A2E",
    },
  },
  {
    id: "recipe-flash-sale",
    name: "⚡ Flash Sale",
    description: "Limited time offers with countdown",
    goal: "INCREASE_REVENUE",
    templateType: "FLASH_SALE",
    previewImageUrl: "/images/recipes/flash-sale.png",
    contentConfig: {
      headline: "Flash Sale!",
      subheadline: "24 Hours Only",
      buttonText: "Shop Now",
      urgencyMessage: "Ends soon!",
      countdownDuration: 86400,
    },
    designConfig: {
      layout: "BANNER_TOP",
      theme: "DARK",
      primaryColor: "#FF4757",
      backgroundColor: "#2D3436",
    },
  },
];

export const MOCK_CAMPAIGNS: Array<{
  id: string;
  name: string;
  status: string;
  templateType: string;
  goal: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  createdAt: string;
}> = [];

// =============================================================================
// SHOPIFY GRAPHQL HANDLERS
// =============================================================================

const shopifyGraphQLHandler = graphql.link("https://*.myshopify.com/admin/api/*");

export const handlers = [
  // Mock Shopify Shop Query
  shopifyGraphQLHandler.query("GetShop", () => {
    return HttpResponse.json({
      data: {
        shop: {
          id: "gid://shopify/Shop/12345678",
          name: MOCK_STORE.name,
          email: MOCK_STORE.email,
          plan: { displayName: "Development" },
          primaryDomain: { url: `https://${MOCK_STORE.shopifyDomain}` },
        },
      },
    });
  }),

  // Mock Shopify Products Query
  shopifyGraphQLHandler.query("GetProducts", ({ variables }) => {
    const first = (variables as { first?: number })?.first || 10;
    return HttpResponse.json({
      data: {
        products: {
          edges: Array.from({ length: Math.min(first, 5) }, (_, i) => ({
            node: {
              id: `gid://shopify/Product/${i + 1}`,
              title: `Test Product ${i + 1}`,
              handle: `test-product-${i + 1}`,
              featuredImage: { url: `https://placekitten.com/200/200?image=${i}` },
              variants: {
                edges: [
                  {
                    node: {
                      id: `gid://shopify/ProductVariant/${i + 1}`,
                      price: "29.99",
                    },
                  },
                ],
              },
            },
          })),
          pageInfo: { hasNextPage: false },
        },
      },
    });
  }),

  // Mock Shopify Discount Create
  shopifyGraphQLHandler.mutation("discountCodeBasicCreate", () => {
    return HttpResponse.json({
      data: {
        discountCodeBasicCreate: {
          codeDiscountNode: {
            id: "gid://shopify/DiscountCodeNode/12345",
            codeDiscount: {
              codes: { edges: [{ node: { code: "TESTCODE10" } }] },
            },
          },
          userErrors: [],
        },
      },
    });
  }),

  // =============================================================================
  // APP INTERNAL API HANDLERS
  // =============================================================================

  // Get recipes/templates
  http.get("*/api/templates", () => {
    return HttpResponse.json({
      success: true,
      data: { templates: MOCK_RECIPES },
    });
  }),

  // Get campaigns
  http.get("*/api/campaigns", () => {
    return HttpResponse.json({
      success: true,
      data: { campaigns: MOCK_CAMPAIGNS },
    });
  }),

  // Create campaign
  http.post("*/api/campaigns", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      name: body.name || "New Campaign",
      status: body.status || "DRAFT",
      templateType: body.templateType,
      goal: body.goal,
      impressions: 0,
      conversions: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString(),
      ...body,
    };
    MOCK_CAMPAIGNS.push(newCampaign);
    return HttpResponse.json({
      success: true,
      data: { campaign: newCampaign },
    });
  }),

  // Dashboard metrics
  http.get("*/api/dashboard/metrics", () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalImpressions: 1000,
        totalConversions: 50,
        conversionRate: 5.0,
        activeCampaigns: MOCK_CAMPAIGNS.filter((c) => c.status === "ACTIVE").length,
      },
    });
  }),

  // Dashboard campaigns
  http.get("*/api/dashboard/campaigns", () => {
    return HttpResponse.json({
      success: true,
      data: { campaigns: MOCK_CAMPAIGNS.slice(0, 5) },
    });
  }),
];

