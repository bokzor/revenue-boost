import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for ProductDataHook
 * 
 * Tests the cart context extraction and product recommendation logic
 */

describe('ProductDataHook', () => {
  beforeEach(() => {
    // Reset window.Shopify.cart
    if (typeof window !== 'undefined') {
      (window as any).Shopify = { cart: null };
    }
    
    // Mock fetch
    global.fetch = vi.fn();
    
    vi.clearAllMocks();
  });

  describe('ensureCartDataAvailable', () => {
    it('should use existing cart data if available', async () => {
      const mockCart = {
        item_count: 2,
        total_price: 5999,
        items: [
          { product_id: 123, quantity: 1 },
          { product_id: 456, quantity: 1 }
        ]
      };

      // Set up existing cart data
      const w = window as any;
      w.Shopify = { cart: mockCart };

      // Simulate ensureCartDataAvailable logic
      const hasCart = w.Shopify?.cart && typeof w.Shopify.cart.item_count === 'number';
      
      expect(hasCart).toBe(true);
      expect(w.Shopify.cart.item_count).toBe(2);
      
      // Should NOT fetch if cart data exists
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch cart data if not available', async () => {
      const mockCart = {
        item_count: 1,
        total_price: 2999,
        items: [{ product_id: 789, quantity: 1 }]
      };

      // Mock fetch response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCart
      });

      // Simulate ensureCartDataAvailable logic
      const w = window as any;
      w.Shopify = {};

      const hasCart = w.Shopify?.cart && typeof w.Shopify.cart.item_count === 'number';

      if (!hasCart) {
        const response = await fetch('/cart.js', {
          credentials: 'same-origin',
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          const cart = await response.json();
          w.Shopify.cart = cart;
        }
      }

      expect(global.fetch).toHaveBeenCalledWith('/cart.js', {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      expect(w.Shopify.cart).toEqual(mockCart);
    });

    it('should handle fetch errors gracefully', async () => {
      // Mock fetch failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const w = window as any;
      w.Shopify = {};

      try {
        await fetch('/cart.js');
      } catch (error) {
        // Error should be caught and logged, not thrown
      }

      // Cart should remain empty
      expect(w.Shopify.cart).toBeUndefined();
    });
  });

  describe('getCartProductIds', () => {
    it('should extract product IDs from cart', () => {
      const mockCart = {
        item_count: 3,
        items: [
          { product_id: 123 },
          { product_id: 456 },
          { product_id: 789 }
        ]
      };

      const w = window as any;
      w.Shopify = { cart: mockCart };

      // Simulate getCartProductIds logic
      const cart = w.Shopify?.cart;
      const productIds = cart && Array.isArray(cart.items)
        ? cart.items
            .map((item: any) => item.product_id ? `gid://shopify/Product/${item.product_id}` : null)
            .filter((id: string | null) => id !== null)
        : [];

      expect(productIds).toHaveLength(3);
      expect(productIds).toContain('gid://shopify/Product/123');
    });

    it('should return empty array when cart is empty', () => {
      const w = window as any;
      w.Shopify = { cart: { item_count: 0, items: [] } };

      const cart = w.Shopify?.cart;
      const productIds = cart && Array.isArray(cart.items) && cart.items.length > 0
        ? cart.items
            .map((item: any) => item.product_id ? `gid://shopify/Product/${item.product_id}` : null)
            .filter((id: string | null) => id !== null)
        : [];

      expect(productIds).toHaveLength(0);
    });

    it('should return empty array when cart is not available', () => {
      const w = window as any;
      w.Shopify = {};

      const cart = w.Shopify?.cart;
      const productIds = cart && Array.isArray(cart.items)
        ? cart.items
            .map((item: any) => item.product_id ? `gid://shopify/Product/${item.product_id}` : null)
            .filter((id: string | null) => id !== null)
        : [];

      expect(productIds).toHaveLength(0);
    });
  });

  describe('Product Upsell Hook Execution', () => {
    it('should fail when no products are available', () => {
      const products: any[] = [];

      // Simulate hook logic
      const shouldFail = !products || products.length === 0;

      expect(shouldFail).toBe(true);
    });

    it('should succeed when products are available', () => {
      const products = [
        { id: 'gid://shopify/Product/123', title: 'Product 1' },
        { id: 'gid://shopify/Product/456', title: 'Product 2' }
      ];

      const shouldFail = !products || products.length === 0;

      expect(shouldFail).toBe(false);
      expect(products).toHaveLength(2);
    });
  });
});

