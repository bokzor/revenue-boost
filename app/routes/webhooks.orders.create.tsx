import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { handleOrderCreate } from "~/webhooks/orders.create";
import type { OrderPayload } from "~/webhooks/orders.create";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, topic } = await authenticate.webhook(request);

  console.log(`[Webhook Route] Received ${topic} for ${shop}`);

  if (topic === "ORDERS_CREATE") {
    await handleOrderCreate(shop, payload as OrderPayload);
  }

  return new Response();
};
