import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PopupHeader } from "~/domains/storefront/popups-new/components/shared/PopupHeader";

describe("PopupHeader", () => {
  describe("Basic Rendering", () => {
    it("renders the headline", () => {
      render(<PopupHeader headline="Join Our Newsletter" />);
      expect(screen.getByText("Join Our Newsletter")).toBeInTheDocument();
    });

    it("renders without subheadline", () => {
      render(<PopupHeader headline="Join Our Newsletter" />);
      expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });

    it("renders with subheadline", () => {
      render(
        <PopupHeader
          headline="Join Our Newsletter"
          subheadline="Subscribe to get special offers"
        />
      );
      expect(screen.getByText("Subscribe to get special offers")).toBeInTheDocument();
    });
  });

  describe("Text Alignment", () => {
    it("uses center alignment by default", () => {
      const { container } = render(<PopupHeader headline="Test" />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.textAlign).toBe("center");
    });

    it("uses left alignment", () => {
      const { container } = render(<PopupHeader headline="Test" align="left" />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.textAlign).toBe("left");
    });

    it("uses right alignment", () => {
      const { container } = render(<PopupHeader headline="Test" align="right" />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.textAlign).toBe("right");
    });
  });

  describe("Colors", () => {
    // Note: CSS variables (var(--rb-*)) are used for default colors but
    // happy-dom strips them from the computed style attribute. We verify:
    // 1. CSS variables work via font-family (which IS preserved)
    // 2. Custom color props are applied correctly when provided

    it("uses CSS variables for styling (verified via font-family)", () => {
      render(<PopupHeader headline="Test" />);
      const headline = screen.getByText("Test");
      // Font family uses CSS variables and IS preserved in style attribute
      const styleAttr = headline.getAttribute("style") || "";
      expect(styleAttr).toContain("var(--rb-heading-font-family");
    });

    it("uses custom text color when prop provided", () => {
      render(<PopupHeader headline="Test" textColor="#ff0000" />);
      const headline = screen.getByText("Test");
      // Explicit color prop should be applied directly
      expect(headline.style.color).toBe("#ff0000");
    });

    it("uses CSS variable for subheadline font (verified via font-family)", () => {
      render(<PopupHeader headline="Test" subheadline="Subtitle" />);
      const subheadline = screen.getByText("Subtitle");
      // Font family uses CSS variables and IS preserved
      const styleAttr = subheadline.getAttribute("style") || "";
      expect(styleAttr).toContain("var(--rb-font-family");
    });

    it("uses custom description color for subheadline", () => {
      render(
        <PopupHeader
          headline="Test"
          subheadline="Subtitle"
          textColor="#ff0000"
          descriptionColor="#00ff00"
        />
      );
      const subheadline = screen.getByText("Subtitle");
      // Explicit descriptionColor prop should be applied directly
      expect(subheadline.style.color).toBe("#00ff00");
    });
  });

  describe("Typography", () => {
    it("uses default headline font size", () => {
      render(<PopupHeader headline="Test" />);
      const headline = screen.getByText("Test");
      expect(headline.style.fontSize).toBe("1.875rem");
    });

    it("uses custom headline font size", () => {
      render(<PopupHeader headline="Test" headlineFontSize="2rem" />);
      const headline = screen.getByText("Test");
      expect(headline.style.fontSize).toBe("2rem");
    });

    it("uses default headline font weight", () => {
      render(<PopupHeader headline="Test" />);
      const headline = screen.getByText("Test");
      expect(headline.style.fontWeight).toBe("700");
    });

    it("uses custom headline font weight", () => {
      render(<PopupHeader headline="Test" headlineFontWeight="900" />);
      const headline = screen.getByText("Test");
      expect(headline.style.fontWeight).toBe("900");
    });

    it("uses default subheadline font size", () => {
      render(<PopupHeader headline="Test" subheadline="Subtitle" />);
      const subheadline = screen.getByText("Subtitle");
      expect(subheadline.style.fontSize).toBe("1rem");
    });

    it("uses custom subheadline font size", () => {
      render(<PopupHeader headline="Test" subheadline="Subtitle" subheadlineFontSize="1.25rem" />);
      const subheadline = screen.getByText("Subtitle");
      expect(subheadline.style.fontSize).toBe("1.25rem");
    });

    it("uses default subheadline font weight", () => {
      render(<PopupHeader headline="Test" subheadline="Subtitle" />);
      const subheadline = screen.getByText("Subtitle");
      expect(subheadline.style.fontWeight).toBe("400");
    });

    it("uses custom subheadline font weight", () => {
      render(
        <PopupHeader headline="Test" subheadline="Subtitle" subheadlineFontWeight="600" />
      );
      const subheadline = screen.getByText("Subtitle");
      expect(subheadline.style.fontWeight).toBe("600");
    });
  });

  describe("Spacing", () => {
    it("uses default spacing between headline and subheadline", () => {
      render(<PopupHeader headline="Test" subheadline="Subtitle" />);
      const headline = screen.getByText("Test");
      expect(headline.style.marginBottom).toBe("0.75rem");
    });

    it("uses custom spacing between headline and subheadline", () => {
      render(<PopupHeader headline="Test" subheadline="Subtitle" spacing="1rem" />);
      const headline = screen.getByText("Test");
      expect(headline.style.marginBottom).toBe("1rem");
    });

    it("has no spacing when there is no subheadline", () => {
      render(<PopupHeader headline="Test" />);
      const headline = screen.getByText("Test");
      expect(headline.style.marginBottom).toBe("0px");
    });

    it("uses default bottom margin", () => {
      const { container } = render(<PopupHeader headline="Test" />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.marginBottom).toBe("1.5rem");
    });

    it("uses custom bottom margin", () => {
      const { container } = render(<PopupHeader headline="Test" marginBottom="2rem" />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.marginBottom).toBe("2rem");
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<PopupHeader headline="Test" className="custom-class" />);
      const wrapper = container.querySelector(".custom-class");
      expect(wrapper).toBeInTheDocument();
    });

    it("applies custom inline styles", () => {
      const { container } = render(<PopupHeader headline="Test" style={{ padding: "20px" }} />);
      const wrapper = container.querySelector("div");
      expect(wrapper?.style.padding).toBe("20px");
    });
  });
});

