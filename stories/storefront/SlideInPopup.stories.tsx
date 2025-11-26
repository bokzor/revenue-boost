import type { Meta, StoryObj } from "@storybook/react";
import { SlideInPopup } from "~/domains/storefront/slideins/SlideInPopup";
import type { PopupConfig } from "~/domains/storefront/popups-new/types";

const baseConfig: PopupConfig & {
	slideDirection?: "left" | "right" | "bottom";
} = {
  id: "demo-slide-in",
  campaignId: "demo-campaign",
  backgroundColor: "#111827",
  textColor: "#f9fafb",
  buttonColor: "#22c55e",
  buttonTextColor: "#111827",
  position: "right",
  size: "medium",
  headline: "Welcome back",
  subheadline: "Heres a quick update on your cart",
  previewMode: true,
};

const meta: Meta<typeof SlideInPopup> = {
  title: "Storefront/Slideins/SlideInPopup",
  component: SlideInPopup,
  args: {
    isVisible: true,
	    config: baseConfig,
  },
};

export default meta;

type Story = StoryObj<typeof SlideInPopup>;

export const Default: Story = {};
