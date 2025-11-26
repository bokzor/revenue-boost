import "@shopify/shopify-app-react-router/adapters/node";
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
      trialDays: 7,
    },
    [BILLING_PLANS.GROWTH]: {
      lineItems: [
        {
          amount: 29,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: 7,
    },
    [BILLING_PLANS.PRO]: {
      lineItems: [
        {
          amount: 79,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: 7,
    },
    [BILLING_PLANS.ENTERPRISE]: {
      lineItems: [
        {
          amount: 149,
          currencyCode: "USD",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: 7,
    },
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
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
