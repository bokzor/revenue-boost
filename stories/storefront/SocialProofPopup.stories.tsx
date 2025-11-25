import type { Meta, StoryObj } from "@storybook/react";
import { SocialProofPopup } from "~/domains/storefront/notifications/social-proof/SocialProofPopup";
import {
	  DEFAULT_SOCIAL_PROOF_CONFIG,
	  type SocialProofNotification,
} from "~/domains/storefront/notifications/social-proof/types";

const notifications: SocialProofNotification[] = [
	  {
	    id: "1",
	    type: "purchase",
	    customerName: "Alex from London",
	    location: "London, UK",
	    productName: "Soft Cotton Hoodie",
	    productImage: "https://via.placeholder.com/80",
	    timeAgo: "2 minutes ago",
	    verified: true,
	    timestamp: Date.now(),
	  },
];

const config = {
	  ...DEFAULT_SOCIAL_PROOF_CONFIG,
	  backgroundColor: "#ffffff",
	  textColor: "#111827",
};

const meta: Meta<typeof SocialProofPopup> = {
	  title: "Storefront/Notifications/SocialProofPopup",
	  component: SocialProofPopup,
	  args: {
	    campaignId: "demo-campaign",
	    config,
	    notifications,
	  },
};

export default meta;

type Story = StoryObj<typeof SocialProofPopup>;

export const Default: Story = {};
