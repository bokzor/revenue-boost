import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { handleOrderCreate } from "~/webhooks/orders.create";
import type { OrderPayload } from "~/webhooks/orders.create";
import { logger } from "~/lib/logger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  logger.info({ topic, shop }, "[Webhook Route] Received webhook");

  if (topic === "ORDERS_CREATE") {
    await handleOrderCreate(shop, payload as OrderPayload);
  }

  return new Response();
};
