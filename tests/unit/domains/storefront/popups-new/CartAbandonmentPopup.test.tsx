import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { CartAbandonmentPopup } from "~/domains/storefront/popups-new/CartAbandonmentPopup";
import { challengeTokenStore } from "~/domains/storefront/services/challenge-token.client";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "cart-test",
    headline: "You left items in your cart",
    subheadline: "Complete your order now",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    overlayOpacity: 0.5,
    currency: "USD",
    showCartItems: true,
    showCartTotal: true,
    previewMode: true,
  };

  return { ...baseConfig, ...overrides };
}

describe("CartAbandonmentPopup", () => {
  it("renders cart items and total when visible", async () => {
    const config = createConfig();
    const cartItems = [
      {
        id: "item-1",
        variantId: "gid://shopify/ProductVariant/1",
        title: "Test Product",
        quantity: 2,
        price: "49.99",
        imageUrl: "https://example.com/product.jpg",
      },
    ];

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={cartItems}
        cartTotal={99.98}
      />,
    );

    expect(await screen.findByText(/test product/i)).toBeTruthy();
    expect(screen.getByText(/qty: 2/i)).toBeTruthy();
    expect(screen.getByText(/total:/i)).toBeTruthy();
  });

  it("calls onEmailRecovery with entered email when email recovery is enabled", async () => {
    const campaignId = "camp-1";
    const config = createConfig({
      enableEmailRecovery: true,
      campaignId,
    });

    // Seed challenge token and session id for secure submission
    challengeTokenStore.set(
      campaignId,
      "test-token",
      new Date(Date.now() + 600_000).toISOString(),
    );

    const sessionGetItem = vi
      .spyOn(window.sessionStorage.__proto__, "getItem")
      .mockReturnValue("session-123");

    const fetchMock = vi
      .spyOn(globalThis, "fetch" as any)
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          discountCode: null,
          deliveryMode: "show_code_fallback",
          autoApplyMode: "ajax",
        }),
      } as any);

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={[]}
        cartTotal={0}
      />,
    );

    const emailInput = screen.getByPlaceholderText(
      /enter your email to receive your cart and discount/i,
    );

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", {
      name: /email me my cart/i,
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/apps/revenue-boost/api/cart/email-recovery",
        expect.objectContaining({ method: "POST" }),
      );
    });

    sessionGetItem.mockRestore();
  });

  it("shows validation error and uses custom error message when email is invalid", async () => {
    const config = createConfig({
      enableEmailRecovery: true,
      emailErrorMessage: "Custom error",
    });

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={[]}
        cartTotal={0}
        onEmailRecovery={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const submitButton = screen.getByRole("button", {
      name: /email me my cart/i,
    });

    // Submit with empty email
    fireEvent.click(submitButton);

    expect(await screen.findByText(/custom error/i)).toBeTruthy();
  });

  it("hides primary and save-for-later buttons when requireEmailBeforeCheckout is true", () => {
    const config = createConfig({
      enableEmailRecovery: true,
      requireEmailBeforeCheckout: true,
      saveForLaterText: "Save for later",
    });

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={[]}
        cartTotal={0}
        onEmailRecovery={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /resume checkout/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /save for later/i }),
    ).toBeNull();
  });
  it("shows discount code and re-enables CTAs after successful email recovery when gating is on", async () => {
    const campaignId = "camp-2";
    const config = createConfig({
      enableEmailRecovery: true,
      requireEmailBeforeCheckout: true,
      saveForLaterText: "Save for later",
      campaignId,
      discount: {
        enabled: true,
        deliveryMode: "show_code_always",
      },
    });

    challengeTokenStore.set(
      campaignId,
      "test-token",
      new Date(Date.now() + 600_000).toISOString(),
    );

    vi
      .spyOn(window.sessionStorage.__proto__, "getItem")
      .mockReturnValue("session-456");

    vi.spyOn(globalThis, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        discountCode: "SAVE10",
        deliveryMode: "show_code_always",
        autoApplyMode: "ajax",
      }),
    } as any);

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={[]}
        cartTotal={0}
      />,
    );

    // Initially, gating is active: no primary or save-for-later buttons
    expect(
      screen.queryByRole("button", { name: /resume checkout/i }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /save for later/i }),
    ).toBeNull();

    const emailInput = screen.getByPlaceholderText(
      /enter your email to receive your cart and discount/i,
    );

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", {
      name: /email me my cart/i,
    });

    fireEvent.click(submitButton);

    expect(await screen.findByText(/save10/i)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /copy/i }),
    ).toBeTruthy();

    // After successful email recovery, CTAs should be visible again
    expect(
      screen.getByRole("button", { name: /resume checkout/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /save for later/i }),
    ).toBeTruthy();
  });


  it("shows discount code when CTA issues discount in show_code_always mode", async () => {
    const config = createConfig({
      ctaUrl: "/checkout",
      discount: {
        enabled: true,
        deliveryMode: "show_code_always",
      },
    });

    const issueDiscount = vi
      .fn()
      .mockResolvedValue({ code: "CTA10", autoApplyMode: "none" });

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={[]}
        cartTotal={50}
        issueDiscount={issueDiscount}
      />,
    );

    const resumeButton = screen.getByRole("button", {
      name: /resume checkout/i,
    });

    fireEvent.click(resumeButton);

    expect(await screen.findByText(/cta10/i)).toBeTruthy();
  });



  it("calls issueDiscount when discount is enabled and user resumes checkout", async () => {
    const config = createConfig({
      ctaUrl: "/checkout",
      discount: {
        enabled: true,
        code: "SAVE10",
        deliveryMode: "show_code_fallback",
      },
    });

    const issueDiscount = vi
      .fn()
      .mockResolvedValue({ code: "SAVE10", autoApplyMode: "ajax" });

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={[]}
        cartTotal={99.98}
        issueDiscount={issueDiscount}
      />,
    );

    const resumeButton = screen.getByRole("button", {
      name: /resume checkout/i,
    });

    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(issueDiscount).toHaveBeenCalledTimes(1);
    });

    expect(issueDiscount).toHaveBeenCalledWith({ cartSubtotalCents: 9998 });
  });





});
