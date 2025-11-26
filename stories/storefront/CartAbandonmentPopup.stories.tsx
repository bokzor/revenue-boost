import type { Meta, StoryObj } from "@storybook/react";
import {
  CartAbandonmentPopup,
  type CartAbandonmentConfig,
} from "~/domains/storefront/popups-new/CartAbandonmentPopup";

const baseConfig: Partial<CartAbandonmentConfig> = {
  id: "demo-cart-abandonment",
  campaignId: "demo-campaign",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  buttonColor: "#111827",
  buttonTextColor: "#ffffff",
  position: "center",
  size: "medium",
  headline: "You left items in your cart",
  subheadline: "Complete your order now and keep your items reserved",
  currency: "USD",
  previewMode: true,
  showUrgency: true,
  urgencyTimer: 600,
};

const meta: Meta<typeof CartAbandonmentPopup> = {
  title: "Storefront/Popups/CartAbandonmentPopup",
  component: CartAbandonmentPopup,
  args: {
    isVisible: true,
    config: baseConfig as CartAbandonmentConfig,
    cartItems: [
      {
        id: "1",
        variantId: "v1",
        title: "Classic Tee",
        imageUrl: "https://via.placeholder.com/80",
        quantity: 1,
        price: "29.00",
      },
    ],
    cartTotal: 29,
    issueDiscount: async () => ({ code: "CART10", autoApplyMode: "AUTO" }),
  },
};

export default meta;

type Story = StoryObj<typeof CartAbandonmentPopup>;

export const Default: Story = {};
