/**
 * Unit Tests for Privacy Webhook Routes
 * 
 * Tests the route handlers for GDPR webhooks with authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ActionFunctionArgs } from 'react-router';
import { action as dataRequestAction } from '~/routes/webhooks.customers.data_request';
import { action as customersRedactAction } from '~/routes/webhooks.customers.redact';
import { action as shopRedactAction } from '~/routes/webhooks.shop.redact';

// Mock dependencies
vi.mock('~/shopify.server', () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

vi.mock('~/webhooks/privacy/customers-data-request', () => ({
  handleCustomersDataRequest: vi.fn(),
}));

vi.mock('~/webhooks/privacy/customers-redact', () => ({
  handleCustomersRedact: vi.fn(),
}));

vi.mock('~/webhooks/privacy/shop-redact', () => ({
  handleShopRedact: vi.fn(),
}));

import { authenticate } from '~/shopify.server';
import { handleCustomersDataRequest } from '~/webhooks/privacy/customers-data-request';
import { handleCustomersRedact } from '~/webhooks/privacy/customers-redact';
import { handleShopRedact } from '~/webhooks/privacy/shop-redact';

describe('Privacy Webhook Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('webhooks.customers.data_request', () => {
    it('should process valid data request webhook', async () => {
      const mockPayload = {
        shop_id: 12345,
        shop_domain: 'test-store.myshopify.com',
        customer: { id: 67890, email: 'customer@example.com', phone: null },
        orders_requested: [],
        data_request: { id: 999 },
      };

      const mockCustomerData = {
        customer: mockPayload.customer,
        leads: [],
        conversions: [],
        events: [],
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'CUSTOMERS_DATA_REQUEST',
        payload: mockPayload,
      } as any);

      vi.mocked(handleCustomersDataRequest).mockResolvedValue(mockCustomerData);

      const request = new Request('http://localhost/webhooks/customers/data_request', {
        method: 'POST',
        body: JSON.stringify(mockPayload),
      });

      const response = await dataRequestAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCustomerData);
    });

    it('should return 400 for invalid topic', async () => {
      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'WRONG_TOPIC',
        payload: {},
      } as any);

      const request = new Request('http://localhost/webhooks/customers/data_request', {
        method: 'POST',
      });

      const response = await dataRequestAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(400);
    });

    it('should return 500 on handler error', async () => {
      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'CUSTOMERS_DATA_REQUEST',
        payload: {},
      } as any);

      vi.mocked(handleCustomersDataRequest).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/webhooks/customers/data_request', {
        method: 'POST',
      });

      const response = await dataRequestAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('webhooks.customers.redact', () => {
    it('should process valid redact webhook', async () => {
      const mockPayload = {
        shop_id: 12345,
        shop_domain: 'test-store.myshopify.com',
        customer: { id: 67890, email: 'customer@example.com', phone: null },
        orders_to_redact: [],
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'CUSTOMERS_REDACT',
        payload: mockPayload,
      } as any);

      vi.mocked(handleCustomersRedact).mockResolvedValue();

      const request = new Request('http://localhost/webhooks/customers/redact', {
        method: 'POST',
        body: JSON.stringify(mockPayload),
      });

      const response = await customersRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(handleCustomersRedact).toHaveBeenCalledWith('test-store.myshopify.com', mockPayload);
    });

    it('should return 400 for invalid topic', async () => {
      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'WRONG_TOPIC',
        payload: {},
      } as any);

      const request = new Request('http://localhost/webhooks/customers/redact', {
        method: 'POST',
      });

      const response = await customersRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(400);
    });

    it('should return 500 on handler error', async () => {
      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'CUSTOMERS_REDACT',
        payload: {},
      } as any);

      vi.mocked(handleCustomersRedact).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/webhooks/customers/redact', {
        method: 'POST',
      });

      const response = await customersRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(500);
    });
  });

  describe('webhooks.shop.redact', () => {
    it('should process valid shop redact webhook', async () => {
      const mockPayload = {
        shop_id: 12345,
        shop_domain: 'test-store.myshopify.com',
      };

      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'SHOP_REDACT',
        payload: mockPayload,
      } as any);

      vi.mocked(handleShopRedact).mockResolvedValue();

      const request = new Request('http://localhost/webhooks/shop/redact', {
        method: 'POST',
        body: JSON.stringify(mockPayload),
      });

      const response = await shopRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(handleShopRedact).toHaveBeenCalledWith('test-store.myshopify.com', mockPayload);
    });

    it('should return 400 for invalid topic', async () => {
      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'WRONG_TOPIC',
        payload: {},
      } as any);

      const request = new Request('http://localhost/webhooks/shop/redact', {
        method: 'POST',
      });

      const response = await shopRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(400);
    });

    it('should return 500 on handler error', async () => {
      vi.mocked(authenticate.webhook).mockResolvedValue({
        shop: 'test-store.myshopify.com',
        topic: 'SHOP_REDACT',
        payload: {},
      } as any);

      vi.mocked(handleShopRedact).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/webhooks/shop/redact', {
        method: 'POST',
      });

      const response = await shopRedactAction({
        request,
        params: {},
        context: {},
      } as unknown as ActionFunctionArgs);

      expect(response.status).toBe(500);
    });
  });
});

