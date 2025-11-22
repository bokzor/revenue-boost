/**
 * Webhook route for customers/data_request
 * 
 * Handles GDPR data access requests from customers.
 * Shopify sends this webhook when a customer requests their data.
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { handleCustomersDataRequest } from "~/webhooks/privacy/customers-data-request";
import type { CustomersDataRequestPayload } from "~/webhooks/privacy/types";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the webhook request (validates HMAC signature)
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`[Webhook Route] Received ${topic} for ${shop}`);

    if (topic !== "CUSTOMERS_DATA_REQUEST") {
      console.error(`[Webhook Route] Unexpected topic: ${topic}`);
      return new Response("Invalid topic", { status: 400 });
    }

    // Process the data request
    const customerData = await handleCustomersDataRequest(
      shop,
      payload as CustomersDataRequestPayload
    );

    // Log the data export (in production, this would be sent to the merchant or stored)
    console.log(`[Webhook Route] Customer data compiled:`, {
      customerId: customerData.customer.id,
      leadsCount: customerData.leads.length,
      conversionsCount: customerData.conversions.length,
      eventsCount: customerData.events.length,
    });

    // Return success response
    // Note: In a production system, you might want to:
    // 1. Store this data export in a secure location
    // 2. Notify the merchant that a data request was received
    // 3. Provide a way for the merchant to download the data
    return new Response(JSON.stringify({ success: true, data: customerData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Webhook Route] Error processing customers/data_request:", error);
    
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

