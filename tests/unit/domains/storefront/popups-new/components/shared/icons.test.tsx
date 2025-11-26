/**
 * Icon Components Tests
 * 
 * Tests for CloseIcon, CheckmarkIcon, SpinnerIcon, and ChevronIcon
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  CloseIcon,
  CheckmarkIcon,
  SpinnerIcon,
  ChevronIcon,
} from "~/domains/storefront/popups-new/components/shared/icons";

describe("CloseIcon", () => {
  it("renders with default props", () => {
    const { container } = render(<CloseIcon />);
    const svg = container.querySelector("svg");
    
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("stroke-width")).toBe("2");
  });

  it("renders with custom size", () => {
    const { container } = render(<CloseIcon size={32} />);
    const svg = container.querySelector("svg");
    
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });

  it("renders with custom color", () => {
    const { container } = render(<CloseIcon color="#ff0000" />);
    const svg = container.querySelector("svg");
    
    expect(svg?.getAttribute("stroke")).toBe("#ff0000");
  });

  it("renders with custom stroke width", () => {
    const { container } = render(<CloseIcon strokeWidth={3} />);
    const svg = container.querySelector("svg");
    
    expect(svg?.getAttribute("stroke-width")).toBe("3");
  });

  it("applies custom className", () => {
    const { container } = render(<CloseIcon className="custom-class" />);
    const svg = container.querySelector("svg");
    
    expect(svg?.classList.contains("custom-class")).toBe(true);
  });
});

describe("CheckmarkIcon", () => {
  it("renders with default props", () => {
    const { container } = render(<CheckmarkIcon />);
    const svg = container.querySelector("svg");
    
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
    expect(svg?.getAttribute("stroke")).toBe("currentColor");
    expect(svg?.getAttribute("stroke-width")).toBe("3");
  });

  it("renders with custom size", () => {
    const { container } = render(<CheckmarkIcon size={32} />);
    const svg = container.querySelector("svg");
    
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });

  it("renders with custom color", () => {
    const { container } = render(<CheckmarkIcon color="#16a34a" />);
    const svg = container.querySelector("svg");
    
    expect(svg?.getAttribute("stroke")).toBe("#16a34a");
  });
});

describe("SpinnerIcon", () => {
  it("renders with default props", () => {
    const { container } = render(<SpinnerIcon />);
    const svg = container.querySelector("svg");
    
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
    expect(svg?.getAttribute("role")).toBe("status");
  });

  it("applies spin animation", () => {
    const { container } = render(<SpinnerIcon />);
    const svg = container.querySelector("svg");
    
    expect(svg?.style.animation).toContain("spin");
  });

  it("renders with custom size", () => {
    const { container } = render(<SpinnerIcon size={16} />);
    const svg = container.querySelector("svg");
    
    expect(svg?.getAttribute("width")).toBe("16");
    expect(svg?.getAttribute("height")).toBe("16");
  });

  it("renders with custom color", () => {
    const { container } = render(<SpinnerIcon color="#ffffff" />);
    const svg = container.querySelector("svg");
    const circle = svg?.querySelector("circle");
    const path = svg?.querySelector("path");
    
    expect(circle?.getAttribute("stroke")).toBe("#ffffff");
    expect(path?.getAttribute("fill")).toBe("#ffffff");
  });
});

describe("ChevronIcon", () => {
  it("renders with default props (down direction)", () => {
    const { container } = render(<ChevronIcon />);
    const svg = container.querySelector("svg");
    
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
    expect(svg?.style.transform).toBe("rotate(0deg)");
  });

  it("renders with up direction", () => {
    const { container } = render(<ChevronIcon direction="up" />);
    const svg = container.querySelector("svg");
    
    expect(svg?.style.transform).toBe("rotate(180deg)");
  });

  it("renders with left direction", () => {
    const { container } = render(<ChevronIcon direction="left" />);
    const svg = container.querySelector("svg");
    
    expect(svg?.style.transform).toBe("rotate(90deg)");
  });

  it("renders with right direction", () => {
    const { container } = render(<ChevronIcon direction="right" />);
    const svg = container.querySelector("svg");
    
    expect(svg?.style.transform).toBe("rotate(270deg)");
  });
});

