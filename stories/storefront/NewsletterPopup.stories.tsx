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

/** Newsletter with full background image */
export const WithFullBackground: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
      imagePosition: "full",
      backgroundImageMode: "file",
      backgroundOverlayOpacity: 0.7,
      textColor: "#ffffff",
      headline: "Join Our VIP List",
      subheadline: "Get exclusive deals and early access to new products",
    } as NewsletterConfig,
  },
};

/** Newsletter with full background and light overlay */
export const FullBackgroundLightOverlay: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
      imagePosition: "full",
      backgroundImageMode: "file",
      backgroundOverlayOpacity: 0.5,
      backgroundColor: "#000000",
      textColor: "#ffffff",
      headline: "Stay in the Loop",
      subheadline: "Subscribe for the latest updates and special offers",
    } as NewsletterConfig,
  },
};

/** Newsletter with side image (left position) */
export const WithSideImage: Story = {
  args: {
    config: {
      ...baseConfig,
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop",
      imagePosition: "left",
      backgroundImageMode: "file",
    } as NewsletterConfig,
  },
};
