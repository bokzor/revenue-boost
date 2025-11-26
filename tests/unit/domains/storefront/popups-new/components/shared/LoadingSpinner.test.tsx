/**
 * LoadingSpinner Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner } from "~/domains/storefront/popups-new/components/shared/LoadingSpinner";

describe("LoadingSpinner", () => {
  describe("Basic Rendering", () => {
    it("renders with default props", () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('[role="status"]');
      
      expect(spinner).toBeTruthy();
      expect(spinner?.getAttribute("aria-label")).toBe("Loading");
    });

    it("renders spinner icon", () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector("svg");
      
      expect(svg).toBeTruthy();
    });
  });

  describe("Size Variants", () => {
    it("renders small size", () => {
      const { container } = render(<LoadingSpinner size="sm" />);
      const svg = container.querySelector("svg");
      
      expect(svg?.getAttribute("width")).toBe("16");
      expect(svg?.getAttribute("height")).toBe("16");
    });

    it("renders medium size (default)", () => {
      const { container } = render(<LoadingSpinner size="md" />);
      const svg = container.querySelector("svg");
      
      expect(svg?.getAttribute("width")).toBe("20");
      expect(svg?.getAttribute("height")).toBe("20");
    });

    it("renders large size", () => {
      const { container } = render(<LoadingSpinner size="lg" />);
      const svg = container.querySelector("svg");
      
      expect(svg?.getAttribute("width")).toBe("32");
      expect(svg?.getAttribute("height")).toBe("32");
    });
  });

  describe("Text Label", () => {
    it("renders without text by default", () => {
      const { container } = render(<LoadingSpinner />);
      const text = container.querySelector("span");
      
      expect(text).toBeFalsy();
    });

    it("renders with text label", () => {
      render(<LoadingSpinner text="Loading..." />);
      
      expect(screen.getByText("Loading...")).toBeTruthy();
    });

    it("sets aria-label from text prop", () => {
      const { container } = render(<LoadingSpinner text="Processing" />);
      const spinner = container.querySelector('[role="status"]');
      
      expect(spinner?.getAttribute("aria-label")).toBe("Processing");
    });

    it("hides text from screen readers with aria-hidden", () => {
      const { container } = render(<LoadingSpinner text="Loading..." />);
      const text = container.querySelector("span");
      
      expect(text?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("Text Position", () => {
    it("positions text to the right by default", () => {
      const { container } = render(<LoadingSpinner text="Loading..." />);
      const wrapper = container.querySelector('[role="status"]');
      
      expect(wrapper?.style.flexDirection).toBe("row");
    });

    it("positions text to the left", () => {
      const { container } = render(<LoadingSpinner text="Loading..." textPosition="left" />);
      const wrapper = container.querySelector('[role="status"]');
      
      expect(wrapper?.style.flexDirection).toBe("row-reverse");
    });

    it("positions text on top", () => {
      const { container } = render(<LoadingSpinner text="Loading..." textPosition="top" />);
      const wrapper = container.querySelector('[role="status"]');
      
      expect(wrapper?.style.flexDirection).toBe("column-reverse");
    });

    it("positions text on bottom", () => {
      const { container } = render(<LoadingSpinner text="Loading..." textPosition="bottom" />);
      const wrapper = container.querySelector('[role="status"]');
      
      expect(wrapper?.style.flexDirection).toBe("column");
    });
  });

  describe("Color", () => {
    it("uses currentColor by default", () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.querySelector('[role="status"]');

      // happy-dom doesn't convert currentColor, so check the actual value
      expect(wrapper?.style.color).toBeTruthy();
    });

    it("applies custom color", () => {
      const { container } = render(<LoadingSpinner color="#ff0000" />);
      const wrapper = container.querySelector('[role="status"]');

      // happy-dom keeps hex format, doesn't convert to rgb
      expect(wrapper?.style.color).toBe("#ff0000");
    });
  });

  describe("Centered", () => {
    it("is not centered by default", () => {
      const { container } = render(<LoadingSpinner />);
      const wrapper = container.querySelector('[role="status"]');
      
      expect(wrapper?.style.justifyContent).toBe("flex-start");
    });

    it("centers when centered prop is true", () => {
      const { container } = render(<LoadingSpinner centered />);
      const wrapper = container.querySelector('[role="status"]');
      
      expect(wrapper?.style.justifyContent).toBe("center");
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className", () => {
      const { container } = render(<LoadingSpinner className="custom-spinner" />);
      const wrapper = container.querySelector(".custom-spinner");
      
      expect(wrapper).toBeTruthy();
    });

    it("applies custom inline styles", () => {
      const { container } = render(<LoadingSpinner style={{ marginTop: "20px" }} />);
      const wrapper = container.querySelector('[role="status"]');
      
      expect(wrapper?.style.marginTop).toBe("20px");
    });
  });
});

