/**
 * Type definitions for Shopify GDPR/Privacy Webhooks
 *
 * Based on Shopify's official webhook payload schemas:
 * https://shopify.dev/docs/apps/build/privacy-law-compliance
 */

/**
 * Payload for customers/data_request webhook
 * Shopify sends this when a customer requests their data
 */
export interface CustomersDataRequestPayload {
  shop_id: number;
  shop_domain: string;
  orders_requested: number[];
  customer: {
    id: number;
    email: string;
    phone: string | null;
  };
  data_request: {
    id: number;
  };
}

/**
 * Payload for customers/redact webhook
 * Shopify sends this when a customer's data must be deleted
 */
export interface CustomersRedactPayload {
  shop_id: number;
  shop_domain: string;
  customer: {
    id: number;
    email: string;
    phone: string | null;
  };
  orders_to_redact: number[];
}

/**
 * Payload for shop/redact webhook
 * Shopify sends this 48 hours after a shop uninstalls the app
 */
export interface ShopRedactPayload {
  shop_id: number;
  shop_domain: string;
}

/**
 * Compiled customer data for data_request response
 */
export interface CustomerDataExport {
  customer: {
    id: number;
    email: string;
    phone: string | null;
  };
  leads: Array<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    campaignId: string;
    campaignName: string;
    discountCode: string | null;
    submittedAt: Date;
    marketingConsent: boolean;
  }>;
  conversions: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    totalPrice: string;
    discountAmount: string;
    discountCodes: string[];
    createdAt: Date;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    campaignId: string;
    pageUrl: string | null;
    createdAt: Date;
  }>;
}
