import type { Meta, StoryObj } from "@storybook/react";
import {
	  ProductUpsellPopup,
	  type ProductUpsellConfig,
	} from "~/domains/storefront/popups-new/ProductUpsellPopup";

const baseConfig: Partial<ProductUpsellConfig> = {
  id: "demo-upsell",
  campaignId: "demo-campaign",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  buttonColor: "#6366f1",
  buttonTextColor: "#ffffff",
  position: "center",
  size: "large",
  headline: "Complete your look",
  subheadline: "Add these customer favorites to your order",
  previewMode: true,
  layout: "grid",
  columns: 2,
  multiSelect: true,
  currency: "USD",
};

const meta: Meta<typeof ProductUpsellPopup> = {
  title: "Storefront/Popups/ProductUpsellPopup",
  component: ProductUpsellPopup,
  args: {
    isVisible: true,
	    config: baseConfig as ProductUpsellConfig,
    products: [
      {
        id: "p1",
        variantId: "v1",
        handle: "comfort-hoodie",
        title: "Comfort Hoodie",
        price: "59.00",
        compareAtPrice: "79.00",
        imageUrl: "https://via.placeholder.com/320",
        rating: 4.7,
        reviewCount: 128,
      },
      {
        id: "p2",
        variantId: "v2",
        handle: "everyday-joggers",
        title: "Everyday Joggers",
        price: "49.00",
        compareAtPrice: "69.00",
        imageUrl: "https://via.placeholder.com/320",
        rating: 4.5,
        reviewCount: 92,
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof ProductUpsellPopup>;

export const Default: Story = {};
