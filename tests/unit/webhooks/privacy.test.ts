/**
 * Unit Tests for Privacy Webhook Handlers
 * 
 * Tests GDPR compliance webhooks:
 * - customers/data_request
 * - customers/redact
 * - shop/redact
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleCustomersDataRequest } from '~/webhooks/privacy/customers-data-request';
import { handleCustomersRedact } from '~/webhooks/privacy/customers-redact';
import { handleShopRedact } from '~/webhooks/privacy/shop-redact';
import type {
  CustomersDataRequestPayload,
  CustomersRedactPayload,
  ShopRedactPayload,
} from '~/webhooks/privacy/types';
import prisma from '~/db.server';
import { Prisma } from '@prisma/client';

// Mock Prisma
vi.mock('~/db.server', () => ({
  default: {
    store: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    lead: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    campaignConversion: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    popupEvent: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Privacy Webhook Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCustomersDataRequest', () => {
    const mockPayload: CustomersDataRequestPayload = {
      shop_id: 12345,
      shop_domain: 'test-store.myshopify.com',
      orders_requested: [1001, 1002],
      customer: {
        id: 67890,
        email: 'customer@example.com',
        phone: '+1234567890',
      },
      data_request: {
        id: 999,
      },
    };

    it('should compile customer data successfully', async () => {
      const mockStore = { id: 'store-123' };
      const mockLeads = [
        {
          id: 'lead-1',
          email: 'customer@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          campaignId: 'campaign-1',
          campaign: { name: 'Newsletter Signup' },
          discountCode: 'WELCOME10',
          submittedAt: new Date('2024-01-01'),
          marketingConsent: true,
        },
      ];
      const mockConversions = [
        {
          id: 'conv-1',
          orderId: '1001',
          orderNumber: '#1001',
          totalPrice: 100.0,
          discountAmount: 10.0,
          discountCodes: ['WELCOME10'],
          createdAt: new Date('2024-01-02'),
        },
      ];
      const mockEvents = [
        {
          id: 'event-1',
          eventType: 'VIEW',
          campaignId: 'campaign-1',
          pageUrl: '/products/test',
          createdAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.lead.findMany).mockResolvedValue(mockLeads as any);
      vi.mocked(prisma.campaignConversion.findMany).mockResolvedValue(mockConversions as any);
      vi.mocked(prisma.popupEvent.findMany).mockResolvedValue(mockEvents as any);

      const result = await handleCustomersDataRequest('test-store.myshopify.com', mockPayload);

      expect(result.customer).toEqual(mockPayload.customer);
      expect(result.leads).toHaveLength(1);
      expect(result.leads[0].email).toBe('customer@example.com');
      expect(result.conversions).toHaveLength(1);
      expect(result.events).toHaveLength(1);
    });

    it('should return empty data if store not found', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await handleCustomersDataRequest('test-store.myshopify.com', mockPayload);

      expect(result.customer).toEqual(mockPayload.customer);
      expect(result.leads).toHaveLength(0);
      expect(result.conversions).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    });

    it('should handle customer with no data', async () => {
      const mockStore = { id: 'store-123' };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.lead.findMany).mockResolvedValue([]);
      vi.mocked(prisma.campaignConversion.findMany).mockResolvedValue([]);
      vi.mocked(prisma.popupEvent.findMany).mockResolvedValue([]);

      const result = await handleCustomersDataRequest('test-store.myshopify.com', mockPayload);

      expect(result.leads).toHaveLength(0);
      expect(result.conversions).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    });
  });

  describe('handleCustomersRedact', () => {
    const mockPayload: CustomersRedactPayload = {
      shop_id: 12345,
      shop_domain: 'test-store.myshopify.com',
      customer: {
        id: 67890,
        email: 'customer@example.com',
        phone: '+1234567890',
      },
      orders_to_redact: [1001, 1002],
    };

    it('should anonymize customer data successfully', async () => {
      const mockStore = { id: 'store-123' };
      const mockLeads = [{ id: 'lead-1' }, { id: 'lead-2' }];
      const mockEvents = [{ id: 'event-1' }];
      const mockConversions = [{ id: 'conv-1' }];

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.lead.findMany).mockResolvedValue(mockLeads as any);
      vi.mocked(prisma.popupEvent.findMany).mockResolvedValue(mockEvents as any);
      vi.mocked(prisma.campaignConversion.findMany).mockResolvedValue(mockConversions as any);
      vi.mocked(prisma.lead.updateMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(prisma.popupEvent.updateMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.campaignConversion.updateMany).mockResolvedValue({ count: 1 } as any);

      await handleCustomersRedact('test-store.myshopify.com', mockPayload);

      // Verify leads were anonymized
      expect(prisma.lead.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['lead-1', 'lead-2'] } },
        data: {
          email: 'redacted@privacy.local',
          firstName: null,
          lastName: null,
          phone: null,
          shopifyCustomerId: null,
          ipAddress: null,
          userAgent: null,
          referrer: null,
          metadata: null,
        },
      });

      // Verify events were anonymized
      expect(prisma.popupEvent.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['event-1'] } },
        data: {
          ipAddress: null,
          userAgent: null,
          referrer: null,
          visitorId: null,
          metadata: Prisma.JsonNull,
        },
      });

      // Verify conversions were anonymized
      expect(prisma.campaignConversion.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['conv-1'] } },
        data: {
          customerId: null,
        },
      });
    });

    it('should handle store not found gracefully', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      await expect(
        handleCustomersRedact('test-store.myshopify.com', mockPayload)
      ).resolves.not.toThrow();

      // Should not attempt any updates
      expect(prisma.lead.updateMany).not.toHaveBeenCalled();
    });

    it('should be idempotent (handle already-redacted data)', async () => {
      const mockStore = { id: 'store-123' };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.lead.findMany).mockResolvedValue([]);
      vi.mocked(prisma.popupEvent.findMany).mockResolvedValue([]);
      vi.mocked(prisma.campaignConversion.findMany).mockResolvedValue([]);

      await expect(
        handleCustomersRedact('test-store.myshopify.com', mockPayload)
      ).resolves.not.toThrow();
    });
  });

  describe('handleShopRedact', () => {
    const mockPayload: ShopRedactPayload = {
      shop_id: 12345,
      shop_domain: 'test-store.myshopify.com',
    };

    it('should delete all shop data successfully', async () => {
      const mockStore = { id: 'store-123' };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 } as any);
      vi.mocked(prisma.store.delete).mockResolvedValue(mockStore as any);

      await handleShopRedact('test-store.myshopify.com', mockPayload);

      // Verify sessions were deleted
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { shop: 'test-store.myshopify.com' },
      });

      // Verify store was deleted (cascade deletes related data)
      expect(prisma.store.delete).toHaveBeenCalledWith({
        where: { id: 'store-123' },
      });
    });

    it('should handle store not found gracefully', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      await expect(
        handleShopRedact('test-store.myshopify.com', mockPayload)
      ).resolves.not.toThrow();

      // Should not attempt any deletions
      expect(prisma.session.deleteMany).not.toHaveBeenCalled();
      expect(prisma.store.delete).not.toHaveBeenCalled();
    });

    it('should be idempotent (handle already-deleted shop)', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      // First call
      await handleShopRedact('test-store.myshopify.com', mockPayload);

      // Second call (should not throw)
      await expect(
        handleShopRedact('test-store.myshopify.com', mockPayload)
      ).resolves.not.toThrow();
    });
  });
});

