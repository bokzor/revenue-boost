import { logger } from "~/lib/logger.server";
import "@shopify/shopify-app-react-router/adapters/node";
import { logger } from "~/lib/logger.server";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { validateEnv } from "./lib/env.server";

// Validate environment variables at startup
const env = validateEnv();

// =============================================================================
// TEST MODE CONFIGURATION
// =============================================================================
// When TEST_MODE=true, bypass Shopify authentication and return a mock session.
// This enables E2E testing without requiring Shopify admin login.
// WARNING: Never enable in production!
// =============================================================================

const TEST_MODE = env.TEST_MODE === true;
const TEST_SHOP_DOMAIN = env.TEST_SHOP_DOMAIN || "revenue-boost-staging.myshopify.com";

if (TEST_MODE) {
  logger.warn("⚠️  TEST_MODE is enabled - Shopify authentication is bypassed!");
  logger.warn("⚠️  Using test shop: ${TEST_SHOP_DOMAIN}");
}

// =============================================================================
// BILLING CONFIGURATION
// =============================================================================
// Plan names must match the keys used in billing.require() and billing.request()
// These correspond to PlanTier values (excluding FREE which has no billing)

export const BILLING_PLANS = {
  STARTER: "Starter",
  GROWTH: "Growth",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
} as const;

const shopify = shopifyApp({
  apiKey: env.SHOPIFY_API_KEY,
  apiSecretKey: env.SHOPIFY_API_SECRET,
  apiVersion: ApiVersion.October25,
  scopes: env.SCOPES.split(","),
  appUrl: env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  billing: {
    [BILLING_PLANS.STARTER]: {
      lineItems: [
        {
          amount: 9,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: 14,
    },
    [BILLING_PLANS.GROWTH]: {
      lineItems: [
        {
          amount: 29,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: 14,
    },
    [BILLING_PLANS.PRO]: {
      lineItems: [
        {
          amount: 79,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: 14,
    },
    // Enterprise plan disabled for launch - can be re-enabled later
    // [BILLING_PLANS.ENTERPRISE]: {
    //   lineItems: [
    //     {
    //       amount: 149,
    //       currencyCode: "USD",
    //       interval: BillingInterval.Every30Days,
    //     },
    //   ],
    //   trialDays: 14,
    // },
  },
  webhooks: {
    ORDERS_CREATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/orders/create",
    },
    APP_SUBSCRIPTIONS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/subscriptions/update",
    },
  },
  ...(env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [env.SHOP_CUSTOM_DOMAIN] } : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

// =============================================================================
// AUTHENTICATION EXPORT
// =============================================================================
// In TEST_MODE, wrap authenticate to return mock session for admin requests.
// This allows E2E tests to run without Shopify login.
// =============================================================================

/**
 * Mock session for E2E testing
 */
const mockSession = {
  id: `offline_${TEST_SHOP_DOMAIN}`,
  shop: TEST_SHOP_DOMAIN,
  state: "active",
  isOnline: false,
  scope: env.SCOPES,
  accessToken: "test-access-token-for-e2e",
  expires: null,
};

/**
 * Mock admin API context for E2E testing
 * Provides a graphql function that returns mock responses
 * NOTE: Uses 'any' cast intentionally - this is only used in TEST_MODE
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMockAdminContext(): any {
  return {
    graphql: async (query: string, _options?: { variables?: Record<string, unknown> }) => {
      // Return mock responses for common queries
      const mockResponses: Record<string, unknown> = {
        shop: {
          data: {
            shop: {
              id: "gid://shopify/Shop/12345678",
              name: "Test Store",
              email: "test@example.com",
              currencyCode: "USD",
              plan: { displayName: "Development" },
              primaryDomain: { url: `https://${TEST_SHOP_DOMAIN}` },
            },
          },
        },
      };

      // Check if query contains known patterns
      if (typeof query === "string" && query.includes("shop")) {
        return {
          json: async () => mockResponses.shop,
        };
      }

      // Default empty response
      return {
        json: async () => ({ data: {} }),
      };
    },
    rest: {
      get: async () => ({ json: async () => ({}) }),
      post: async () => ({ json: async () => ({}) }),
      put: async () => ({ json: async () => ({}) }),
      delete: async () => ({ json: async () => ({}) }),
    },
  };
}

/**
 * Create mock authenticate object for TEST_MODE
 */
function createMockAuthenticate() {
  const mockAdminAuth = async (_request: Request) => {
    logger.debug("[TEST_MODE] Returning mock session for admin auth");
    return {
      admin: createMockAdminContext(),
      session: mockSession,
      billing: {
        require: async () => ({ hasActivePayment: true, oneTimePurchases: [] }),
        check: async () => ({ hasActivePayment: true, oneTimePurchases: [] }),
        request: async () => ({ confirmationUrl: null, oneTimePurchases: [] }),
        cancel: async () => ({ success: true }),
      },
      cors: (_response: Response) => _response,
    };
  };

  return {
    admin: mockAdminAuth,
    public: {
      appProxy: async (_request: Request) => ({
        admin: createMockAdminContext(),
        session: mockSession,
      }),
      checkout: async (_request: Request) => ({
        session: mockSession,
      }),
    },
    webhook: shopify.authenticate.webhook, // Use real webhook auth
  };
}

// Export the appropriate authenticate based on TEST_MODE
export const authenticate = TEST_MODE ? createMockAuthenticate() : shopify.authenticate;
