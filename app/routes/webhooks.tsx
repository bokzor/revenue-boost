/**
 * Unified Webhook route for GDPR/Privacy compliance webhooks
 *
 * This handles all three mandatory compliance webhooks:
 * - customers/data_request: When a customer requests their data
 * - customers/redact: When a customer requests data deletion
 * - shop/redact: When a shop uninstalls and data must be deleted
 *
 * These are registered in shopify.app.toml as compliance_topics pointing to /webhooks
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { handleCustomersDataRequest } from "~/webhooks/privacy/customers-data-request";
import { handleCustomersRedact } from "~/webhooks/privacy/customers-redact";
import { handleShopRedact } from "~/webhooks/privacy/shop-redact";
import type {
  CustomersDataRequestPayload,
  CustomersRedactPayload,
  ShopRedactPayload,
} from "~/webhooks/privacy/types";
import { logger } from "~/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook request (validates HMAC signature)
    const { shop, payload, topic } = await authenticate.webhook(request);

    logger.info({ topic, shop }, "[Webhook Route] Received webhook");

    switch (topic) {
      case "CUSTOMERS_DATA_REQUEST": {
        const customerData = await handleCustomersDataRequest(
          shop,
          payload as CustomersDataRequestPayload
        );
        logger.info({ shop }, "[Webhook Route] Customer data compiled");
        return new Response(JSON.stringify({ success: true, data: customerData }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "CUSTOMERS_REDACT": {
        await handleCustomersRedact(shop, payload as CustomersRedactPayload);
        logger.info({ shop }, "[Webhook Route] Customer data redacted");
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "SHOP_REDACT": {
        await handleShopRedact(shop, payload as ShopRedactPayload);
        logger.info({ shop }, "[Webhook Route] Shop data redacted");
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
        logger.warn({ topic }, "[Webhook Route] Unhandled topic");
        return new Response(JSON.stringify({ error: "Unhandled topic" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    logger.error({ error }, "[Webhook Route] Error processing webhook");

    // Check if this is an authentication/HMAC validation error
    // Shopify expects 401 for invalid HMAC, not 500
    const isAuthError =
      error instanceof Response ||
      (error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("Unauthorized") ||
          error.message.includes("HMAC")));

    if (isAuthError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Invalid HMAC signature",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return 500 for other errors to signal Shopify to retry
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

