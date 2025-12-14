import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "75+ Popup Designs for Shopify - Ready to Use Templates",
  description:
    "Browse our collection of 75+ professionally designed popups for Shopify. Newsletter signups, spin-to-win wheels, flash sales, social proof, upsells & more. Pick one and go live in 60 seconds.",
  keywords: [
    "shopify popup templates",
    "popup designs",
    "newsletter popup templates",
    "spin to win popup",
    "flash sale popup design",
    "social proof popup",
    "upsell popup shopify",
    "email capture templates",
  ],
  openGraph: {
    title: "75+ Popup Designs for Shopify - Ready to Use Templates",
    description:
      "Browse our collection of 75+ professionally designed popups for Shopify. Newsletter signups, spin-to-win wheels, flash sales & more.",
    url: "https://revenueboost.app/designs",
    images: [
      {
        url: "/og-designs.png",
        width: 1200,
        height: 630,
        alt: "Revenue Boost Popup Designs Gallery",
      },
    ],
  },
  twitter: {
    title: "75+ Popup Designs for Shopify",
    description:
      "Browse our collection of 75+ professionally designed popups for Shopify stores.",
    images: ["/og-designs.png"],
  },
  alternates: {
    canonical: "https://revenueboost.app/designs",
  },
}

export default function DesignsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

