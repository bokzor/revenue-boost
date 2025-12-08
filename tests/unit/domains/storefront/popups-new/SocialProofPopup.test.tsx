import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SocialProofPopup, SocialProofConfig } from "~/domains/storefront/popups-new/SocialProofPopup";
import type { SocialProofNotification } from "~/domains/storefront/notifications/social-proof/types";

function createConfig(overrides: Partial<SocialProofConfig> = {}): SocialProofConfig {
  const baseConfig: SocialProofConfig = {
    // PopupDesignConfig required fields
    id: "test-config",
    backgroundColor: "#111827",
    textColor: "#ffffff",
    buttonColor: "#10B981",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    animation: "fade",
    borderRadius: "8px",
    overlayOpacity: 0.5,
    closeOnOverlayClick: true,
    // BaseContentConfig required fields
    headline: "Social Proof",
    successMessage: "Thank you!",
    // SocialProofContent fields
    enablePurchaseNotifications: false,
    enableVisitorNotifications: true,
    enableReviewNotifications: false,
    rotationInterval: 8,
    displayDuration: 6,
    maxNotificationsPerSession: 5,
    minVisitorCount: 0,
    minReviewRating: 0,
    cornerPosition: "bottom-left",
    showProductImage: true,
    showTimer: true,
    showCloseButton: true,
  };

  return { ...baseConfig, ...overrides };
}

describe("SocialProofPopup", () => {
  it("filters notifications based on config flags", async () => {
    const config = createConfig();
    const notifications: SocialProofNotification[] = [
      {
        id: "p1",
        type: "purchase",
        customerName: "Alice",
        location: "Paris",
        productName: "Hat",
        timeAgo: "2 minutes ago",
        verified: true,
        timestamp: Date.now(),
      },
      {
        id: "v1",
        type: "visitor",
        count: 5,
        context: "viewing this product",
        trending: false,
        timestamp: Date.now(),
      },
    ];

    render(
      <SocialProofPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        notifications={notifications}
      />,
    );

    // The new design splits the text into separate spans
    expect(await screen.findByText(/5 people/i)).toBeTruthy();
    expect(screen.queryByText(/just purchased/i)).toBeNull();
  });
});

