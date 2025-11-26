import type { Meta, StoryObj } from "@storybook/react";
import {
  AnnouncementPopup,
  type AnnouncementConfig,
} from "~/domains/storefront/popups-new/AnnouncementPopup";

const baseConfig: Partial<AnnouncementConfig> = {
  id: "demo-announcement",
  campaignId: "demo-campaign",
  backgroundColor: "#2563eb",
  textColor: "#ffffff",
  buttonColor: "#ffffff",
  buttonTextColor: "#2563eb",
  position: "top",
  size: "medium",
  headline: "Free express shipping today only",
  subheadline: "No code needed — applied automatically at checkout",
  previewMode: true,
  colorScheme: "info",
  ctaOpenInNewTab: false,
};

const meta: Meta<typeof AnnouncementPopup> = {
  title: "Storefront/Banners/AnnouncementPopup",
  component: AnnouncementPopup,
  args: {
    isVisible: true,
    config: baseConfig as AnnouncementConfig,
  },
};

export default meta;

type Story = StoryObj<typeof AnnouncementPopup>;

export const Default: Story = {};
