import type { Meta, StoryObj } from "@storybook/react";
import { FlashSalePopup, type FlashSaleConfig } from "~/domains/storefront/popups-new/FlashSalePopup";

const baseConfig: Partial<FlashSaleConfig> = {
  id: "demo-flash-sale",
  campaignId: "demo-campaign",
  backgroundColor: "#111827",
  textColor: "#f9fafb",
  buttonColor: "#f97316",
  buttonTextColor: "#111827",
  position: "center",
  size: "medium",
  headline: "24-hour flash sale",
  subheadline: "Save big before the timer runs out",
  previewMode: true,
};

const meta: Meta<typeof FlashSalePopup> = {
  title: "Storefront/Popups/FlashSalePopup",
  component: FlashSalePopup,
  args: {
    isVisible: true,
    config: baseConfig as FlashSaleConfig,
    issueDiscount: async () => ({ code: "FLASH10", autoApplyMode: "AUTO" }),
  },
};

export default meta;

type Story = StoryObj<typeof FlashSalePopup>;

export const Default: Story = {};
