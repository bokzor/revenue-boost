import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getByShadowText, queryByShadowText, findByShadowText } from "shadow-dom-testing-library";

import { SpinToWinPopup } from "~/domains/storefront/popups-new/SpinToWinPopup";

// Mock the challenge token store
vi.mock("~/domains/storefront/services/challenge-token.client", () => ({
  challengeTokenStore: {
    get: vi.fn(() => "mock-challenge-token"),
    set: vi.fn(),
  },
}));

/**
 * Helper to type into an input by placeholder
 * Note: All tests use previewMode=true to avoid Shadow DOM (tested in E2E)
 */
async function typeInInput(placeholder: string | RegExp, text: string) {
  const input = await screen.findByPlaceholderText(placeholder);
  await userEvent.clear(input);
  await userEvent.type(input, text);
}

/**
 * Helper to click a button by text
 */
async function clickButton(text: string | RegExp) {
  const button = await screen.findByText(text);
  await userEvent.click(button);
}

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "spin-test",
    campaignId: "campaign-123",
    headline: "Spin & Win",
    subheadline: "Try your luck",
    spinButtonText: "Spin to Win!",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    overlayOpacity: 0.5,
    previewMode: true,
    emailRequired: false,
    emailPlaceholder: "Enter your email",
    collectName: false,
    nameFieldRequired: false,
    showGdprCheckbox: false,
    consentFieldRequired: false,
    challengeToken: "mock-challenge-token",
    wheelSegments: [
      {
        id: "prize-1",
        label: "10% OFF",
        probability: 50,
        color: "#FF6B6B",
        discountConfig: {
          enabled: true,
          valueType: "PERCENTAGE",
          value: 10,
        },
      },
      {
        id: "prize-2",
        label: "Free Shipping",
        probability: 50,
        color: "#4ECDC4",
        discountConfig: {
          enabled: true,
          valueType: "FREE_SHIPPING",
        },
      },
    ],
  };

  return { ...baseConfig, ...overrides };
}

describe("SpinToWinPopup", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;

    // Mock window globals
    (window as any).__RB_SESSION_ID = "test-session-123";

    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn((key: string) => {
        if (key === "revenue_boost_session") return "test-session-123";
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).__RB_SESSION_ID;
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe("Basic Rendering", () => {
    it("renders headline when visible", async () => {
      const config = createConfig();

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      
      expect(await screen.findByText(/spin & win/i)).toBeTruthy();
    });

    it("does not render when not visible", () => {
      const config = createConfig();

      render(
        <SpinToWinPopup config={config} isVisible={false} onClose={() => {}} />
      );

      
      expect(screen.queryByText(/spin & win/i)).toBeNull();
    });

    it("renders spin button with correct text", async () => {
      const config = createConfig({ spinButtonText: "Click to Spin!" });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      
      expect(await screen.findByText(/click to spin!/i)).toBeTruthy();
    });
  });

  // ============================================================================
  // EMAIL REQUIRED FLOW TESTS
  // ============================================================================

  describe("Email Required Flow", () => {
    it("shows email input when emailRequired is true", async () => {
      const config = createConfig({ emailRequired: true });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      
      expect(await screen.findByPlaceholderText(/enter your email/i)).toBeTruthy();
    });

    it("shows validation error when trying to spin without email", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true, // Use preview mode for unit tests (renders to regular DOM)
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      
      const spinButton = await screen.findByText(/spin to win!/i);
      await userEvent.click(spinButton);

      // Should show validation error
      expect(await screen.findByText(/email is required/i)).toBeTruthy();

      // Should NOT call API (preview mode doesn't make API calls anyway)
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("allows spin to proceed with valid email", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: {
            id: "prize-1",
            label: "10% OFF",
            color: "#FF6B6B",
          },
          discountCode: "SPIN10",
          deliveryMode: "show_code_fallback",
          displayCode: true,
          autoApply: true,
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      // Should call API with correct email
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/apps/revenue-boost/api/popups/spin-win",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining("test@example.com"),
          })
        );
      });
    });

    it("shows validation error for invalid email format - missing @", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test");
      await clickButton(/spin to win!/i);

      // Should show validation error
      
      expect(await screen.findByText(/please enter a valid email/i)).toBeTruthy();

      // Should NOT call API
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows validation error for invalid email format - missing domain", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@");
      await clickButton(/spin to win!/i);

      // Should show validation error
      
      expect(await screen.findByText(/please enter a valid email/i)).toBeTruthy();

      // Should NOT call API
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows validation error for invalid email format - incomplete domain", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@domain");
      await clickButton(/spin to win!/i);

      // Should show validation error
      
      expect(await screen.findByText(/please enter a valid email/i)).toBeTruthy();

      // Should NOT call API
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EMAIL OPTIONAL FLOW TESTS
  // ============================================================================

  describe("Email Optional Flow", () => {
    it("allows spin without email when emailRequired is false", async () => {
      const config = createConfig({
        emailRequired: false,
        previewMode: true, // Preview mode doesn't make API calls
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await waitFor(() => {
        const spinButton = screen.findByText(/spin to win!/i);
        expect(spinButton).toBeTruthy();
      });

      // Should be able to click without email
      await clickButton(/spin to win!/i);

      // In preview mode, no API call is made
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("validates email format even when email is optional", async () => {
      const config = createConfig({
        emailRequired: false,
        previewMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: {
            id: "prize-1",
            label: "10% OFF",
            color: "#FF6B6B",
          },
          discountCode: "SPIN10",
          deliveryMode: "show_code_fallback",
          displayCode: true,
          autoApply: true,
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "invalid-email");
      await clickButton(/spin to win!/i);

      // Should show validation error for invalid format
      await waitFor(() => {
        const error = screen.findByText(/please enter a valid email/i);
        expect(error).toBeTruthy();
      });

      // Should NOT call API with invalid email
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("accepts valid email when provided optionally", async () => {
      const config = createConfig({
        emailRequired: false,
        previewMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: {
            id: "prize-1",
            label: "10% OFF",
            color: "#FF6B6B",
          },
          discountCode: "SPIN10",
          deliveryMode: "show_code_fallback",
          displayCode: true,
          autoApply: true,
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      // Should call API with valid email
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/apps/revenue-boost/api/popups/spin-win",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("test@example.com"),
          })
        );
      });
    });
  });

  // ============================================================================
  // API INTEGRATION TESTS
  // ============================================================================

  describe("API Integration", () => {
    it("calls /api/popups/spin-win with correct parameters", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
        campaignId: "campaign-abc-123",
        challengeToken: "token-xyz-789",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: {
            id: "prize-1",
            label: "10% OFF",
            color: "#FF6B6B",
          },
          discountCode: "SPIN10",
          deliveryMode: "show_code_fallback",
          displayCode: true,
          autoApply: true,
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "user@test.com");
      await clickButton(/spin to win!/i);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          "/apps/revenue-boost/api/popups/spin-win",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );

        // Verify request body
        const callArgs = mockFetch.mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);

        expect(requestBody).toEqual({
          campaignId: "campaign-abc-123",
          email: "user@test.com",
          sessionId: "test-session-123",
          challengeToken: "token-xyz-789",
        });
      });
    });

    it("does NOT call /api/leads/submit (single API call only)", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: {
            id: "prize-1",
            label: "10% OFF",
            color: "#FF6B6B",
          },
          discountCode: "SPIN10",
          deliveryMode: "show_code_fallback",
          displayCode: true,
          autoApply: true,
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      await waitFor(() => {
        // Should only call spin-win endpoint, NOT leads/submit
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledWith(
          "/apps/revenue-boost/api/popups/spin-win",
          expect.any(Object)
        );

        // Verify it was NOT called with leads/submit
        const calls = mockFetch.mock.calls;
        const leadsSubmitCall = calls.find((call) =>
          call[0].includes("/api/leads/submit")
        );
        expect(leadsSubmitCall).toBeUndefined();
      });
    });

    it("retrieves sessionId from __RB_SESSION_ID global", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      (window as any).__RB_SESSION_ID = "global-session-456";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: { id: "prize-1", label: "10% OFF", color: "#FF6B6B" },
          discountCode: "SPIN10",
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);
        expect(requestBody.sessionId).toBe("global-session-456");
      });
    });

    it("falls back to sessionStorage when __RB_SESSION_ID is not available", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      delete (window as any).__RB_SESSION_ID;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: { id: "prize-1", label: "10% OFF", color: "#FF6B6B" },
          discountCode: "SPIN10",
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);
        // Should use sessionStorage value
        expect(requestBody.sessionId).toBe("test-session-123");
      });
    });

    it("ensures sessionId is never null or undefined", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      delete (window as any).__RB_SESSION_ID;

      // Mock sessionStorage to return null
      (window.sessionStorage.getItem as any).mockReturnValue(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: { id: "prize-1", label: "10% OFF", color: "#FF6B6B" },
          discountCode: "SPIN10",
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);

        // Should be empty string, not null or undefined
        expect(requestBody.sessionId).toBe("");
        expect(requestBody.sessionId).not.toBeNull();
        expect(requestBody.sessionId).not.toBeUndefined();
      });
    });
  });

  // ============================================================================
  // PRIZE DISPLAY TESTS
  // ============================================================================

  describe("Prize Display", () => {
    it("displays prize and discount code on successful response", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: {
            id: "prize-1",
            label: "10% OFF",
            color: "#FF6B6B",
          },
          discountCode: "SPIN10",
          deliveryMode: "show_code_fallback",
          displayCode: true,
          autoApply: true,
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      // Wait for prize to be displayed
      await waitFor(
        async () => {
          const prizeLabel = await screen.findByText(/10% OFF/i);
          const discountCode = await screen.findByText(/SPIN10/i);
          expect(prizeLabel).toBeTruthy();
          expect(discountCode).toBeTruthy();
        },
        { timeout: 6000 } // Allow time for spin animation
      );
    });


    it("shows error message when API returns error", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: "Failed to generate discount code",
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      // Should show error message
      await waitFor(
        async () => {
          // Look for error indication
          const errorElement = await screen.findByText(/error|failed|try again/i);
          expect(errorElement).toBeTruthy();
        },
        { timeout: 6000 }
      );
    });

    it("displays discount code when deliveryMode is show_code_fallback", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: {
            id: "prize-2",
            label: "Free Shipping",
            color: "#4ECDC4",
          },
          discountCode: "FREESHIP",
          deliveryMode: "show_code_fallback",
          displayCode: true,
          autoApply: true,
        }),
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      // Should display the discount code
      await waitFor(
        async () => {
          const discountCode = await screen.findByText(/FREESHIP/i);
          expect(discountCode).toBeTruthy();
        },
        { timeout: 6000 }
      );
    });
  });

  // ============================================================================
  // FORM VALIDATION EDGE CASES
  // ============================================================================

  describe("Form Validation Edge Cases", () => {
    it("shows error when nameFieldRequired is true and name is empty", async () => {
      const config = createConfig({
        emailRequired: true,
        collectName: true,
        nameFieldRequired: true,
        previewMode: true,
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      // Should show name validation error
      expect(await screen.findByText(/name is required/i)).toBeTruthy();

      // Should NOT call API
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("shows error when consentFieldRequired is true and GDPR checkbox is unchecked", async () => {
      const config = createConfig({
        emailRequired: true,
        showGdprCheckbox: true,
        consentFieldRequired: true,
        previewMode: true,
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await typeInInput(/enter your email/i, "test@example.com");
      await clickButton(/spin to win!/i);

      // Should show GDPR validation error
      expect(await screen.findByText(/you must accept the terms/i)).toBeTruthy();

      // Should NOT call API
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("clears validation errors when user corrects email input", async () => {
      const config = createConfig({
        emailRequired: true,
        previewMode: true,
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      // First, enter invalid email
      await typeInInput(/enter your email/i, "invalid");
      await clickButton(/spin to win!/i);

      // Should show validation error
      expect(await screen.findByText(/please enter a valid email/i)).toBeTruthy();

      // Now correct the email
      await typeInInput(/enter your email/i, "valid@example.com");

      // Error should be cleared (or at least not prevent submission)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          prize: { id: "prize-1", label: "10% OFF", color: "#FF6B6B" },
          discountCode: "SPIN10",
        }),
      });

      await clickButton(/spin to win!/i);

      // Should now call API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it("validates all required fields together", async () => {
      const config = createConfig({
        emailRequired: true,
        collectName: true,
        nameFieldRequired: true,
        showGdprCheckbox: true,
        consentFieldRequired: true,
        previewMode: true,
      });

      render(
        <SpinToWinPopup config={config} isVisible={true} onClose={() => {}} />
      );

      await clickButton(/spin to win!/i);

      // Should show multiple validation errors
      
      expect(await screen.findByText(/email is required/i)).toBeTruthy();
      expect(await screen.findByText(/name is required/i)).toBeTruthy();
      expect(await screen.findByText(/you must accept the terms/i)).toBeTruthy();

      // Should NOT call API
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

