/**
 * Webhook route for customers/redact
 * 
 * Handles GDPR data deletion requests for customers.
 * Shopify sends this webhook when a customer requests data deletion.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { handleCustomersRedact } from "~/webhooks/privacy/customers-redact";
import type { CustomersRedactPayload } from "~/webhooks/privacy/types";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook request (validates HMAC signature)
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`[Webhook Route] Received ${topic} for ${shop}`);

    if (topic !== "CUSTOMERS_REDACT") {
      console.error(`[Webhook Route] Unexpected topic: ${topic}`);
      return new Response("Invalid topic", { status: 400 });
    }

    // Process the redaction request
    await handleCustomersRedact(shop, payload as CustomersRedactPayload);

    console.log(`[Webhook Route] Successfully processed customers/redact for ${shop}`);

    // Return success response (200 OK)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook Route] Error processing customers/redact:", error);
    
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

