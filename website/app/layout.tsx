import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const siteUrl = "https://revenueboost.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Revenue Boost - Shopify Popups & Notifications App",
    template: "%s | Revenue Boost",
  },
  description:
    "40+ ready-to-use popup designs for Shopify. Pick one, add your brand, go live in 60 seconds. No design skills needed. Increase conversions with email popups, spin-to-win wheels, flash sales & more.",
  keywords: [
    "shopify popup app",
    "shopify popups",
    "email capture shopify",
    "shopify email popup",
    "spin to win shopify",
    "shopify conversion optimization",
    "shopify social proof",
    "shopify flash sale popup",
    "e-commerce popups",
    "shopify newsletter popup",
    "exit intent popup shopify",
    "cart abandonment popup",
    "ai product recommendations shopify",
    "shopify upsell app",
    "shopify cross sell",
  ],
  authors: [{ name: "Revenue Boost" }],
  creator: "Revenue Boost",
  publisher: "Revenue Boost",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Revenue Boost",
    title: "Revenue Boost - Shopify Popups & Notifications App",
    description:
      "40+ ready-to-use popup designs for Shopify. Pick one, add your brand, go live in 60 seconds. No design skills needed.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Revenue Boost - Shopify Popups App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revenue Boost - Shopify Popups & Notifications App",
    description:
      "40+ ready-to-use popup designs for Shopify. Pick one, add your brand, go live in 60 seconds.",
    images: ["/og-image.png"],
    creator: "@revenueboost",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "E-commerce Software",
}

export const viewport: Viewport = {
  themeColor: "#0E7768",
  width: "device-width",
  initialScale: 1,
}

// JSON-LD structured data for SoftwareApplication (Shopify App)
const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Revenue Boost",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "40+ ready-to-use popup designs for Shopify. Increase conversions with email popups, spin-to-win wheels, flash sales & more.",
  url: "https://revenueboost.app",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "50",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Organization",
    name: "Revenue Boost",
    url: "https://revenueboost.app",
  },
  screenshot: "https://revenueboost.app/og-image.png",
  featureList: [
    "Newsletter Popup",
    "Spin to Win Wheel",
    "Flash Sale Timer",
    "Social Proof Notifications",
    "Exit Intent Popup",
    "Cart Abandonment Popup",
    "Upsell & Cross-sell",
    "AI Product Recommendations",
    "A/B Testing",
    "Advanced Targeting",
  ],
}

// JSON-LD for Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Revenue Boost",
  url: "https://revenueboost.app",
  logo: "https://revenueboost.app/logo.webp",
  sameAs: ["https://apps.shopify.com/revenue-boost"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@revenueboost.app",
    contactType: "customer service",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
