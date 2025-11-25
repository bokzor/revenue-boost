import type { Meta, StoryObj } from "@storybook/react";
import {
	  CountdownTimerPopup,
	  type CountdownTimerConfig,
	} from "~/domains/storefront/popups-new/CountdownTimerPopup";

const baseConfig: Partial<CountdownTimerConfig> = {
  id: "demo-countdown",
  campaignId: "demo-campaign",
  backgroundColor: "#111827",
  textColor: "#f9fafb",
  buttonColor: "#f97316",
  buttonTextColor: "#111827",
  position: "top",
  size: "medium",
  headline: "Flash sale ends soon",
  subheadline: "Hurry, your discount disappears when the timer hits zero",
  previewMode: true,
  colorScheme: "urgent",
  countdownDuration: 3600,
  ctaOpenInNewTab: false,
  hideOnExpiry: false,
};

const meta: Meta<typeof CountdownTimerPopup> = {
  title: "Storefront/Banners/CountdownTimerPopup",
  component: CountdownTimerPopup,
  args: {
    isVisible: true,
	    config: baseConfig as CountdownTimerConfig,
  },
};

export default meta;

type Story = StoryObj<typeof CountdownTimerPopup>;

export const Default: Story = {};
