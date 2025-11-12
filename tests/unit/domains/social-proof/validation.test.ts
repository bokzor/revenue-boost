/**
 * Social Proof Tracking Validation Tests
 * 
 * Tests for the TrackEventSchema validation
 */

import { describe, it, expect } from 'vitest';
import { validateTrackEvent } from '~/domains/social-proof/types/tracking';

describe('TrackEventSchema Validation', () => {
  describe('Valid requests', () => {
    it('should validate a valid page_view event', () => {
      const result = validateTrackEvent({
        eventType: 'page_view',
        shop: 'test-store.myshopify.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventType).toBe('page_view');
        expect(result.data.shop).toBe('test-store.myshopify.com');
      }
    });

    it('should validate a valid product_view event with productId', () => {
      const result = validateTrackEvent({
        eventType: 'product_view',
        productId: '12345',
        shop: 'test-store.myshopify.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventType).toBe('product_view');
        expect(result.data.productId).toBe('12345');
      }
    });

    it('should validate a valid add_to_cart event', () => {
      const result = validateTrackEvent({
        eventType: 'add_to_cart',
        productId: '67890',
        shop: 'my-shop.myshopify.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventType).toBe('add_to_cart');
        expect(result.data.productId).toBe('67890');
      }
    });

    it('should validate event with valid pageUrl', () => {
      const result = validateTrackEvent({
        eventType: 'page_view',
        pageUrl: 'https://test-store.myshopify.com/products/test',
        shop: 'test-store.myshopify.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pageUrl).toBe('https://test-store.myshopify.com/products/test');
      }
    });
  });

  describe('Invalid requests', () => {
    it('should reject missing shop', () => {
      const result = validateTrackEvent({
        eventType: 'page_view',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('shop');
      }
    });

    it('should reject invalid shop domain', () => {
      const result = validateTrackEvent({
        eventType: 'page_view',
        shop: 'invalid-shop.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid Shopify domain');
      }
    });

    it('should reject shop with uppercase letters', () => {
      const result = validateTrackEvent({
        eventType: 'page_view',
        shop: 'Test-Store.myshopify.com',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid event type', () => {
      const result = validateTrackEvent({
        eventType: 'invalid_event',
        shop: 'test-store.myshopify.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('eventType');
      }
    });

    it('should reject invalid pageUrl', () => {
      const result = validateTrackEvent({
        eventType: 'page_view',
        pageUrl: 'not-a-url',
        shop: 'test-store.myshopify.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('pageUrl');
      }
    });

    it('should reject completely invalid data', () => {
      const result = validateTrackEvent({
        random: 'data',
      });

      expect(result.success).toBe(false);
    });

    it('should reject null', () => {
      const result = validateTrackEvent(null);
      expect(result.success).toBe(false);
    });

    it('should reject undefined', () => {
      const result = validateTrackEvent(undefined);
      expect(result.success).toBe(false);
    });
  });
});

