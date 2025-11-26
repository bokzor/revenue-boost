import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiscountCodeDisplay } from "~/domains/storefront/popups-new/components/shared/DiscountCodeDisplay";

describe("DiscountCodeDisplay", () => {
  describe("Basic Rendering", () => {
    it("renders the discount code", () => {
      render(<DiscountCodeDisplay code="SAVE20" />);
      expect(screen.getByText("SAVE20")).toBeInTheDocument();
    });

    it("renders with a label", () => {
      render(<DiscountCodeDisplay code="SAVE20" label="Your discount code:" />);
      expect(screen.getByText("Your discount code:")).toBeInTheDocument();
      expect(screen.getByText("SAVE20")).toBeInTheDocument();
    });

    it("renders without a label", () => {
      render(<DiscountCodeDisplay code="SAVE20" />);
      expect(screen.queryByText("Your discount code:")).not.toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders dashed variant by default", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders solid variant", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" variant="solid" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders minimal variant", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" variant="minimal" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Sizes", () => {
    it("renders medium size by default", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders small size", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" size="sm" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders large size", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" size="lg" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Colors", () => {
    it("renders with default accent color", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom accent color", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" accentColor="#ff0000" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom text color", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" textColor="#00ff00" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom background color", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" backgroundColor="#f0f0f0" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Copy Functionality", () => {
    it("calls onCopy when clicked", () => {
      const onCopy = vi.fn();
      const { container } = render(<DiscountCodeDisplay code="SAVE20" onCopy={onCopy} />);
      const wrapper = container.querySelector("div");
      wrapper?.click();
      expect(onCopy).toHaveBeenCalledTimes(1);
    });

    it("shows checkmark when copied", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" copied={true} />);
      // Checkmark is rendered as an SVG
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("does not show checkmark when not copied", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" copied={false} />);
      // No SVG should be present when not copied
      const svg = container.querySelector("svg");
      expect(svg).not.toBeInTheDocument();
    });

    it("has pointer cursor when onCopy is provided", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" onCopy={() => {}} />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.cursor).toBe("pointer");
    });

    it("has default cursor when onCopy is not provided", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.cursor).toBe("default");
    });

    it("has role=button when onCopy is provided", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" onCopy={() => {}} />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.getAttribute("role")).toBe("button");
    });

    it("has tabIndex=0 when onCopy is provided", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" onCopy={() => {}} />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.getAttribute("tabIndex")).toBe("0");
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<DiscountCodeDisplay code="SAVE20" className="custom-class" />);
      const wrapper = container.querySelector(".custom-class");
      expect(wrapper).toBeInTheDocument();
    });

    it("applies custom inline styles", () => {
      const { container } = render(
        <DiscountCodeDisplay code="SAVE20" style={{ marginTop: "20px" }} />
      );
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.marginTop).toBe("20px");
    });
  });
});

