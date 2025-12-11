/**
 * Webhook route for shop/redact
 *
 * Handles shop data deletion after app uninstallation.
 * Shopify sends this webhook 48 hours after a shop uninstalls the app.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { handleShopRedact } from "~/webhooks/privacy/shop-redact";
import type { ShopRedactPayload } from "~/webhooks/privacy/types";
import { logger } from "~/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook request (validates HMAC signature)
    const { shop, payload, topic } = await authenticate.webhook(request);

    logger.info({ topic, shop }, "[Webhook Route] Received webhook");

    if (topic !== "SHOP_REDACT") {
      logger.error({ topic }, "[Webhook Route] Unexpected topic");
      return new Response("Invalid topic", { status: 400 });
    }

    // Process the shop redaction request
    await handleShopRedact(shop, payload as ShopRedactPayload);

    logger.info({ shop }, "[Webhook Route] Successfully processed shop/redact");

    // Return success response (200 OK)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error({ error }, "[Webhook Route] Error processing shop/redact");

    // Return 500 to signal Shopify to retry
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
