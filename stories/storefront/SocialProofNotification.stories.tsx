import type { Meta, StoryObj } from "@storybook/react";
import { SocialProofNotificationComponent } from "~/domains/storefront/notifications/social-proof/SocialProofNotification";
import {
  DEFAULT_SOCIAL_PROOF_CONFIG,
  type SocialProofConfig,
  type SocialProofNotification,
} from "~/domains/storefront/notifications/social-proof/types";

const notification: SocialProofNotification = {
  id: "1",
  type: "purchase",
  timestamp: Date.now(),
  customerName: "Alex from London",
  location: "London, UK",
  productName: "Soft Cotton Hoodie",
  productImage: "https://via.placeholder.com/80",
  timeAgo: "2 minutes ago",
  verified: true,
};

const config: SocialProofConfig = {
  ...DEFAULT_SOCIAL_PROOF_CONFIG,
  backgroundColor: "#ffffff",
  textColor: "#111827",
};

const meta: Meta<typeof SocialProofNotificationComponent> = {
  title: "Storefront/Notifications/SocialProofNotification",
  component: SocialProofNotificationComponent,
  args: {
    notification,
    config,
  },
};

export default meta;

type Story = StoryObj<typeof SocialProofNotificationComponent>;

export const Default: Story = {};
