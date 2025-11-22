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

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook request (validates HMAC signature)
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`[Webhook Route] Received ${topic} for ${shop}`);

    if (topic !== "SHOP_REDACT") {
      console.error(`[Webhook Route] Unexpected topic: ${topic}`);
      return new Response("Invalid topic", { status: 400 });
    }

    // Process the shop redaction request
    await handleShopRedact(shop, payload as ShopRedactPayload);

    console.log(`[Webhook Route] Successfully processed shop/redact for ${shop}`);

    // Return success response (200 OK)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook Route] Error processing shop/redact:", error);
    
    // Return 500 to signal Shopify to retry
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

