import type { Meta, StoryObj } from "@storybook/react";
import {
  ScratchCardPopup,
  type ScratchCardConfig,
} from "~/domains/storefront/popups-new/ScratchCardPopup";

const baseConfig: Partial<ScratchCardConfig> = {
  id: "demo-scratch-card",
  campaignId: "demo-campaign",
  backgroundColor: "#020617",
  textColor: "#f9fafb",
  buttonColor: "#22c55e",
  buttonTextColor: "#020617",
  position: "center",
  size: "medium",
  headline: "Scratch to reveal your prize",
  subheadline: "Everyone wins something — try your luck!",
  previewMode: true,
  emailRequired: false,
  emailBeforeScratching: false,
  prizes: [
    { id: "prize-1", label: "10% OFF", probability: 50 },
    { id: "prize-2", label: "Free Shipping", probability: 30 },
    { id: "prize-3", label: "Better luck next time", probability: 20 },
  ],
};

const meta: Meta<typeof ScratchCardPopup> = {
  title: "Storefront/Popups/ScratchCardPopup",
  component: ScratchCardPopup,
  args: {
    isVisible: true,
    config: baseConfig as ScratchCardConfig,
  },
};

export default meta;

type Story = StoryObj<typeof ScratchCardPopup>;

export const Default: Story = {};

/** Scratch Card with full background image */
export const WithFullBackground: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&h=600&fit=crop",
      imagePosition: "full",
      backgroundOverlayOpacity: 0.7,
      backgroundColor: "#020617",
    } as ScratchCardConfig,
  },
};

/** Scratch Card with lighter background overlay */
export const FullBackgroundLightOverlay: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=600&fit=crop",
      imagePosition: "full",
      backgroundOverlayOpacity: 0.5,
      backgroundColor: "#1e1b4b",
    } as ScratchCardConfig,
  },
};

/** Scratch Card with side image (left position) */
export const WithSideImage: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=400&h=600&fit=crop",
      imagePosition: "left",
    } as ScratchCardConfig,
  },
};
