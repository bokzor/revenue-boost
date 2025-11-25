import type { Meta, StoryObj } from "@storybook/react";
import { BannerPopup } from "~/domains/storefront/notifications/BannerPopup";

const meta: Meta<typeof BannerPopup> = {
  title: "Storefront/Banners/BannerPopup",
  component: BannerPopup,
  args: {
    isVisible: true,
    config: {
      id: "demo-banner",
      campaignId: "demo-campaign",
      backgroundColor: "#111827",
      textColor: "#f9fafb",
      buttonColor: "#f97316",
      buttonTextColor: "#ffffff",
      size: "medium",
      headline: "Welcome to our store",
      subheadline: "Enjoy free shipping on all orders over $50",
      position: "top",
      previewMode: true,
    },
  },
};

export default meta;

type Story = StoryObj<typeof BannerPopup>;

export const Default: Story = {};
