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
import { logger } from "~/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook request (validates HMAC signature)
    const { shop, payload, topic } = await authenticate.webhook(request);

    logger.info({ topic, shop }, "[Webhook Route] Received webhook");

    if (topic !== "CUSTOMERS_REDACT") {
      logger.error({ topic }, "[Webhook Route] Unexpected topic");
      return new Response("Invalid topic", { status: 400 });
    }

    // Process the redaction request
    await handleCustomersRedact(shop, payload as CustomersRedactPayload);

    logger.info({ shop }, "[Webhook Route] Successfully processed customers/redact");

    // Return success response (200 OK)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error({ error }, "[Webhook Route] Error processing customers/redact");

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
