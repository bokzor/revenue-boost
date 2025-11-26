import type { Meta, StoryObj } from "@storybook/react";
import { NewsletterPopup, type NewsletterConfig } from "~/domains/storefront/popups-new/NewsletterPopup";

const baseConfig: Partial<NewsletterConfig> = {
  id: "demo-newsletter",
  campaignId: "demo-campaign",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  buttonColor: "#111827",
  buttonTextColor: "#ffffff",
  position: "center",
  size: "medium",
  headline: "Join our newsletter",
  subheadline: "Get 10% off your first order",
  emailRequired: true,
  previewMode: true,
};

const meta: Meta<typeof NewsletterPopup> = {
  title: "Storefront/Popups/NewsletterPopup",
  component: NewsletterPopup,
  args: {
    isVisible: true,
    config: baseConfig as NewsletterConfig,
    onSubmit: async () => "Subscribed!",
  },
};

export default meta;

type Story = StoryObj<typeof NewsletterPopup>;

export const Default: Story = {};
