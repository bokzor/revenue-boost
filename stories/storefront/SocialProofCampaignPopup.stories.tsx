import type { Meta, StoryObj } from "@storybook/react";
import {
  SocialProofPopup,
  type SocialProofConfig,
} from "~/domains/storefront/popups-new/SocialProofPopup";

const baseConfig: Partial<SocialProofConfig> = {
  id: "demo-social-proof-popup",
  campaignId: "demo-campaign",
  headline: "People are shopping right now",
  subheadline: "Real-time activity from your store",
  buttonText: "Shop now",
  successMessage: "Thanks for checking!",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  position: "bottom",
  previewMode: true,
  enablePurchaseNotifications: true,
  enableVisitorNotifications: true,
  enableReviewNotifications: true,
  cornerPosition: "bottom-left",
  displayDuration: 6,
  rotationInterval: 8,
  maxNotificationsPerSession: 5,
  showProductImage: true,
  showTimer: true,
};

const meta: Meta<typeof SocialProofPopup> = {
  title: "Storefront/Popups/SocialProofPopup",
  component: SocialProofPopup,
  args: {
    isVisible: true,
    config: baseConfig as SocialProofConfig,
    notifications: [
      {
        id: "1",
        type: "purchase",
        customerName: "Alex",
        location: "London, UK",
        productName: "Soft Cotton Hoodie",
        productImage: "https://via.placeholder.com/80",
        timeAgo: "Just now",
        verified: true,
        timestamp: Date.now(),
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof SocialProofPopup>;

export const Default: Story = {};
