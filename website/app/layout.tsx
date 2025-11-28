import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Revenue Boost - Shopify Popups & Notifications App",
  description:
    "Increase your e-commerce sales with intelligent popups, social proof notifications, and gamification. 11+ ready-to-use templates. Zero configuration.",
  keywords: ["shopify app", "popups", "email capture", "social proof", "conversion optimization", "e-commerce"],
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#9333ea",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
