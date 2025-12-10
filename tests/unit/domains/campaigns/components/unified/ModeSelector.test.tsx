/**
 * ModeSelector Component Tests
 *
 * Tests the entry point for unified campaign creation where users choose
 * between Single Campaign or A/B Experiment mode.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { ModeSelector, type CreationMode } from "~/domains/campaigns/components/unified/ModeSelector";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("ModeSelector", () => {
  describe("Basic Rendering", () => {
    it("renders the main heading", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(screen.getByText("What would you like to create?")).toBeTruthy();
    });

    it("renders Single Campaign card", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(screen.getByText("Single Campaign")).toBeTruthy();
      expect(screen.getByText("Create Campaign")).toBeTruthy();
    });

    it("renders A/B Experiment card", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(screen.getByText("A/B Experiment")).toBeTruthy();
      expect(screen.getByText("Create Experiment")).toBeTruthy();
    });

    it("shows Recommended badge on Single Campaign card", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(screen.getByText("Recommended")).toBeTruthy();
    });

    it("shows Pro badge on A/B Experiment card", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(screen.getByText("Pro")).toBeTruthy();
    });

    it("renders helper text", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(
        screen.getByText("Not sure? Start with a single campaign – you can always test later.")
      ).toBeTruthy();
    });
  });

  describe("Mode Selection", () => {
    it("calls onModeSelect with 'single' when Single Campaign is clicked", () => {
      const onModeSelect = vi.fn();
      renderWithPolaris(<ModeSelector onModeSelect={onModeSelect} />);

      const singleButton = screen.getByText("Create Campaign");
      fireEvent.click(singleButton);

      expect(onModeSelect).toHaveBeenCalledWith("single");
    });

    it("calls onModeSelect with 'experiment' when A/B Experiment is clicked", () => {
      const onModeSelect = vi.fn();
      renderWithPolaris(<ModeSelector onModeSelect={onModeSelect} experimentsEnabled={true} />);

      const experimentButton = screen.getByText("Create Experiment");
      fireEvent.click(experimentButton);

      expect(onModeSelect).toHaveBeenCalledWith("experiment");
    });
  });

  describe("Disabled State", () => {
    it("disables A/B Experiment when experimentsEnabled is false", () => {
      const onModeSelect = vi.fn();
      renderWithPolaris(<ModeSelector onModeSelect={onModeSelect} experimentsEnabled={false} />);

      const experimentButton = screen.getByText("Create Experiment");
      fireEvent.click(experimentButton);

      // Should not be called when disabled
      expect(onModeSelect).not.toHaveBeenCalled();
    });

    it("shows disabled reason when experimentsEnabled is false", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} experimentsEnabled={false} />);

      expect(screen.getByText("Available on Growth plan")).toBeTruthy();
    });

    it("experiments enabled by default", () => {
      const onModeSelect = vi.fn();
      renderWithPolaris(<ModeSelector onModeSelect={onModeSelect} />);

      const experimentButton = screen.getByText("Create Experiment");
      fireEvent.click(experimentButton);

      expect(onModeSelect).toHaveBeenCalledWith("experiment");
    });
  });

  describe("Feature Lists", () => {
    it("renders Single Campaign features", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(screen.getByText("30+ ready-to-use templates")).toBeTruthy();
      expect(screen.getByText("Advanced targeting rules")).toBeTruthy();
      expect(screen.getByText("Real-time analytics")).toBeTruthy();
    });

    it("renders A/B Experiment features", () => {
      renderWithPolaris(<ModeSelector onModeSelect={vi.fn()} />);

      expect(screen.getByText("Test 2-4 variants at once")).toBeTruthy();
      expect(screen.getByText("Automatic traffic splitting")).toBeTruthy();
      expect(screen.getByText("Statistical significance tracking")).toBeTruthy();
      expect(screen.getByText("Winner auto-selection")).toBeTruthy();
    });
  });

  describe("Keyboard Accessibility", () => {
    it("supports Enter key for Single Campaign selection", () => {
      const onModeSelect = vi.fn();
      const { container } = renderWithPolaris(<ModeSelector onModeSelect={onModeSelect} />);

      // Find the Single Campaign card (has role="button")
      const cards = container.querySelectorAll('[role="button"]');
      const singleCard = cards[0];

      fireEvent.keyDown(singleCard, { key: "Enter" });

      expect(onModeSelect).toHaveBeenCalledWith("single");
    });

    it("supports Space key for selection", () => {
      const onModeSelect = vi.fn();
      const { container } = renderWithPolaris(<ModeSelector onModeSelect={onModeSelect} />);

      const cards = container.querySelectorAll('[role="button"]');
      const singleCard = cards[0];

      fireEvent.keyDown(singleCard, { key: " " });

      expect(onModeSelect).toHaveBeenCalledWith("single");
    });
  });
});

