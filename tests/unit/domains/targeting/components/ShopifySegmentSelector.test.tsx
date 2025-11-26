/**
 * Unit Tests for ShopifySegmentSelector Component
 *
 * Tests the Shopify customer segment selection UI including:
 * - Segment loading and display
 * - Scope permission handling
 * - Refresh functionality
 * - Customer count display
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { PolarisTestProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

// Mock useScopeRequest hook before importing the component
vi.mock("~/shared/hooks/useScopeRequest", () => ({
  useScopeRequest: () => ({
    requestScopes: vi.fn().mockResolvedValue(true),
    isRequesting: false,
    error: null,
    lastResult: null,
    clearError: vi.fn(),
  }),
}));

import {
  ShopifySegmentSelector,
  type ShopifySegmentOption,
} from "~/domains/targeting/components/ShopifySegmentSelector";

// Helper to render with Polaris provider
function renderWithPolaris(component: React.ReactElement) {
  return render(
    <PolarisTestProvider i18n={enTranslations}>
      {component}
    </PolarisTestProvider>
  );
}

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ShopifySegmentSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading spinner while fetching segments", () => {
      // Never resolve the fetch to keep loading state
      mockFetch.mockImplementation(() => new Promise(() => {}));

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByText("Loading Shopify segments...")).toBeTruthy();
    });
  });

  describe("Scope Required State", () => {
    it("shows grant access banner when scope is required", async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: [],
              scopeRequired: "read_customers",
              scopeMessage: "Permission required to access segments",
            },
          }),
      });

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Additional permissions required")).toBeTruthy();
      });

      expect(screen.getByText(/Permission required to access segments/)).toBeTruthy();
    });

    it("shows Grant Access button when scope is required", async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: [],
              scopeRequired: "read_customers",
              scopeMessage: "Permission required",
            },
          }),
      });

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Grant Access")).toBeTruthy();
      });
    });
  });

  describe("Segment Display", () => {
    const mockSegments: ShopifySegmentOption[] = [
      { id: "gid://shopify/Segment/1", name: "VIP Customers", customerCount: 150 },
      { id: "gid://shopify/Segment/2", name: "First-time Buyers", customerCount: 1200 },
      { id: "gid://shopify/Segment/3", name: "Abandoned Cart", description: "cart_abandoned = true" },
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: mockSegments,
              scopeGranted: true,
            },
          }),
      });
    });

    it("displays segment names", async () => {
      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("VIP Customers")).toBeTruthy();
        expect(screen.getByText("First-time Buyers")).toBeTruthy();
        expect(screen.getByText("Abandoned Cart")).toBeTruthy();
      });
    });

    it("displays customer counts with proper formatting", async () => {
      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("150 customers")).toBeTruthy();
        expect(screen.getByText("1.2K customers")).toBeTruthy();
      });
    });

    it("displays segment description when available", async () => {
      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("cart_abandoned = true")).toBeTruthy();
      });
    });

    it("shows selected count badge when segments are selected", async () => {
      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={["gid://shopify/Segment/1", "gid://shopify/Segment/2"]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("2 selected")).toBeTruthy();
      });
    });
  });

  describe("Selection Behavior", () => {
    const mockSegments: ShopifySegmentOption[] = [
      { id: "gid://shopify/Segment/1", name: "VIP Customers" },
      { id: "gid://shopify/Segment/2", name: "First-time Buyers" },
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: mockSegments,
              scopeGranted: true,
            },
          }),
      });
    });

    it("calls onChange when segment is selected", async () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("VIP Customers")).toBeTruthy();
      });

      // Click on VIP Customers segment card
      const vipCard = screen.getByText("VIP Customers").closest("button");
      if (vipCard) {
        fireEvent.click(vipCard);
      }

      expect(onChange).toHaveBeenCalledWith(["gid://shopify/Segment/1"]);
    });

    it("calls onChange to deselect when already selected segment is clicked", async () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={["gid://shopify/Segment/1"]}
          onChange={onChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("VIP Customers")).toBeTruthy();
      });

      const vipCard = screen.getByText("VIP Customers").closest("button");
      if (vipCard) {
        fireEvent.click(vipCard);
      }

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe("Refresh Button", () => {
    it("shows refresh button when segments are loaded", async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: [{ id: "1", name: "Test" }],
              scopeGranted: true,
            },
          }),
      });

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeTruthy();
      });
    });

    it("calls fetch again when refresh is clicked", async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: [{ id: "1", name: "Test" }],
              scopeGranted: true,
            },
          }),
      });

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeTruthy();
      });

      // Clear the mock to track new calls
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: [{ id: "1", name: "Updated" }],
              scopeGranted: true,
            },
          }),
      });

      const refreshButton = screen.getByText("Refresh").closest("button");
      if (refreshButton) {
        fireEvent.click(refreshButton);
      }

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/shopify-segments?includeCounts=true");
      });
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no segments exist", async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: [],
              scopeGranted: true,
            },
          }),
      });

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/No customer segments found in your Shopify store/)
        ).toBeTruthy();
      });
    });
  });

  describe("Disabled State", () => {
    it("prevents selection when disabled", async () => {
      const onChange = vi.fn();

      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              segments: [{ id: "1", name: "Test" }],
              scopeGranted: true,
            },
          }),
      });

      renderWithPolaris(
        <ShopifySegmentSelector
          selectedSegmentIds={[]}
          onChange={onChange}
          disabled={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Test")).toBeTruthy();
      });

      const card = screen.getByText("Test").closest("button");
      if (card) {
        fireEvent.click(card);
      }

      // onChange should not be called when disabled
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

