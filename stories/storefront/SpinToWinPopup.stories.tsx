import type { Meta, StoryObj } from "@storybook/react";
import { SpinToWinPopup, type SpinToWinConfig } from "~/domains/storefront/popups-new/SpinToWinPopup";

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
