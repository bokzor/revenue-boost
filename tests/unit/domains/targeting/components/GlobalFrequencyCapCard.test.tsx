/**
 * Unit Tests for GlobalFrequencyCapCard Component
 *
 * Tests the cross-campaign coordination UI including:
 * - Display of global settings values
 * - Best practice recommendations
 * - Toggle behavior
 * - Different state visualizations
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PolarisTestProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

import { GlobalFrequencyCapCard } from "~/domains/targeting/components/GlobalFrequencyCapCard";
import { GLOBAL_FREQUENCY_BEST_PRACTICES } from "~/domains/store/types/settings";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";

// Helper to render with Polaris provider
function renderWithPolaris(component: React.ReactElement) {
  return render(<PolarisTestProvider i18n={enTranslations}>{component}</PolarisTestProvider>);
}

describe("GlobalFrequencyCapCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders the card title", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={true} onGlobalCapChange={vi.fn()} />
      );

      expect(screen.getByText("Cross-Campaign Coordination")).toBeTruthy();
    });

    it("renders the checkbox", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={true} onGlobalCapChange={vi.fn()} />
      );

      expect(screen.getByText("Respect global frequency cap")).toBeTruthy();
    });

    it("shows checkbox as checked when respectGlobalCap is true", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={true} onGlobalCapChange={vi.fn()} />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeChecked();
    });

    it("shows checkbox as unchecked when respectGlobalCap is false", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={false} onGlobalCapChange={vi.fn()} />
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("Toggle Behavior", () => {
    it("calls onGlobalCapChange when checkbox is clicked", () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={true} onGlobalCapChange={onChange} />
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      // Polaris Checkbox onChange passes (newValue, id) - we only care about the first arg
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0]).toBe(false);
    });

    it("calls onGlobalCapChange with true when enabling", () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={false} onGlobalCapChange={onChange} />
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      // Polaris Checkbox onChange passes (newValue, id) - we only care about the first arg
      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.calls[0][0]).toBe(true);
    });
  });

  describe("Warning Banner (when disabled)", () => {
    it("shows warning banner when respectGlobalCap is false", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={false} onGlobalCapChange={vi.fn()} />
      );

      expect(screen.getByText("Independent frequency tracking")).toBeTruthy();
    });

    it("warns about popup fatigue", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={false} onGlobalCapChange={vi.fn()} />
      );

      expect(screen.getByText(/Visitors may see multiple popups/)).toBeTruthy();
    });
  });

  describe("Global Settings Display (when enabled with limits)", () => {
    const globalSettingsWithLimits: GlobalFrequencyCappingSettings = {
      enabled: true,
      max_per_session: 3,
      max_per_day: 10,
      cooldown_between_popups: 60,
    };

    it("shows Active badge when global settings are enabled", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsWithLimits}
        />
      );

      expect(screen.getByText("Active")).toBeTruthy();
    });

    it("displays max per session value", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsWithLimits}
        />
      );

      expect(screen.getByText("3")).toBeTruthy();
      expect(screen.getByText(/popups per session/)).toBeTruthy();
    });

    it("displays max per day value", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsWithLimits}
        />
      );

      expect(screen.getByText("10")).toBeTruthy();
      expect(screen.getByText(/popups per day/)).toBeTruthy();
    });

    it("displays cooldown in human-readable format (seconds)", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={{ ...globalSettingsWithLimits, cooldown_between_popups: 45 }}
        />
      );

      expect(screen.getByText("45 seconds")).toBeTruthy();
    });

    it("displays cooldown in minutes when >= 60 seconds", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={{ ...globalSettingsWithLimits, cooldown_between_popups: 120 }}
        />
      );

      expect(screen.getByText("2 minutes")).toBeTruthy();
    });

    it("displays cooldown in hours when >= 3600 seconds", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={{ ...globalSettingsWithLimits, cooldown_between_popups: 7200 }}
        />
      );

      expect(screen.getByText("2 hours")).toBeTruthy();
    });

    it("shows success banner with global coordination enabled text", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsWithLimits}
        />
      );

      expect(screen.getByText("Global coordination enabled")).toBeTruthy();
    });

    it("shows link to settings page", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsWithLimits}
        />
      );

      expect(screen.getByText("Manage global limits in Settings →")).toBeTruthy();
    });
  });

  describe("Best Practices Recommendations (when enabled without limits)", () => {
    const globalSettingsNoLimits: GlobalFrequencyCappingSettings = {
      enabled: false,
    };

    it("shows info banner when global capping is enabled but store settings are not", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsNoLimits}
        />
      );

      expect(screen.getByText("Global coordination enabled, but no limits set")).toBeTruthy();
    });

    it("displays best practice max per session recommendation", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsNoLimits}
        />
      );

      expect(
        screen.getByText(`${GLOBAL_FREQUENCY_BEST_PRACTICES.max_per_session} popups per session`)
      ).toBeTruthy();
    });

    it("displays best practice max per day recommendation", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsNoLimits}
        />
      );

      expect(
        screen.getByText(`${GLOBAL_FREQUENCY_BEST_PRACTICES.max_per_day} popups per day`)
      ).toBeTruthy();
    });

    it("displays best practice cooldown recommendation", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsNoLimits}
        />
      );

      expect(screen.getByText(/30 seconds cooldown/)).toBeTruthy();
    });

    it("shows link to configure global limits", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={globalSettingsNoLimits}
        />
      );

      expect(screen.getByText("Configure global limits in Settings →")).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("does not show Active badge when global settings are undefined", () => {
      renderWithPolaris(
        <GlobalFrequencyCapCard respectGlobalCap={true} onGlobalCapChange={vi.fn()} />
      );

      expect(screen.queryByText("Active")).toBeNull();
    });

    it("handles partial global settings gracefully", () => {
      const partialSettings: GlobalFrequencyCappingSettings = {
        enabled: true,
        max_per_session: 2,
        // no max_per_day or cooldown
      };

      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={partialSettings}
        />
      );

      // Should show the max_per_session
      expect(screen.getByText("2")).toBeTruthy();
      // Should not crash or show undefined values
      expect(screen.queryByText("undefined")).toBeNull();
    });

    it("does not show cooldown line when cooldown is 0", () => {
      const settingsWithZeroCooldown: GlobalFrequencyCappingSettings = {
        enabled: true,
        max_per_session: 2,
        cooldown_between_popups: 0,
      };

      renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={settingsWithZeroCooldown}
        />
      );

      expect(screen.queryByText(/cooldown between popups/)).toBeNull();
    });

    it("shows singular 'popup' when max is 1", () => {
      const settingsWithSinglePopup: GlobalFrequencyCappingSettings = {
        enabled: true,
        max_per_session: 1,
        max_per_day: 1,
      };

      const { container } = renderWithPolaris(
        <GlobalFrequencyCapCard
          respectGlobalCap={true}
          onGlobalCapChange={vi.fn()}
          globalSettings={settingsWithSinglePopup}
        />
      );

      // Check for singular form "popup" instead of "popups" by checking the full text content
      // The text is split across multiple elements due to nested Text components
      const bannerContent = container.textContent || "";
      // Should have "popup per session" (singular) not "popups per session" (plural)
      expect(bannerContent).toContain("popup per session");
      expect(bannerContent).not.toContain("popups per session");
    });
  });
});
