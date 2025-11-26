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
