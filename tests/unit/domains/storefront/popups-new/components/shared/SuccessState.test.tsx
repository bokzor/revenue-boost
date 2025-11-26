import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuccessState } from "~/domains/storefront/popups-new/components/shared/SuccessState";

describe("SuccessState", () => {
  describe("Basic Rendering", () => {
    it("renders the success message", () => {
      render(<SuccessState message="Thanks for subscribing!" />);
      expect(screen.getByText("Thanks for subscribing!")).toBeInTheDocument();
    });

    it("renders the checkmark icon by default", () => {
      const { container } = render(<SuccessState message="Success!" />);
      // Checkmark is rendered as an SVG
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders custom icon when provided", () => {
      render(<SuccessState message="Success!" icon={<span data-testid="custom-icon">🎉</span>} />);
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });
  });

  describe("Discount Code Integration", () => {
    it("renders without discount code", () => {
      render(<SuccessState message="Success!" />);
      expect(screen.queryByText(/discount/i)).not.toBeInTheDocument();
    });

    it("renders with discount code", () => {
      render(<SuccessState message="Success!" discountCode="SAVE20" />);
      expect(screen.getByText("SAVE20")).toBeInTheDocument();
    });

    it("renders discount code with label", () => {
      render(
        <SuccessState
          message="Success!"
          discountCode="SAVE20"
          discountLabel="Your discount code:"
        />
      );
      expect(screen.getByText("Your discount code:")).toBeInTheDocument();
      expect(screen.getByText("SAVE20")).toBeInTheDocument();
    });

    it("calls onCopyCode when discount code is clicked", () => {
      const onCopyCode = vi.fn();
      const { container } = render(
        <SuccessState message="Success!" discountCode="SAVE20" onCopyCode={onCopyCode} />
      );
      const discountCode = screen.getByText("SAVE20").closest("div");
      discountCode?.click();
      expect(onCopyCode).toHaveBeenCalledTimes(1);
    });

    it("shows copied state for discount code", () => {
      const { container } = render(
        <SuccessState message="Success!" discountCode="SAVE20" copiedCode={true} />
      );
      // Should show checkmarks (one in success icon, one in discount code)
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(1);
    });
  });

  describe("Animations", () => {
    it("renders with bounceIn animation by default", () => {
      const { container } = render(<SuccessState message="Success!" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with fade animation", () => {
      const { container } = render(<SuccessState message="Success!" animation="fade" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with zoom animation", () => {
      const { container } = render(<SuccessState message="Success!" animation="zoom" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with slideUp animation", () => {
      const { container } = render(<SuccessState message="Success!" animation="slideUp" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Colors", () => {
    it("renders with default success color", () => {
      const { container } = render(<SuccessState message="Success!" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom success color", () => {
      const { container } = render(<SuccessState message="Success!" successColor="#00ff00" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders with custom accent color for discount code", () => {
      const { container } = render(
        <SuccessState message="Success!" discountCode="SAVE20" accentColor="#ff0000" />
      );
      expect(screen.getByText("SAVE20")).toBeInTheDocument();
    });

    it("uses custom text color", () => {
      const { container } = render(<SuccessState message="Success!" textColor="#333333" />);
      const message = screen.getByText("Success!");
      expect(message.style.color).toBe("#333333");
    });
  });

  describe("Typography", () => {
    it("uses default font size", () => {
      render(<SuccessState message="Success!" />);
      const message = screen.getByText("Success!");
      expect(message.style.fontSize).toBe("1.875rem");
    });

    it("uses custom font size", () => {
      render(<SuccessState message="Success!" fontSize="2rem" />);
      const message = screen.getByText("Success!");
      expect(message.style.fontSize).toBe("2rem");
    });

    it("uses default font weight", () => {
      render(<SuccessState message="Success!" />);
      const message = screen.getByText("Success!");
      expect(message.style.fontWeight).toBe("700");
    });

    it("uses custom font weight", () => {
      render(<SuccessState message="Success!" fontWeight="900" />);
      const message = screen.getByText("Success!");
      expect(message.style.fontWeight).toBe("900");
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<SuccessState message="Success!" className="custom-class" />);
      const wrapper = container.querySelector(".custom-class");
      expect(wrapper).toBeInTheDocument();
    });

    it("applies custom inline styles", () => {
      const { container } = render(
        <SuccessState message="Success!" style={{ marginTop: "20px" }} />
      );
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.marginTop).toBe("20px");
    });
  });
});

