import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProductPicker } from '~/domains/campaigns/components/form/ProductPicker';
import type { ProductPickerSelection } from '~/domains/campaigns/components/form/ProductPicker';

// Mock App Bridge
const mockResourcePicker = vi.fn();
vi.mock('@shopify/app-bridge-react', () => ({
  useAppBridge: () => ({
    resourcePicker: mockResourcePicker,
  }),
}));

// Mock Polaris components
vi.mock('@shopify/polaris', () => ({
  Button: ({ children, onClick, loading, disabled, ...props }: any) =>
    React.createElement('button', { onClick, disabled: disabled || loading, 'data-loading': loading, ...props }, children),
  BlockStack: ({ children }: any) => React.createElement('div', null, children),
  InlineStack: ({ children }: any) => React.createElement('div', null, children),
  Text: ({ children }: any) => React.createElement('span', null, children),
  Badge: ({ children }: any) => React.createElement('span', null, children),
  Box: ({ children }: any) => React.createElement('div', null, children),
}));

vi.mock('@shopify/polaris-icons', () => ({
  ProductIcon: 'ProductIcon',
  CollectionIcon: 'CollectionIcon',
}));

describe('ProductPicker', () => {
  const mockOnSelect = vi.fn();
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockOnSelect.mockClear();
    mockResourcePicker.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders product picker button with default label', () => {
      render(
        <ProductPicker
          mode="product"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Select Product')).toBeTruthy();
    });

    it('renders collection picker button with default label', () => {
      render(
        <ProductPicker
          mode="collection"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Select Collection')).toBeTruthy();
    });

    it('renders custom button label when provided', () => {
      render(
        <ProductPicker
          mode="product"
          buttonLabel="Choose Products"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Choose Products')).toBeTruthy();
    });

    it('displays error message when provided', () => {
      render(
        <ProductPicker
          mode="product"
          error="Please select at least one product"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText('Please select at least one product')).toBeTruthy();
    });
  });

  describe('Initial Fetch of Selected Products', () => {
    it('fetches and displays products when selectedIds are provided', async () => {
      const mockProducts: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Product/123',
          title: 'Test Product',
          handle: 'test-product',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockProducts }),
      });

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/resources?ids=gid%3A%2F%2Fshopify%2FProduct%2F123&type=product')
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeTruthy();
      });
    });

    it('fetches collections when mode is collection', async () => {
      const mockCollections: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Collection/456',
          title: 'Test Collection',
          handle: 'test-collection',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockCollections }),
      });

      render(
        <ProductPicker
          mode="collection"
          selectedIds={['gid://shopify/Collection/456']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('type=collection')
        );
      });
    });

    it('does not fetch when selectedIds is empty', async () => {
      global.fetch = vi.fn();

      render(
        <ProductPicker
          mode="product"
          selectedIds={[]}
          onSelect={mockOnSelect}
        />
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles fetch errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/999']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch initial selections:',
          'Not Found'
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('fetches only once for the same selectedIds', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: [] }),
      });

      const { rerender } = render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Re-render with same selectedIds
      rerender(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be called only once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('fetches again when selectedIds change', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: [] }),
      });

      const { rerender } = render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Re-render with different selectedIds
      rerender(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/456']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('displays multiple selected products', async () => {
      const mockProducts: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Product/123',
          title: 'Product 1',
          handle: 'product-1',
        },
        {
          id: 'gid://shopify/Product/456',
          title: 'Product 2',
          handle: 'product-2',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockProducts }),
      });

      render(
        <ProductPicker
          mode="product"
          selectionType="multiple"
          selectedIds={['gid://shopify/Product/123', 'gid://shopify/Product/456']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeTruthy();
        expect(screen.getByText('Product 2')).toBeTruthy();
      });
    });
  });

  describe('Resource Picker Interaction', () => {
    it('opens resource picker when button is clicked', async () => {
      mockResourcePicker.mockResolvedValue([
        {
          id: 'gid://shopify/Product/789',
          title: 'New Product',
          handle: 'new-product',
        },
      ]);

      render(
        <ProductPicker
          mode="product"
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByText('Select Product');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockResourcePicker).toHaveBeenCalledWith({
          type: 'product',
          multiple: false,
        });
      });
    });

    it('calls onSelect with selected products from picker', async () => {
      const selectedProduct = {
        id: 'gid://shopify/Product/789',
        title: 'New Product',
        handle: 'new-product',
      };

      mockResourcePicker.mockResolvedValue([selectedProduct]);

      render(
        <ProductPicker
          mode="product"
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByText('Select Product');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith([
          expect.objectContaining({
            id: 'gid://shopify/Product/789',
            title: 'New Product',
            handle: 'new-product',
          }),
        ]);
      });
    });

    it('passes selectionIds to picker when selectedIds are provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: [] }),
      });

      mockResourcePicker.mockResolvedValue([]);

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const button = screen.getByText('Select Product');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockResourcePicker).toHaveBeenCalledWith({
          type: 'product',
          multiple: false,
          selectionIds: [{ id: 'gid://shopify/Product/123' }],
        });
      });
    });

    it('uses multiple selection mode when specified', async () => {
      mockResourcePicker.mockResolvedValue([]);

      render(
        <ProductPicker
          mode="product"
          selectionType="multiple"
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByText('Select Product');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockResourcePicker).toHaveBeenCalledWith({
          type: 'product',
          multiple: true,
        });
      });
    });

    it('handles picker cancellation gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockResourcePicker.mockRejectedValue(new Error('User cancelled'));

      render(
        <ProductPicker
          mode="product"
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByText('Select Product');
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // onSelect should not be called on cancellation
      expect(mockOnSelect).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Selection Display', () => {
    it('shows selected products when showSelected is true', async () => {
      const mockProducts: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Product/123',
          title: 'Test Product',
          handle: 'test-product',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockProducts }),
      });

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          showSelected={true}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Selected Products:')).toBeTruthy();
        expect(screen.getByText('Test Product')).toBeTruthy();
        expect(screen.getByText('gid://shopify/Product/123')).toBeTruthy();
      });
    });

    it('hides selected products when showSelected is false', async () => {
      const mockProducts: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Product/123',
          title: 'Test Product',
          handle: 'test-product',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockProducts }),
      });

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          showSelected={false}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(screen.queryByText('Selected Products:')).toBeNull();
    });

    it('displays variant count badge when product has variants', async () => {
      const mockProducts: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Product/123',
          title: 'Test Product',
          handle: 'test-product',
          variants: [
            { id: 'gid://shopify/ProductVariant/1', title: 'Small', price: '10.00' },
            { id: 'gid://shopify/ProductVariant/2', title: 'Large', price: '15.00' },
          ],
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockProducts }),
      });

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2 variants')).toBeTruthy();
      });
    });

    it('shows "Selected Collections:" for collection mode', async () => {
      const mockCollections: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Collection/456',
          title: 'Test Collection',
          handle: 'test-collection',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockCollections }),
      });

      render(
        <ProductPicker
          mode="collection"
          selectedIds={['gid://shopify/Collection/456']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Selected Collections:')).toBeTruthy();
      });
    });

    it('allows removing selected items', async () => {
      const mockProducts: ProductPickerSelection[] = [
        {
          id: 'gid://shopify/Product/123',
          title: 'Test Product',
          handle: 'test-product',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ resources: mockProducts }),
      });

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeTruthy();
      });

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during initial fetch', async () => {
      let resolveFetch: any;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(fetchPromise);

      render(
        <ProductPicker
          mode="product"
          selectedIds={['gid://shopify/Product/123']}
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByText('Select Product');
      expect(button.getAttribute('data-loading')).toBe('true');

      resolveFetch({
        ok: true,
        json: async () => ({ resources: [] }),
      });

      await waitFor(() => {
        expect(button.getAttribute('data-loading')).toBe('false');
      });
    });

    it('shows loading state when opening picker', async () => {
      mockResourcePicker.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <ProductPicker
          mode="product"
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByText('Select Product');
      fireEvent.click(button);

      await waitFor(() => {
        expect(button.getAttribute('data-loading')).toBe('true');
      });
    });
  });
});

