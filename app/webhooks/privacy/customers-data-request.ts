/**
 * Handler for customers/data_request webhook
 * 
 * Compiles all customer data stored by the app for GDPR compliance.
 * This webhook is triggered when a customer requests their data.
 */

import prisma from "~/db.server";
import type { CustomersDataRequestPayload, CustomerDataExport } from "./types";

export async function handleCustomersDataRequest(
  shop: string,
  payload: CustomersDataRequestPayload
): Promise<CustomerDataExport> {
  console.log(`[Privacy Webhook] Processing customers/data_request for ${shop}`, {
    customerId: payload.customer.id,
    customerEmail: payload.customer.email,
    dataRequestId: payload.data_request.id,
  });

  // Find the store
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shop },
    select: { id: true },
  });

  if (!store) {
    console.warn(`[Privacy Webhook] Store not found for ${shop}, returning empty data`);
    return createEmptyDataExport(payload.customer);
  }

  // Gather all customer data
  const [leads, conversions, events] = await Promise.all([
    // Find leads by customer ID or email
    prisma.lead.findMany({
      where: {
        storeId: store.id,
        OR: [
          { shopifyCustomerId: BigInt(payload.customer.id) },
          { email: payload.customer.email },
        ],
      },
      include: {
        campaign: {
          select: { name: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),

    // Find conversions by customer ID
    prisma.campaignConversion.findMany({
      where: {
        customerId: String(payload.customer.id),
        campaign: {
          storeId: store.id,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Find popup events linked to leads or with matching visitor data
    prisma.popupEvent.findMany({
      where: {
        storeId: store.id,
        lead: {
          OR: [
            { shopifyCustomerId: BigInt(payload.customer.id) },
            { email: payload.customer.email },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to prevent excessive data
    }),
  ]);

  console.log(`[Privacy Webhook] Found customer data:`, {
    leads: leads.length,
    conversions: conversions.length,
    events: events.length,
  });

  // Compile the data export
  const dataExport: CustomerDataExport = {
    customer: payload.customer,
    leads: leads.map((lead) => ({
      id: lead.id,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      campaignId: lead.campaignId,
      campaignName: lead.campaign.name,
      discountCode: lead.discountCode,
      submittedAt: lead.submittedAt,
      marketingConsent: lead.marketingConsent,
    })),
    conversions: conversions.map((conv) => ({
      id: conv.id,
      orderId: conv.orderId,
      orderNumber: conv.orderNumber,
      totalPrice: conv.totalPrice.toString(),
      discountAmount: conv.discountAmount.toString(),
      discountCodes: conv.discountCodes,
      createdAt: conv.createdAt,
    })),
    events: events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      campaignId: event.campaignId,
      pageUrl: event.pageUrl,
      createdAt: event.createdAt,
    })),
  };

  return dataExport;
}

function createEmptyDataExport(customer: CustomersDataRequestPayload['customer']): CustomerDataExport {
  return {
    customer,
    leads: [],
    conversions: [],
    events: [],
  };
}

