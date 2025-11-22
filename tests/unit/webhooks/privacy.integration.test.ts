/**
 * Integration Tests for Privacy Webhooks
 * 
 * Tests full webhook flow with real database operations (mocked Shopify auth)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ActionFunctionArgs } from 'react-router';
import { action as dataRequestAction } from '~/routes/webhooks.customers.data_request';
import { action as customersRedactAction } from '~/routes/webhooks.customers.redact';
import { action as shopRedactAction } from '~/routes/webhooks.shop.redact';
import prisma from '~/db.server';
import type {
  CustomersDataRequestPayload,
  CustomersRedactPayload,
  ShopRedactPayload,
} from '~/webhooks/privacy/types';

// Mock Shopify authentication
vi.mock('~/shopify.server', () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

import { authenticate } from '~/shopify.server';

describe('Privacy Webhooks Integration Tests', () => {
  let testStoreId: string;
  let testCampaignId: string;
  const testShop = 'test-integration-store.myshopify.com';

  beforeEach(async () => {
    // Create test store
    const store = await prisma.store.create({
      data: {
        shopifyDomain: testShop,
        shopifyShopId: BigInt(999999),
        accessToken: 'test-token',
        isActive: true,
      },
    });
    testStoreId = store.id;

    // Create test campaign
    const campaign = await prisma.campaign.create({
      data: {
        storeId: testStoreId,
        name: 'Test Campaign',
        goal: 'NEWSLETTER_SIGNUP',
        status: 'ACTIVE',
        templateType: 'NEWSLETTER',
      },
    });
    testCampaignId = campaign.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.lead.deleteMany({ where: { storeId: testStoreId } });
    await prisma.popupEvent.deleteMany({ where: { storeId: testStoreId } });
    await prisma.campaignConversion.deleteMany({
      where: { campaign: { storeId: testStoreId } },
    });
    await prisma.campaign.deleteMany({ where: { storeId: testStoreId } });
    await prisma.session.deleteMany({ where: { shop: testShop } });
    await prisma.store.deleteMany({ where: { shopifyDomain: testShop } });
  });

  describe('customers/data_request', () => {
    it('should compile all customer data from database', async () => {
      // Create test data
      const lead = await prisma.lead.create({
        data: {
          storeId: testStoreId,
          campaignId: testCampaignId,
          email: 'customer@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          shopifyCustomerId: BigInt(67890),
          sessionId: 'session-123',
          marketingConsent: true,
          discountCode: 'WELCOME10',
        },
      });

      await prisma.popupEvent.create({
        data: {
          storeId: testStoreId,
          campaignId: testCampaignId,
          leadId: lead.id,
          sessionId: 'session-123',
          eventType: 'VIEW',
          pageUrl: '/products/test',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        },
      });

      await prisma.campaignConversion.create({
        data: {
          campaignId: testCampaignId,
          orderId: '1001',
          orderNumber: '#1001',
          totalPrice: 100.0,
          discountAmount: 10.0,
          discountCodes: ['WELCOME10'],
          customerId: '67890',
          source: 'discount_code',
        },
      });

      const payload: CustomersDataRequestPayload = {
        shop_id: 999999,
        shop_domain: testShop,
        customer: {
          id: 67890,
          email: 'customer@example.com',
          phone: '+1234567890',
        },
        orders_requested: [1001],
        data_request: { id: 999 },
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: testShop,
        topic: 'CUSTOMERS_DATA_REQUEST',
        payload,
      } as any);

      const request = new Request('http://localhost/webhooks/customers/data_request', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await dataRequestAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.leads).toHaveLength(1);
      expect(data.data.leads[0].email).toBe('customer@example.com');
      expect(data.data.conversions).toHaveLength(1);
      expect(data.data.events).toHaveLength(1);
    });
  });

  describe('customers/redact', () => {
    it('should anonymize all customer PII in database', async () => {
      // Create test data
      const lead = await prisma.lead.create({
        data: {
          storeId: testStoreId,
          campaignId: testCampaignId,
          email: 'customer@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          shopifyCustomerId: BigInt(67890),
          sessionId: 'session-123',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
        },
      });

      const event = await prisma.popupEvent.create({
        data: {
          storeId: testStoreId,
          campaignId: testCampaignId,
          leadId: lead.id,
          sessionId: 'session-123',
          eventType: 'VIEW',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Browser',
          visitorId: 'visitor-123',
        },
      });

      const conversion = await prisma.campaignConversion.create({
        data: {
          campaignId: testCampaignId,
          orderId: '1001',
          orderNumber: '#1001',
          totalPrice: 100.0,
          discountAmount: 10.0,
          discountCodes: ['WELCOME10'],
          customerId: '67890',
          source: 'discount_code',
        },
      });

      const payload: CustomersRedactPayload = {
        shop_id: 999999,
        shop_domain: testShop,
        customer: {
          id: 67890,
          email: 'customer@example.com',
          phone: '+1234567890',
        },
        orders_to_redact: [1001],
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: testShop,
        topic: 'CUSTOMERS_REDACT',
        payload,
      } as any);

      const request = new Request('http://localhost/webhooks/customers/redact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await customersRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(200);

      // Verify data was anonymized
      const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(updatedLead?.email).toBe('redacted@privacy.local');
      expect(updatedLead?.firstName).toBeNull();
      expect(updatedLead?.lastName).toBeNull();
      expect(updatedLead?.phone).toBeNull();
      expect(updatedLead?.shopifyCustomerId).toBeNull();
      expect(updatedLead?.ipAddress).toBeNull();

      const updatedEvent = await prisma.popupEvent.findUnique({ where: { id: event.id } });
      expect(updatedEvent?.ipAddress).toBeNull();
      expect(updatedEvent?.userAgent).toBeNull();
      expect(updatedEvent?.visitorId).toBeNull();

      const updatedConversion = await prisma.campaignConversion.findUnique({
        where: { id: conversion.id },
      });
      expect(updatedConversion?.customerId).toBeNull();
    });

    it('should be idempotent (can be called multiple times)', async () => {
      const lead = await prisma.lead.create({
        data: {
          storeId: testStoreId,
          campaignId: testCampaignId,
          email: 'customer@example.com',
          shopifyCustomerId: BigInt(67890),
          sessionId: 'session-123',
        },
      });

      const payload: CustomersRedactPayload = {
        shop_id: 999999,
        shop_domain: testShop,
        customer: {
          id: 67890,
          email: 'customer@example.com',
          phone: null,
        },
        orders_to_redact: [],
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: testShop,
        topic: 'CUSTOMERS_REDACT',
        payload,
      } as any);

      const request1 = new Request('http://localhost/webhooks/customers/redact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response1 = await customersRedactAction({
        request: request1,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response1.status).toBe(200);

      // Call again
      const request2 = new Request('http://localhost/webhooks/customers/redact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response2 = await customersRedactAction({
        request: request2,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response2.status).toBe(200);

      // Verify data is still anonymized
      const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
      expect(updatedLead?.email).toBe('redacted@privacy.local');
    });
  });

  describe('shop/redact', () => {
    it('should delete all shop data from database', async () => {
      // Create additional test data
      await prisma.session.create({
        data: {
          id: 'session-123',
          shop: testShop,
          state: 'test-state',
          isOnline: false,
          accessToken: 'test-token',
        },
      });

      await prisma.lead.create({
        data: {
          storeId: testStoreId,
          campaignId: testCampaignId,
          email: 'customer@example.com',
          sessionId: 'session-123',
        },
      });

      const payload: ShopRedactPayload = {
        shop_id: 999999,
        shop_domain: testShop,
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: testShop,
        topic: 'SHOP_REDACT',
        payload,
      } as any);

      const request = new Request('http://localhost/webhooks/shop/redact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await shopRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(200);

      // Verify all data was deleted
      const store = await prisma.store.findUnique({
        where: { shopifyDomain: testShop },
      });
      expect(store).toBeNull();

      const sessions = await prisma.session.findMany({
        where: { shop: testShop },
      });
      expect(sessions).toHaveLength(0);

      // Cascade deletes should have removed campaigns and leads
      const campaigns = await prisma.campaign.findMany({
        where: { storeId: testStoreId },
      });
      expect(campaigns).toHaveLength(0);
    });

    it('should be idempotent (can be called multiple times)', async () => {
      const payload: ShopRedactPayload = {
        shop_id: 999999,
        shop_domain: testShop,
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: testShop,
        topic: 'SHOP_REDACT',
        payload,
      } as any);

      const request1 = new Request('http://localhost/webhooks/shop/redact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response1 = await shopRedactAction({
        request: request1,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response1.status).toBe(200);

      // Call again (shop already deleted)
      const request2 = new Request('http://localhost/webhooks/shop/redact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response2 = await shopRedactAction({
        request: request2,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response2.status).toBe(200);
    });
  });
});

