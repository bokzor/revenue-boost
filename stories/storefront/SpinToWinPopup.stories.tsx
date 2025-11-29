import type { Meta, StoryObj } from "@storybook/react";
import {
  SpinToWinPopup,
  type SpinToWinConfig,
} from "~/domains/storefront/popups-new/SpinToWinPopup";

const baseConfig: Partial<SpinToWinConfig> = {
  id: "demo-spin",
  campaignId: "demo-campaign",
  backgroundColor: "#0f172a",
  textColor: "#f9fafb",
  buttonColor: "#22c55e",
  buttonTextColor: "#0f172a",
  position: "center",
  size: "medium",
  headline: "Spin the wheel & win!",
  subheadline: "Enter your email for a chance to win a prize",
  emailRequired: true,
  previewMode: true,
  wheelSegments: [
    { id: "1", label: "10% OFF", probability: 0.3 },
    { id: "2", label: "Free Shipping", probability: 0.3 },
    { id: "3", label: "Better luck next time", probability: 0.4 },
  ],
};

const meta: Meta<typeof SpinToWinPopup> = {
  title: "Storefront/Popups/SpinToWinPopup",
  component: SpinToWinPopup,
  args: {
    isVisible: true,
    config: baseConfig as SpinToWinConfig,
  },
};

export default meta;

type Story = StoryObj<typeof SpinToWinPopup>;

export const Default: Story = {};

/** Spin to Win with full background image */
export const WithFullBackground: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      imagePosition: "full",
      backgroundOverlayOpacity: 0.75,
      backgroundColor: "#0f172a",
    } as SpinToWinConfig,
  },
};

/** Spin to Win with lighter background overlay */
export const FullBackgroundLightOverlay: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop",
      imagePosition: "full",
      backgroundOverlayOpacity: 0.5,
      backgroundColor: "#1e293b",
    } as SpinToWinConfig,
  },
};
