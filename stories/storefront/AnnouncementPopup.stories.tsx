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
  buttonText: "Shop Now",
};

const meta: Meta<typeof AnnouncementPopup> = {
  title: "Storefront/Banners/AnnouncementPopup",
  component: AnnouncementPopup,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    isVisible: true,
    config: baseConfig as AnnouncementConfig,
  },
};

export default meta;

type Story = StoryObj<typeof AnnouncementPopup>;

/** Default announcement bar - responsive design */
export const Default: Story = {};

/** Mobile viewport - stacked layout with X close button */
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

/** Tablet viewport - inline layout with dismiss text */
export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: "tablet" },
  },
};

/** Holiday shipping delays - realistic use case */
export const HolidayShipping: Story = {
  args: {
    config: {
      ...baseConfig,
      icon: "📦",
      headline: "Holiday shipping delays",
      subheadline: "Order by Dec 15th for guaranteed delivery",
      buttonText: "Learn More",
      backgroundColor: "#1e3a5f",
      buttonColor: "#fbbf24",
      buttonTextColor: "#1e3a5f",
    } as AnnouncementConfig,
  },
};

/** Flash sale - urgent red color scheme */
export const FlashSale: Story = {
  args: {
    config: {
      ...baseConfig,
      icon: "🔥",
      headline: "Flash Sale: 50% OFF Everything",
      subheadline: "Ends in 2 hours",
      buttonText: "Shop Now",
      backgroundColor: "#dc2626",
      buttonColor: "#ffffff",
      buttonTextColor: "#dc2626",
      colorScheme: "urgent",
    } as AnnouncementConfig,
  },
};

/** Black Friday - dark elegant theme */
export const BlackFriday: Story = {
  args: {
    config: {
      ...baseConfig,
      icon: "⚡",
      headline: "BLACK FRIDAY",
      subheadline: "Up to 70% off sitewide",
      buttonText: "Shop Deals",
      backgroundColor: "#0f0f0f",
      textColor: "#ffffff",
      buttonColor: "#facc15",
      buttonTextColor: "#0f0f0f",
    } as AnnouncementConfig,
  },
};

/** Success/positive announcement */
export const FreeShipping: Story = {
  args: {
    config: {
      ...baseConfig,
      icon: "🚚",
      headline: "Free shipping on orders $50+",
      subheadline: "No code needed",
      buttonText: "", // Empty string to hide button
      backgroundColor: "#16a34a",
      colorScheme: "success",
    } as AnnouncementConfig,
  },
};

/** Gradient background - modern look */
export const GradientBanner: Story = {
  args: {
    config: {
      ...baseConfig,
      icon: "✨",
      headline: "New Collection Available",
      subheadline: "Spring 2025 is here",
      buttonText: "Explore",
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      buttonColor: "#ffffff",
      buttonTextColor: "#667eea",
    } as AnnouncementConfig,
  },
};

/** Minimal - headline only, no button */
export const Minimal: Story = {
  args: {
    config: {
      ...baseConfig,
      icon: "ℹ️",
      headline: "New arrivals just dropped!",
      subheadline: "", // Empty string to hide subheadline
      buttonText: "", // Empty string to hide button
      backgroundColor: "#6366f1",
    } as AnnouncementConfig,
  },
};

/** Bottom position */
export const BottomPosition: Story = {
  args: {
    config: {
      ...baseConfig,
      position: "bottom",
      icon: "💌",
      headline: "Join our newsletter",
      subheadline: "Get 10% off your first order",
      buttonText: "Subscribe",
      backgroundColor: "#1e3a5f",
    } as AnnouncementConfig,
  },
};

/** Warm coral theme */
export const WarmCoral: Story = {
  args: {
    config: {
      ...baseConfig,
      icon: "🌸",
      headline: "Spring Sale is Live",
      subheadline: "Use code SPRING25 for 25% off",
      buttonText: "Shop Now",
      backgroundColor: "#fb7185",
      buttonColor: "#ffffff",
      buttonTextColor: "#be123c",
    } as AnnouncementConfig,
  },
};
