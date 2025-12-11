import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { logger } from "~/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, session, topic } = await authenticate.webhook(request);

    logger.info({ topic, shop }, "[Webhook] Received webhook");

    // Webhook requests can trigger multiple times and after an app has already been uninstalled.
    // If this webhook already ran, the session may have been deleted previously.
    if (session) {
      // Delete sessions for this shop
      const deletedSessions = await db.session.deleteMany({ where: { shop } });
      logger.info({ count: deletedSessions.count, shop }, "[Webhook] Deleted sessions");

      // Deactivate the store (but keep data for GDPR shop/redact which comes 48hrs later)
      const deactivatedStore = await db.store.updateMany({
        where: { shopifyDomain: shop },
        data: {
          isActive: false,
          // Clear subscription info on uninstall
          planTier: "FREE",
          planStatus: "CANCELLED",
          shopifySubscriptionId: null,
          shopifySubscriptionStatus: null,
          shopifySubscriptionName: null,
        },
      });
      logger.info({ count: deactivatedStore.count, shop }, "[Webhook] Deactivated store(s)");
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    logger.error({ error }, "[Webhook] Error processing app/uninstalled");

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
