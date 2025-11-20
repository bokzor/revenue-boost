import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import {
  PopupCard,
  PopupButton,
  PopupInput,
  CloseButton,
  varsFromDesign
} from "~/domains/storefront/popups-new/components/primitives";

describe("Popup Primitives", () => {
  describe("theme utility", () => {
    it("generates CSS variables from design config", () => {
      const design = {
        backgroundColor: "#ff0000",
        textColor: "#00ff00",
        borderRadius: 20,
        size: "medium" as const,
      } as any;
      
      const { style, "data-size": sizeAttr } = varsFromDesign(design, "medium");
      
      expect((style as any)["--rb-popup-bg"]).toBe("#ff0000");
      expect((style as any)["--rb-popup-fg"]).toBe("#00ff00");
      expect((style as any)["--rb-popup-radius"]).toBe("20px");
      expect((style as any)["--rb-popup-max-w"]).toBe("600px"); // Medium size
      expect(sizeAttr).toBe("medium");
    });
  });

  describe("PopupCard", () => {
    it("renders with correct classes and styles", () => {
      const design = { backgroundColor: "#fff", textColor: "#000" } as any;
      render(
        <PopupCard design={design} size="large" variant="cart" data-testid="card">
          Content
        </PopupCard>
      );
      
      const card = screen.getByTestId("card");
      expect(card.getAttribute("data-size")).toBe("large");
      // Check for CSS module class (class name will be hashed, but we can check style prop)
      // Actually, we can't easily check hashed class without import, but we can check style vars
      // Check if style contains correct max-width for cart variant large
      expect(card.getAttribute("style")).toContain("--rb-popup-max-w: 840px");
    });
  });

  describe("PopupButton", () => {
    it("renders as a button by default", () => {
      render(<PopupButton>Click me</PopupButton>);
      expect(screen.getByRole("button").textContent).toContain("Click me");
    });

    it("renders as an anchor when href is provided", () => {
      render(<PopupButton href="/foo">Link</PopupButton>);
      const link = screen.getByRole("button");
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("href")).toBe("/foo");
    });

    it("handles loading state", () => {
      render(<PopupButton loading>Submit</PopupButton>);
      const btn = screen.getByRole("button");
      expect((btn as HTMLButtonElement).disabled).toBe(true);
      expect(btn.getAttribute("aria-busy")).toBe("true");
    });
  });

  describe("PopupInput", () => {
    it("renders input with label", () => {
      render(<PopupInput label="Email" id="email" />);
      expect(screen.getByLabelText("Email")).toBeTruthy();
    });

    it("shows error state", () => {
      render(<PopupInput errorText="Invalid email" />);
      const input = screen.getByRole("textbox");
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByRole("alert").textContent).toContain("Invalid email");
    });
  });

  describe("CloseButton", () => {
    it("renders with correct aria-label", () => {
      render(<CloseButton onClick={() => {}} />);
      expect(screen.getByLabelText("Close popup")).toBeTruthy();
    });

    it("calls onClick when clicked", () => {
      const fn = vi.fn();
      render(<CloseButton onClick={fn} />);
      fireEvent.click(screen.getByRole("button"));
      expect(fn).toHaveBeenCalled();
    });
  });
});
