import type { Meta, StoryObj } from "@storybook/react";
import { FreeShippingPopup, type FreeShippingConfig } from "~/domains/storefront/popups-new/FreeShippingPopup";

const baseConfig: Partial<FreeShippingConfig> = {
	  id: "demo-free-shipping",
	  campaignId: "demo-campaign",
	  backgroundColor: "#0f172a",
	  textColor: "#f9fafb",
	  buttonColor: "#22c55e",
	  buttonTextColor: "#0f172a",
	  position: "bottom",
	  size: "medium",
	  previewMode: true,
	  threshold: 50,
	  currentCartTotal: 20,
	  emptyMessage: "Free shipping on orders over $50",
	  progressMessage: "You are getting closer to free shipping",
	  nearMissMessage: "Almost there! Keep shopping to unlock free shipping",
	  unlockedMessage: "Congrats! You unlocked free shipping",
};

const meta: Meta<typeof FreeShippingPopup> = {
  title: "Storefront/Popups/FreeShippingPopup",
  component: FreeShippingPopup,
  args: {
    isVisible: true,
    config: baseConfig as FreeShippingConfig,
    cartTotal: 20,
    onSubmit: async ({ email }) => `Claimed by ${email}`,
    issueDiscount: async () => ({ code: "FREESHIP", autoApplyMode: "AUTO" }),
  },
};

export default meta;

type Story = StoryObj<typeof FreeShippingPopup>;

export const Default: Story = {};
