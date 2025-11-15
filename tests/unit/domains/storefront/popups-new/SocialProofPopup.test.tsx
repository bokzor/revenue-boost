import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SocialProofPopup } from "~/domains/storefront/popups-new/SocialProofPopup";
import type { SocialProofNotification } from "~/domains/storefront/popups-new/SocialProofPopup";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    enablePurchaseNotifications: false,
    enableVisitorNotifications: true,
    enableReviewNotifications: false,
    rotationInterval: 8,
    maxNotificationsPerSession: undefined,
    minVisitorCount: 0,
    minReviewRating: 0,
    cornerPosition: "bottom-left",
    backgroundColor: "#111827",
    textColor: "#ffffff",
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
        name: "Alice",
        location: "Paris",
        product: "Hat",
      },
      {
        id: "v1",
        type: "visitor",
        count: 5,
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

    expect(
      await screen.findByText(/5 people are viewing this right now/i),
    ).toBeTruthy();
    expect(screen.queryByText(/just purchased/i)).toBeNull();
  });
});

