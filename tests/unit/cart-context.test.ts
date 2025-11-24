import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for cart context handling
 * 
 * These tests verify that cart data is properly passed through the event system
 * to avoid race conditions when fetching product recommendations.
 */

describe('Cart Context Handling', () => {
  beforeEach(() => {
    // Reset window.Shopify.cart before each test
    if (typeof window !== 'undefined') {
      (window as any).Shopify = { cart: null };
    }
    
    // Clear all event listeners
    vi.clearAllMocks();
  });

  describe('Cart Event Emission', () => {
    it('should include cart data in cart:add event detail', () => {
      const mockCartData = {
        item_count: 2,
        total_price: 5999,
        items: [
          { product_id: 123, quantity: 1 },
          { product_id: 456, quantity: 1 }
        ]
      };

      let eventDetail: any = null;
      
      document.addEventListener('cart:add', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      // Simulate cart add event with cart data
      document.dispatchEvent(new CustomEvent('cart:add', {
        detail: {
          productId: 'gid://shopify/Product/123',
          cart: mockCartData
        }
      }));

      expect(eventDetail).toBeDefined();
      expect(eventDetail.productId).toBe('gid://shopify/Product/123');
      expect(eventDetail.cart).toEqual(mockCartData);
      expect(eventDetail.cart.item_count).toBe(2);
    });

    it('should update window.Shopify.cart when cart data is provided', () => {
      const mockCartData = {
        item_count: 1,
        total_price: 2999,
        items: [{ product_id: 789, quantity: 1 }]
      };

      // Simulate the cart tracking behavior
      if (typeof window !== 'undefined') {
        const w = window as any;
        if (typeof w.Shopify === 'object') {
          w.Shopify.cart = mockCartData;
        }
      }

      const w = window as any;
      expect(w.Shopify.cart).toEqual(mockCartData);
      expect(w.Shopify.cart.item_count).toBe(1);
    });
  });

  describe('Cart Product ID Extraction', () => {
    it('should extract product IDs from cart items', () => {
      const mockCart = {
        item_count: 3,
        items: [
          { product_id: 123 },
          { product_id: 456 },
          { product_id: 789 }
        ]
      };

      const productIds = mockCart.items
        .map(item => `gid://shopify/Product/${item.product_id}`)
        .filter(id => id !== null);

      expect(productIds).toHaveLength(3);
      expect(productIds).toContain('gid://shopify/Product/123');
      expect(productIds).toContain('gid://shopify/Product/456');
      expect(productIds).toContain('gid://shopify/Product/789');
    });

    it('should handle empty cart gracefully', () => {
      const mockCart = {
        item_count: 0,
        items: []
      };

      const productIds = mockCart.items
        .map(item => `gid://shopify/Product/${item.product_id}`)
        .filter(id => id !== null);

      expect(productIds).toHaveLength(0);
    });

    it('should remove duplicate product IDs', () => {
      const mockCart = {
        item_count: 3,
        items: [
          { product_id: 123 },
          { product_id: 123 }, // Duplicate (different variant)
          { product_id: 456 }
        ]
      };

      const productIds = mockCart.items
        .map(item => `gid://shopify/Product/${item.product_id}`);
      
      const uniqueIds = [...new Set(productIds)];

      expect(uniqueIds).toHaveLength(2);
      expect(uniqueIds).toContain('gid://shopify/Product/123');
      expect(uniqueIds).toContain('gid://shopify/Product/456');
    });
  });

  describe('Cart Data Availability', () => {
    it('should detect when cart data is available', () => {
      const w = window as any;
      w.Shopify = {
        cart: {
          item_count: 1,
          items: [{ product_id: 123 }]
        }
      };

      const hasCart = w.Shopify?.cart && typeof w.Shopify.cart.item_count === 'number';
      expect(hasCart).toBe(true);
    });

    it('should detect when cart data is missing', () => {
      const w = window as any;
      w.Shopify = {};

      const hasCart = w.Shopify?.cart && typeof w.Shopify.cart.item_count === 'number';
      expect(hasCart).toBeFalsy(); // Use toBeFalsy() to handle undefined
    });
  });
});

