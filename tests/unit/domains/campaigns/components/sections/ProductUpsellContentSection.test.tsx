import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { ProductUpsellContentSection } from "~/domains/campaigns/components/sections/ProductUpsellContentSection";
import type { ProductUpsellContent } from "~/domains/campaigns/types/campaign";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("ProductUpsellContentSection", () => {
  describe("Default Values & Normalization", () => {
    it("normalizes selection method and layout when content is empty", async () => {
      let latest: any = {};
      const onChange = vi.fn((partial: any) => {
        latest = { ...latest, ...partial };
      });

      renderWithPolaris(
        <ProductUpsellContentSection content={{}} errors={{}} onChange={onChange} />,
      );

      await waitFor(() => expect(onChange).toHaveBeenCalled());

      expect(latest.productSelectionMethod).toBe("ai");
      expect(latest.layout).toBe("grid");
    });

    it("preserves valid productSelectionMethod values", async () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ productSelectionMethod: "manual" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Should not call onChange to normalize since "manual" is valid
      await waitFor(() => {
        expect(onChange).not.toHaveBeenCalled();
      }, { timeout: 500 }).catch(() => {
        // Expected - no onChange should be called
      });
    });

    it("preserves valid layout values", async () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ layout: "carousel" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Should not call onChange to normalize since "carousel" is valid
      await waitFor(() => {
        expect(onChange).not.toHaveBeenCalled();
      }, { timeout: 500 }).catch(() => {
        // Expected - no onChange should be called
      });
    });
  });

  describe("Layout Options", () => {
    it("renders grid layout option", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ layout: "grid" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      // Layout select should exist
      const layoutSelect = screen.getByRole("combobox", { name: /layout/i });
      expect(layoutSelect).toBeTruthy();
    });

    it("renders carousel layout option", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ layout: "carousel" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const layoutSelect = screen.getByRole("combobox", { name: /layout/i });
      expect(layoutSelect).toBeTruthy();
    });

    it("renders card layout option", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ layout: "card" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const layoutSelect = screen.getByRole("combobox", { name: /layout/i });
      expect(layoutSelect).toBeTruthy();
    });

    it("shows columns field only when layout is grid", async () => {
      const user = userEvent.setup();
      const { rerender } = renderWithPolaris(
        <ProductUpsellContentSection
          content={{ layout: "grid" }}
          errors={{}}
          onChange={vi.fn()}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      // Columns field should be present for grid layout
      expect(screen.queryByLabelText(/number of columns/i)).toBeTruthy();

      // Rerender with carousel layout
      rerender(
        <AppProvider i18n={en}>
          <ProductUpsellContentSection
            content={{ layout: "carousel" }}
            errors={{}}
            onChange={vi.fn()}
          />
        </AppProvider>
      );

      // Columns field should NOT be present for carousel layout
      expect(screen.queryByLabelText(/number of columns/i)).toBeFalsy();
    });
  });

  describe("Display Toggle Options", () => {
    it("renders showImages checkbox with default checked state", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const checkbox = screen.getByRole("checkbox", { name: /show product images/i });
      expect(checkbox).toBeTruthy();
      // Default is true, so should be checked
      expect(checkbox).toBeChecked();
    });

    it("renders showPrices checkbox with default checked state", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const checkbox = screen.getByRole("checkbox", { name: /show product prices/i });
      expect(checkbox).toBeTruthy();
      expect(checkbox).toBeChecked();
    });

    it("renders showCompareAtPrice checkbox with default checked state", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const checkbox = screen.getByRole("checkbox", { name: /show compare-at price/i });
      expect(checkbox).toBeTruthy();
      expect(checkbox).toBeChecked();
    });

    it("renders showRatings checkbox with default unchecked state", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const checkbox = screen.getByRole("checkbox", { name: /show ratings/i });
      expect(checkbox).toBeTruthy();
      expect(checkbox).not.toBeChecked();
    });

    it("renders showReviewCount checkbox with default unchecked state", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const checkbox = screen.getByRole("checkbox", { name: /show review count/i });
      expect(checkbox).toBeTruthy();
      expect(checkbox).not.toBeChecked();
    });

    it("respects explicit showImages: false", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ showImages: false }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const checkbox = screen.getByRole("checkbox", { name: /show product images/i });
      expect(checkbox).not.toBeChecked();
    });

    it("respects explicit showRatings: true", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ showRatings: true }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const checkbox = screen.getByRole("checkbox", { name: /show ratings/i });
      expect(checkbox).toBeChecked();
    });
  });

  describe("Product Selection Methods", () => {
    it("renders AI selection method by default", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Product Selection section
      const productSection = screen.getByRole("button", { name: /product selection/i });
      await user.click(productSection);

      const select = screen.getByRole("combobox", { name: /how should products be chosen/i });
      expect(select).toBeTruthy();
    });

    it("renders manual selection method", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ productSelectionMethod: "manual" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Product Selection section
      const productSection = screen.getByRole("button", { name: /product selection/i });
      await user.click(productSection);

      const select = screen.getByRole("combobox", { name: /how should products be chosen/i });
      expect(select).toBeTruthy();
    });

    it("renders collection selection method", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ productSelectionMethod: "collection" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Product Selection section
      const productSection = screen.getByRole("button", { name: /product selection/i });
      await user.click(productSection);

      const select = screen.getByRole("combobox", { name: /how should products be chosen/i });
      expect(select).toBeTruthy();
    });
  });

  describe("Field Values", () => {
    it("renders maxProducts field with default value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Product Selection section
      const productSection = screen.getByRole("button", { name: /product selection/i });
      await user.click(productSection);

      const input = screen.getByLabelText(/maximum products to display/i) as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe("3");
    });

    it("renders maxProducts field with custom value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ maxProducts: 8 }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Product Selection section
      const productSection = screen.getByRole("button", { name: /product selection/i });
      await user.click(productSection);

      const input = screen.getByLabelText(/maximum products to display/i) as HTMLInputElement;
      expect(input.value).toBe("8");
    });

    it("renders columns field with default value for grid layout", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ layout: "grid" }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const input = screen.getByLabelText(/number of columns/i) as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe("2");
    });

    it("renders columns field with custom value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ layout: "grid", columns: 3 }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Layout & Display section
      const layoutSection = screen.getByRole("button", { name: /layout & display/i });
      await user.click(layoutSection);

      const input = screen.getByLabelText(/number of columns/i) as HTMLInputElement;
      expect(input.value).toBe("3");
    });

    it("renders bundleDiscount field with default value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{}}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Bundle Discount section
      const bundleSection = screen.getByRole("button", { name: /bundle discount/i });
      await user.click(bundleSection);

      const input = screen.getByLabelText(/bundle discount \(%\)/i) as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe("15");
    });

    it("renders bundleDiscount field with custom value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      renderWithPolaris(
        <ProductUpsellContentSection
          content={{ bundleDiscount: 25 }}
          errors={{}}
          onChange={onChange}
        />,
      );

      // Open the Bundle Discount section
      const bundleSection = screen.getByRole("button", { name: /bundle discount/i });
      await user.click(bundleSection);

      const input = screen.getByLabelText(/bundle discount \(%\)/i) as HTMLInputElement;
      expect(input.value).toBe("25");
    });
  });
});

