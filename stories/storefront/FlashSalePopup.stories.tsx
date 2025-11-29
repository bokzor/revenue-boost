import type { Meta, StoryObj } from "@storybook/react";
import { FlashSalePopup, type FlashSaleConfig } from "~/domains/storefront/popups-new/FlashSalePopup";

const baseConfig: Partial<FlashSaleConfig> = {
  id: "demo-flash-sale",
  campaignId: "demo-campaign",
  backgroundColor: "#111827",
  textColor: "#f9fafb",
  buttonColor: "#f97316",
  buttonTextColor: "#111827",
  accentColor: "#f97316",
  position: "center",
  size: "medium",
  headline: "24-Hour Flash Sale",
  subheadline: "Save big before the timer runs out!",
  buttonText: "Shop Now",
  dismissLabel: "No thanks",
  urgencyMessage: "⏰ Ends tonight at midnight",
  showCountdown: true,
  countdownDuration: 3600 * 4, // 4 hours
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

/** Default desktop view */
export const Default: Story = {};

/** Mobile viewport (320px) */
export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    config: {
      ...baseConfig,
      size: "small",
    } as FlashSaleConfig,
  },
};

/** Mobile with inventory */
export const MobileWithInventory: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    config: {
      ...baseConfig,
      size: "small",
      inventory: {
        mode: "pseudo",
        pseudoMax: 7,
        showOnlyXLeft: true,
        showThreshold: 10,
      },
    } as FlashSaleConfig,
  },
};

/** Tablet viewport */
export const Tablet: Story = {
  parameters: {
    viewport: { defaultViewport: "tablet" },
  },
};

/** With discount percentage */
export const WithDiscount: Story = {
  args: {
    config: {
      ...baseConfig,
      discountPercentage: 30,
    } as FlashSaleConfig,
  },
};

/** Urgent red color scheme */
export const UrgentRed: Story = {
  args: {
    config: {
      ...baseConfig,
      backgroundColor: "#7f1d1d",
      accentColor: "#fbbf24",
      buttonColor: "#fbbf24",
      buttonTextColor: "#7f1d1d",
      headline: "🔥 MEGA FLASH SALE",
      subheadline: "Up to 70% off everything - Today only!",
      urgencyMessage: "⚡ Selling fast - Limited stock available",
    } as FlashSaleConfig,
  },
};

/** Minimal - no urgency message */
export const Minimal: Story = {
  args: {
    config: {
      ...baseConfig,
      urgencyMessage: "", // Empty string to hide urgency message
      subheadline: "Limited time offer",
    } as FlashSaleConfig,
  },
};

/** Banner display mode */
export const BannerMode: Story = {
  args: {
    config: {
      ...baseConfig,
      displayMode: "banner",
      position: "top",
    } as FlashSaleConfig,
  },
};

/** With background image */
export const WithBackgroundImage: Story = {
  args: {
    config: {
      ...baseConfig,
      backgroundImageMode: "file",
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
      backgroundOverlayOpacity: 0.7,
      headline: "Black Friday Sale",
      subheadline: "Up to 50% off all items",
    } as FlashSaleConfig,
  },
};

/** Background image with lower overlay */
export const BackgroundImageLightOverlay: Story = {
  args: {
    config: {
      ...baseConfig,
      backgroundImageMode: "file",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
      backgroundOverlayOpacity: 0.5,
      backgroundColor: "#1a1a2e",
      accentColor: "#e94560",
      buttonColor: "#e94560",
      headline: "Summer Clearance",
      subheadline: "Everything must go!",
    } as FlashSaleConfig,
  },
};
