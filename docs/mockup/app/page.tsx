"use client"

import { useState, useEffect } from "react"
import { EmailPopup, type ImagePosition } from "@/components/email-popup"
import { FlashSalePopup, type SaleSize } from "@/components/flash-sale-popup"
import { ProductUpsellPopup, type UpsellLayout, type Product } from "@/components/product-upsell-popup"
import { FreeShippingBar, type ShippingBarPosition } from "@/components/free-shipping-bar"
import { SpinToWinPopup, type Prize, type WheelBorder } from "@/components/spin-to-win-popup"
import { ScratchCardPopup } from "@/components/scratch-card-popup"
import type { PopupTheme } from "@/lib/popup-themes"
import { SocialProofNotification, type NotificationConfig } from "@/components/social-proof-notification"
import { CountdownTimerBanner, type BannerPosition, type ColorScheme } from "@/components/countdown-timer-banner"

export default function PopupDemo() {
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [isFlashSaleOpen, setIsFlashSaleOpen] = useState(false)
  const [isUpsellOpen, setIsUpsellOpen] = useState(false)
  const [isSpinOpen, setIsSpinOpen] = useState(false)
  const [isScratchOpen, setIsScratchOpen] = useState(false)
  const [emailTheme, setEmailTheme] = useState<PopupTheme>("modern")
  const [imagePosition, setImagePosition] = useState<ImagePosition>("left")
  const [saleTheme, setSaleTheme] = useState<PopupTheme>("modern")
  const [saleSize, setSaleSize] = useState<SaleSize>("standard")
  const [upsellTheme, setUpsellTheme] = useState<PopupTheme>("modern")
  const [upsellLayout, setUpsellLayout] = useState<UpsellLayout>("grid")
  const [spinTheme, setSpinTheme] = useState<PopupTheme>("modern")
  const [spinImagePosition, setSpinImagePosition] = useState<ImagePosition>("left")
  const [scratchTheme, setScratchTheme] = useState<PopupTheme>("modern")
  const [scratchImagePosition, setScratchImagePosition] = useState<ImagePosition>("left")
  const [socialProofTheme, setSocialProofTheme] = useState<PopupTheme>("modern")
  const [selectedNotificationType, setSelectedNotificationType] = useState<"all" | "purchase" | "visitor" | "review">(
    "all",
  )

  const [manualNotification, setManualNotification] = useState<NotificationConfig | null>(null)

  const [isCustomBorder, setIsCustomBorder] = useState(false)
  const [wheelBorder, setWheelBorder] = useState<WheelBorder>({
    enabled: true,
    color: "#ffffff",
    width: 6,
    style: "solid",
  })

  useEffect(() => {
    setIsCustomBorder(false)
  }, [spinTheme])

  const [shippingTheme, setShippingTheme] = useState<PopupTheme>("modern")
  const [shippingPosition, setShippingPosition] = useState<ShippingBarPosition>("top")
  const [cartValue, setCartValue] = useState(35)
  const shippingThreshold = 50
  const [showEmailCapture, setShowEmailCapture] = useState(false)

  const flashSaleEndTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

  // Added for Countdown Timer Banner
  const [bannerTheme, setBannerTheme] = useState<PopupTheme>("modern")
  const [bannerPosition, setBannerPosition] = useState<BannerPosition>("top")
  const [bannerColorScheme, setBannerColorScheme] = useState<ColorScheme>("urgent")
  const [showBanner, setShowBanner] = useState(true)

  const bannerEndTime = new Date(Date.now() + 3 * 60 * 60 * 1000)


  const sampleProducts: Product[] = [
    {
      id: "1",
      image: "/wireless-earbuds.png",
      title: "Premium Wireless Earbuds",
      price: 79.99,
      compareAtPrice: 129.99,
      rating: 5,
      reviewCount: 247,
      savingsPercent: 38,
    },
    {
      id: "2",
      image: "/colorful-phone-case-display.png",
      title: "Protective Phone Case",
      price: 24.99,
      compareAtPrice: 39.99,
      rating: 4,
      reviewCount: 182,
      savingsPercent: 37,
    },
    {
      id: "3",
      image: "/screen-protector.png",
      title: "Tempered Glass Screen Protector",
      price: 12.99,
      rating: 5,
      reviewCount: 431,
    },
    {
      id: "4",
      image: "/charging-cable.jpg",
      title: "Fast Charging Cable 6ft",
      price: 16.99,
      compareAtPrice: 24.99,
      rating: 4,
      reviewCount: 356,
    },
  ]

  const sampleNotifications: NotificationConfig[] = [
    {
      type: "purchase",
      data: {
        customerName: "Sarah M.",
        location: "New York, NY",
        productName: "Premium Wireless Earbuds",
        timestamp: "2 minutes ago",
        verified: true,
      },
      duration: 5000,
    },
    {
      type: "visitor",
      data: {
        count: 23,
        context: "viewing" as const,
        trending: true,
      },
      duration: 5000,
    },
    {
      type: "review",
      data: {
        rating: 5,
        reviewCount: 1234,
        recentReview: {
          text: "Amazing quality! Best purchase I've made this year.",
          author: "Michael R.",
          verified: true,
        },
      },
      duration: 6000,
    },
    {
      type: "purchase",
      data: {
        customerName: "John D.",
        location: "Los Angeles, CA",
        productName: "Fast Charging Cable 6ft",
        timestamp: "5 minutes ago",
        verified: false,
      },
      duration: 5000,
    },
  ]

  const purchaseNotification: NotificationConfig = {
    type: "purchase",
    data: {
      customerName: "Sarah M.",
      location: "New York, NY",
      productName: "Premium Wireless Earbuds",
      timestamp: "2 minutes ago",
      verified: true,
    },
    duration: 5000,
  }

  const visitorNotification: NotificationConfig = {
    type: "visitor",
    data: {
      count: 23,
      context: "viewing" as const,
      trending: true,
    },
    duration: 5000,
  }

  const reviewNotification: NotificationConfig = {
    type: "review",
    data: {
      rating: 5,
      reviewCount: 1234,
      recentReview: {
        text: "Amazing quality! Best purchase I've made this year.",
        author: "Michael R.",
        verified: true,
      },
    },
    duration: 6000,
  }

  const handleEmailSubmit = async (data: { email: string; name?: string; gdprConsent: boolean }) => {
    console.log("Email form submitted:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleSpinWin = async (data: { email: string; name?: string; gdprConsent: boolean; prize: Prize }) => {
    console.log("Spin to win completed:", data)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const handleScratchSubmit = async (data: { email?: string; gdprConsent?: boolean; prizeRevealed: boolean }) => {
    console.log("Scratch card submitted:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleFlashSaleCta = () => {
    console.log("Flash sale CTA clicked")
    window.open("/shop", "_blank")
  }

  const handleAddToCart = async (products: Product[]) => {
    console.log("Adding to cart:", products)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    alert(`Successfully added ${products.length} item(s) to cart!`)
    setIsUpsellOpen(false)
  }

  const filteredNotifications =
    selectedNotificationType === "all"
      ? sampleNotifications
      : sampleNotifications.filter((n) => n.type === selectedNotificationType)

  const displayNotifications = manualNotification ? [manualNotification] : filteredNotifications

  return (
    <div
      style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fafafa 0%, #e5e5e5 100%)", padding: "2rem" }}
    >
      <FreeShippingBar
        isVisible={true}
        theme={shippingTheme}
        position={shippingPosition}
        threshold={shippingThreshold}
        currentValue={cartValue}
        currency="$"
        nearMissThreshold={10}
        dismissible={true}
        celebrateOnUnlock={true}
        showIcon={true}
        showEmailCapture={showEmailCapture}
        onEmailSubmit={(email) => console.log("Email submitted:", email)}
      />

      <CountdownTimerBanner
        isVisible={showBanner}
        theme={bannerTheme}
        position={bannerPosition}
        colorScheme={bannerColorScheme}
        headline="Flash Sale Ends Soon!"
        subheadline="Limited time offer - Don't miss out"
        endTime={bannerEndTime}
        ctaText="Shop Now"
        ctaUrl="/shop"
        showStockCounter={true}
        stockCount={12}
        showCloseButton={true}
        onClose={() => setShowBanner(false)}
        hideOnExpiry={false}
        sticky={true}
      />

      <SocialProofNotification
        notifications={displayNotifications}
        theme={socialProofTheme}
        position="bottom-left"
        rotationInterval={5000}
        maxPerSession={5}
        showIcons={true}
        onClick={(notification) => console.log("Notification clicked:", notification)}
      />

      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "1rem" }}>Popup Components Library</h1>
          <p style={{ fontSize: "1.125rem", color: "#52525b" }}>
            Professional, customizable popup components with zero dependencies
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "2rem" }}>
          {/* Email Popup Demo */}
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Email Popup</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={emailTheme}
                  onChange={(e) => setEmailTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Image Position
                </label>
                <select
                  value={imagePosition}
                  onChange={(e) => setImagePosition(e.target.value as ImagePosition)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="none">None (Form Only)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsEmailOpen(true)}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                background: "#18181b",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Open Email Popup
            </button>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Spin to Win Popup</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={spinTheme}
                  onChange={(e) => setSpinTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Image Position
                </label>
                <select
                  value={spinImagePosition}
                  onChange={(e) => setSpinImagePosition(e.target.value as ImagePosition)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="none">None (Wheel Only)</option>
                </select>
              </div>

              <div style={{ borderTop: "1px solid #e4e4e7", paddingTop: "1rem" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>Wheel Border</h3>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <input
                    id="border-enabled"
                    type="checkbox"
                    checked={wheelBorder.enabled}
                    onChange={(e) => {
                      setIsCustomBorder(true)
                      setWheelBorder({ ...wheelBorder, enabled: e.target.checked })
                    }}
                    style={{
                      width: "1rem",
                      height: "1rem",
                      cursor: "pointer",
                    }}
                  />
                  <label htmlFor="border-enabled" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                    Enable Border
                  </label>
                </div>

                {wheelBorder.enabled && (
                  <>
                    <div style={{ marginBottom: "0.75rem" }}>
                      <label
                        style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}
                      >
                        Border Color
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                          type="color"
                          value={wheelBorder.color}
                          onChange={(e) => {
                            setIsCustomBorder(true)
                            setWheelBorder({ ...wheelBorder, color: e.target.value })
                          }}
                          style={{
                            width: "3rem",
                            height: "2.5rem",
                            cursor: "pointer",
                            border: "1px solid #d4d4d8",
                            borderRadius: "0.375rem",
                          }}
                        />
                        <input
                          type="text"
                          value={wheelBorder.color}
                          onChange={(e) => {
                            setIsCustomBorder(true)
                            setWheelBorder({ ...wheelBorder, color: e.target.value })
                          }}
                          style={{
                            flex: 1,
                            padding: "0.625rem",
                            border: "1px solid #d4d4d8",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                            fontFamily: "monospace",
                          }}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: "0.75rem" }}>
                      <label
                        style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}
                      >
                        Border Width: {wheelBorder.width}px
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={wheelBorder.width}
                        onChange={(e) => {
                          setIsCustomBorder(true)
                          setWheelBorder({ ...wheelBorder, width: Number(e.target.value) })
                        }}
                        style={{
                          width: "100%",
                          cursor: "pointer",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.75rem",
                          color: "#71717a",
                          marginTop: "0.25rem",
                        }}
                      >
                        <span>1px</span>
                        <span>20px</span>
                      </div>
                    </div>

                    <div>
                      <label
                        style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}
                      >
                        Border Style
                      </label>
                      <select
                        value={wheelBorder.style}
                        onChange={(e) => {
                          setIsCustomBorder(true)
                          setWheelBorder({ ...wheelBorder, style: e.target.value as "solid" | "dashed" | "dotted" })
                        }}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          border: "1px solid #d4d4d8",
                          borderRadius: "0.375rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsSpinOpen(true)}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                background: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Open Spin to Win
            </button>
          </div>

          {/* Flash Sale Popup Demo */}
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Flash Sale Popup</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={saleTheme}
                  onChange={(e) => setSaleTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Size
                </label>
                <select
                  value={saleSize}
                  onChange={(e) => setSaleSize(e.target.value as SaleSize)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="compact">Compact (24rem)</option>
                  <option value="standard">Standard (32rem)</option>
                  <option value="wide">Wide (56rem)</option>
                  <option value="full">Full Width (90%)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsFlashSaleOpen(true)}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Open Flash Sale Popup
            </button>
          </div>

          {/* Product Upsell Popup Demo */}
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Product Upsell Popup</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={upsellTheme}
                  onChange={(e) => setUpsellTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Layout
                </label>
                <select
                  value={upsellLayout}
                  onChange={(e) => setUpsellLayout(e.target.value as UpsellLayout)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="grid">Grid (Multi-select)</option>
                  <option value="carousel">Carousel (One at a time)</option>
                  <option value="card">Card (List view)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsUpsellOpen(true)}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Open Upsell Popup
            </button>
          </div>

          {/* Scratch Card Popup Demo */}
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Scratch Card Popup</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={scratchTheme}
                  onChange={(e) => setScratchTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Image Position
                </label>
                <select
                  value={scratchImagePosition}
                  onChange={(e) => setScratchImagePosition(e.target.value as ImagePosition)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="none">None (Card Only)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsScratchOpen(true)}
              style={{
                width: "100%",
                padding: "0.75rem 1.5rem",
                background: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "1rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Open Scratch Card
            </button>
          </div>

          {/* Free Shipping Bar Demo */}
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Free Shipping Bar</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={shippingTheme}
                  onChange={(e) => setShippingTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Position
                </label>
                <select
                  value={shippingPosition}
                  onChange={(e) => setShippingPosition(e.target.value as ShippingBarPosition)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Cart Value: ${cartValue.toFixed(2)} / ${shippingThreshold.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={shippingThreshold + 20}
                  step="5"
                  value={cartValue}
                  onChange={(e) => setCartValue(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "#71717a",
                    marginTop: "0.25rem",
                  }}
                >
                  <span>$0</span>
                  <span>${shippingThreshold + 20}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  id="show-email-capture"
                  type="checkbox"
                  checked={showEmailCapture}
                  onChange={(e) => setShowEmailCapture(e.target.checked)}
                  style={{
                    width: "1rem",
                    height: "1rem",
                    cursor: "pointer",
                  }}
                />
                <label htmlFor="show-email-capture" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                  Show "Claim Discount" button when unlocked
                </label>
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "#fafafa",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: "#52525b",
              }}
            >
              <strong>Current State:</strong>{" "}
              {cartValue === 0
                ? "Empty"
                : cartValue >= shippingThreshold
                  ? showEmailCapture
                    ? "Unlocked 🎉 (Email capture enabled)"
                    : "Unlocked 🎉"
                  : shippingThreshold - cartValue <= 10
                    ? "Near Miss ⚡"
                    : "Progress 🚚"}
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Social Proof Notifications</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={socialProofTheme}
                  onChange={(e) => setSocialProofTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.75rem" }}>
                  Show Notification
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button
                    onClick={() => setManualNotification(purchaseNotification)}
                    style={{
                      padding: "0.625rem 1rem",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
                  >
                    🛍️ Show Purchase Notification
                  </button>
                  <button
                    onClick={() => setManualNotification(visitorNotification)}
                    style={{
                      padding: "0.625rem 1rem",
                      background: "#8b5cf6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#7c3aed")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#8b5cf6")}
                  >
                    👥 Show Visitor Notification
                  </button>
                  <button
                    onClick={() => setManualNotification(reviewNotification)}
                    style={{
                      padding: "0.625rem 1rem",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
                  >
                    ⭐ Show Review Notification
                  </button>
                  <button
                    onClick={() => setManualNotification(null)}
                    style={{
                      padding: "0.625rem 1rem",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#4b5563")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#6b7280")}
                  >
                    🔄 Auto-Rotate All Types
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "#fafafa",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: "#52525b",
              }}
            >
              <strong>Live Demo:</strong> Check the bottom-left corner!
              {manualNotification
                ? ` Displaying ${manualNotification.type} notification.`
                : " Notifications are rotating through all 3 types: Purchase, Visitor, and Review."}
            </div>
          </div>

          {/* ADDED: Countdown Timer Banner configuration panel */}
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Countdown Timer Banner</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Theme
                </label>
                <select
                  value={bannerTheme}
                  onChange={(e) => setBannerTheme(e.target.value as PopupTheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="minimal">Minimal</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="glass">Glass</option>
                  <option value="dark">Dark</option>
                  <option value="gradient">Gradient</option>
                  <option value="luxury">Luxury</option>
                  <option value="neon">Neon</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Position
                </label>
                <select
                  value={bannerPosition}
                  onChange={(e) => setBannerPosition(e.target.value as BannerPosition)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                  Color Scheme
                </label>
                <select
                  value={bannerColorScheme}
                  onChange={(e) => setBannerColorScheme(e.target.value as ColorScheme)}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    border: "1px solid #d4d4d8",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="urgent">Urgent (Red)</option>
                  <option value="success">Success (Green)</option>
                  <option value="info">Info (Blue)</option>
                  <option value="custom">Custom (Theme-based)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  id="show-banner"
                  type="checkbox"
                  checked={showBanner}
                  onChange={(e) => setShowBanner(e.target.checked)}
                  style={{
                    width: "1rem",
                    height: "1rem",
                    cursor: "pointer",
                  }}
                />
                <label htmlFor="show-banner" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                  Show Banner
                </label>
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "#fafafa",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: "#52525b",
              }}
            >
              <strong>Current State:</strong>{" "}
              {showBanner ? `Visible at ${bannerPosition}` : "Hidden (toggle to show)"}
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div
          style={{
            background: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "2rem",
            marginTop: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Documentation</h2>

          <div style={{ display: "grid", gap: "2rem" }}>
            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Spin to Win Popup</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Features</h4>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <li>Interactive spinning wheel with smooth animations</li>
                    <li>Customizable prizes with colors and probabilities</li>
                    <li>Email and name collection with validation</li>
                    <li>GDPR compliance checkbox (configurable)</li>
                    <li>Success state with prize reveal and discount code</li>
                    <li>Same layout options as Email Popup (left, right, top, bottom, none)</li>
                    <li>10 pre-designed themes with shared theme system</li>
                    <li>Fully responsive design</li>
                    <li>Prevents closing during spin animation</li>
                    <li>Pop-in animations for success state</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Image Position Options</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Left</strong> - Image on left, wheel and form on right (default, best for desktop)
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Right</strong> - Image on right, wheel and form on left
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Top</strong> - Image above, wheel and form below (good for mobile)
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Bottom</strong> - Image below, wheel and form above
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>None</strong> - Centered wheel and form only, no image (compact, fast-loading)
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Usage Example</h4>
                  <pre
                    style={{
                      background: "#fafafa",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      overflow: "auto",
                      lineHeight: 1.6,
                    }}
                  >
                    {`<SpinToWinPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  theme="modern"
  imagePosition="left"
  title="Spin to Win!"
  description="Enter your email and spin for exciting discounts!"
  buttonText="Spin Now"
  spinButtonText="SPIN"
  successMessage="Congratulations!"
  prizes={[
    {
      id: "1",
      label: "10% OFF",
      value: "SAVE10",
      probability: 30,
      color: "#3b82f6"
    },
    {
      id: "2",
      label: "15% OFF",
      value: "SAVE15",
      probability: 25,
      color: "#8b5cf6"
    },
    // ... more prizes
  ]}
  showGdprCheckbox={true}
  collectName={true}
  onWin={(data) => console.log("Won:", data.prize)}
/>`}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Customizing Prizes</h4>
                  <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                    Each prize requires:{" "}
                    <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>
                      id
                    </code>{" "}
                    (unique),
                    <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>
                      label
                    </code>{" "}
                    (shown on wheel),
                    <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>
                      value
                    </code>{" "}
                    (discount code),
                    <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>
                      probability
                    </code>{" "}
                    (weight 0-100), and
                    <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>
                      color
                    </code>{" "}
                    (segment color).
                  </p>
                  <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    Probabilities don't need to add up to 100 - they're relative weights. Higher probability = more
                    likely to win.
                  </p>
                </div>
              </div>
            </section>

            {/* Product Upsell Documentation */}
            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Product Upsell Popup</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Features</h4>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <li>Multi-product selection with visual feedback (checkmarks)</li>
                    <li>Star ratings and review counts for social proof</li>
                    <li>Price comparison (original vs sale price)</li>
                    <li>Individual product savings badges</li>
                    <li>Bundle discount for multiple items</li>
                    <li>Real-time order summary with total calculation</li>
                    <li>Loading state during add to cart</li>
                    <li>Empty state handling</li>
                    <li>8 pre-designed themes with CSS variables</li>
                    <li>3 layout options: Grid, Carousel, and Card</li>
                    <li>Fully responsive across all layouts</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Available Layouts</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Grid</strong> - Multi-select grid layout perfect for browsing multiple products at once.
                      Click products to toggle selection. Best for 2-6 products.
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Carousel</strong> - One product at a time with navigation arrows and dots. Great for
                      showcasing individual products with detailed focus. Best for 3-5 premium items.
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Card</strong> - Horizontal card list layout with add buttons. Compact and scannable,
                      perfect for mobile-first experiences. Best for 2-6 products.
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Usage Example</h4>
                  <pre
                    style={{
                      background: "#fafafa",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      overflow: "auto",
                      lineHeight: 1.6,
                    }}
                  >
                    {`<ProductUpsellPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  theme="modern"
  layout="grid"  // or "carousel" or "card"
  headline="Complete Your Look"
  subheadline="Customers who bought this also loved:"
  products={[
    {
      id: "1",
      image: "/products/earbuds.jpg",
      title: "Premium Wireless Earbuds",
      price: 79.99,
      compareAtPrice: 129.99,
      rating: 5,
      reviewCount: 247,
      savingsPercent: 38,
    },
    // ... more products
  ]}
  bundleDiscount={15}
  bundleMessage="Save {discount}% when you bundle!"
  ctaText="Add to Cart"
  secondaryCtaText="No Thanks"
  onAddToCart={(products) => addToCart(products)}
/>`}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Available Themes</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Modern</strong> - Clean blue design perfect for tech and e-commerce stores
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Minimal</strong> - Understated gray palette for sophisticated brands
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Elegant</strong> - Purple accents on warm background for luxury items
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Bold</strong> - Bold design for attention-grabbing promotions
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Glass</strong> - Modern glass effect for sleek designs
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Dark</strong> - Dark mode optimized for luxury items
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Gradient</strong> - Gradient backgrounds for vibrant visuals
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Luxury</strong> - Gold on black for exclusive, high-end products
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Neon</strong> - Neon colors for cyberpunk themes
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Ocean</strong> - Ocean-themed design for marine or eco-friendly brands
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Bundle Discounts</h4>
                  <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    Set a{" "}
                    <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>
                      bundleDiscount
                    </code>{" "}
                    percentage (e.g., 15 for 15% off) to incentivize multiple purchases. The discount automatically
                    applies when 2+ items are selected, showing the savings in the order summary.
                  </p>
                </div>
              </div>
            </section>

            {/* Flash Sale Documentation */}
            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Flash Sale Popup</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Features</h4>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <li>Live countdown timer with days, hours, minutes, and seconds</li>
                    <li>Urgency indicators and FOMO messaging</li>
                    <li>Discount percentage display with circular badge</li>
                    <li>Price comparison (original vs sale price)</li>
                    <li>Stock availability warning (optional)</li>
                    <li>Auto-hide when timer expires (optional)</li>
                    <li>8 pre-designed themes</li>
                    <li>4 size variants (compact, standard, wide, full-width)</li>
                    <li>Custom CTA button with callback</li>
                    <li>Fully responsive design</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Usage Example</h4>
                  <pre
                    style={{
                      background: "#fafafa",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      overflow: "auto",
                      lineHeight: 1.6,
                    }}
                  >
                    {`<FlashSalePopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  theme="urgent"
  size="wide"
  headline="Black Friday Sale!"
  supportingText="Biggest sale of the year"
  discountPercent="50"
  originalPrice="$199"
  salePrice="$99"
  urgencyMessage="Hurry! Sale ends soon!"
  endTime={new Date(Date.now() + 2 * 60 * 60 * 1000)}
  stockMessage="Only 5 left in stock!"
  ctaText="Shop Now"
  onCtaClick={() => window.open('/shop')}
  autoHideOnExpire={true}
/>`}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Available Sizes</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Compact</strong> - 24rem (384px) - Small, unobtrusive popup for minimal impact
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Standard</strong> - 32rem (512px) - Default size, balanced for most use cases
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Wide</strong> - 56rem (896px) - Horizontal layout with more space, great for banners
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Full</strong> - 90% of viewport - Maximum width banner style for hero promotions
                    </div>
                  </div>
                  <p style={{ color: "#52525b", marginTop: "0.75rem", fontSize: "0.875rem" }}>
                    Note: Wide and Full sizes use horizontal layout with the discount badge on the right side.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Available Themes</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Modern</strong> - Clean blue design perfect for tech and e-commerce stores
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Minimal</strong> - Understated gray palette for sophisticated brands
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Elegant</strong> - Purple accents on warm background for luxury items
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Bold</strong> - Bold design for attention-grabbing promotions
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Glass</strong> - Modern glass effect for sleek designs
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Dark</strong> - Dark mode optimized for tech/gaming brands
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Neon</strong> - Cyberpunk style with glowing neon effects
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Gradient</strong> - Gradient backgrounds for vibrant visuals
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Luxury</strong> - Gold on black for premium/exclusive brands
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Ocean</strong> - Ocean-themed design for marine or eco-friendly brands
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Email Popup Documentation */}
            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Email Popup</h3>
              <p style={{ color: "#52525b", marginBottom: "0.75rem" }}>
                See above for email popup features and usage. All three components share the same lean architecture with
                zero dependencies and tiny bundle size (~15KB gzipped combined).
              </p>
            </section>

            {/* Scratch Card Documentation */}
            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Scratch Card Popup</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Features</h4>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <li>Interactive canvas-based scratch effect with touch and mouse support</li>
                    <li>Real-time scratch progress tracking with percentage display</li>
                    <li>Customizable reveal threshold (default 50%)</li>
                    <li>Prize display with text, subtext, and discount code</li>
                    <li>Optional email collection after prize reveal</li>
                    <li>GDPR compliance checkbox (configurable)</li>
                    <li>Pulse animation on prize reveal</li>
                    <li>Same layout options as Email Popup (left, right, top, bottom, none)</li>
                    <li>10 pre-designed themes with shared theme system</li>
                    <li>Fully responsive with touch-optimized scratching</li>
                    <li>Canvas automatically scales for high-DPI screens</li>
                    <li>Zero external dependencies</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Usage Example</h4>
                  <pre
                    style={{
                      background: "#fafafa",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      overflow: "auto",
                      lineHeight: 1.6,
                    }}
                  >
                    {`<ScratchCardPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  theme="modern"
  imagePosition="left"
  title="Scratch to Win!"
  description="Scratch the card below to reveal your exclusive prize!"
  prize={{
    text: "20% OFF",
    subtext: "Your Next Purchase",
    code: "SCRATCH20",
  }}
  scratchText="Scratch Here"
  revealThreshold={50}
  collectEmail={true}
  emailLabel="Enter your email to claim your prize"
  buttonText="Claim Prize"
  showGdprCheckbox={true}
  onSubmit={(data) => console.log("Claimed:", data)}
/>`}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Prize Configuration</h4>
                  <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "0.5rem" }}>
                    The prize object supports three properties:
                  </p>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>text</strong> - Main prize text (e.g., "20% OFF", "FREE SHIPPING")
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>subtext</strong> - Optional supporting text (e.g., "Your Next Purchase", "Orders Over $50")
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>code</strong> - Optional discount code displayed after reveal (e.g., "SCRATCH20")
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Reveal Threshold</h4>
                  <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    Set <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>revealThreshold</code> (0-100) to control how much needs to be scratched before auto-revealing the prize. Lower values (30-40) make it easier, while higher values (60-70) require more scratching for engagement.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Email Collection</h4>
                  <p style={{ color: "#52525b", fontSize: "0.875rem", lineHeight: 1.6 }}>
                    Set <code style={{ background: "#fafafa", padding: "0.125rem 0.375rem", borderRadius: "0.25rem" }}>collectEmail={"{"}true{"}"}</code> to show an email form after the prize is revealed. If false, a "Got It!" button appears instead. Perfect for building your email list while providing instant gratification.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Best Practices</h4>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      color: "#52525b",
                      fontSize: "0.875rem",
                    }}
                  >
                    <li>Use bold, large text for the prize to make it immediately visible on reveal</li>
                    <li>Set reveal threshold between 40-60% for optimal balance of engagement and frustration</li>
                    <li>Keep scratch text short (2-3 words max) for better visibility</li>
                    <li>Always include a discount code for email collection to incentivize opt-in</li>
                    <li>Test on both touch and mouse devices to ensure smooth scratching experience</li>
                    <li>Match theme colors to your prize type (gold for premium, bright for fun discounts)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Social Proof Notifications</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Features</h4>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <li>3 notification variants: Purchase, Visitor, and Review</li>
                    <li>Fixed positioning with 4 corner options (top/bottom, left/right)</li>
                    <li>Auto-rotation between multiple notifications</li>
                    <li>Customizable display duration per notification</li>
                    <li>Session limits to prevent notification fatigue</li>
                    <li>Smooth slide-in and fade-out animations</li>
                    <li>Hover effect for enhanced interactivity</li>
                    <li>Click handler for tracking or navigation</li>
                    <li>Verified badges for credibility</li>
                    <li>Trending indicators and star ratings</li>
                    <li>10 theme support with shared theme system</li>
                    <li>Fully responsive (mobile-optimized)</li>
                    <li>Zero external dependencies</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Notification Types</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Purchase</strong> - Shows recent customer purchases with name, location, product, and
                      timestamp. Includes optional verified badge for trust.
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Visitor</strong> - Displays live visitor count viewing or shopping. Can show trending
                      indicator for FOMO effect.
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>Review</strong> - Features star rating, review count, and optional recent review quote
                      with author and verified badge.
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Usage Example</h4>
                  <pre
                    style={{
                      background: "#fafafa",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      overflow: "auto",
                      lineHeight: 1.6,
                    }}
                  >
                    {`<SocialProofNotification
  notifications={[
    {
      type: "purchase",
      data: {
        customerName: "Sarah M.",
        location: "New York, NY",
        productName: "Premium Wireless Earbuds",
        timestamp: "2 minutes ago",
        verified: true,
      },
      duration: 5000,
    },
    {
      type: "visitor",
      data: {
        count: 23,
        context: "viewing",
        trending: true,
      },
      duration: 5000,
    },
    {
      type: "review",
      data: {
        rating: 5,
        reviewCount: 1234,
        recentReview: {
          text: "Amazing quality!",
          author: "Michael R.",
          verified: true,
        },
      },
      duration: 6000,
    },
  ]}
  theme="modern"
  position="bottom-left"
  rotationInterval={5000}
  maxPerSession={5}
  showIcons={true}
  onClick={(notification) => console.log(notification)}
/>`}
                  </pre>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Configuration Options</h4>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>position</strong> - Choose from bottom-left, bottom-right, top-left, or top-right
                      (default: bottom-left)
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>rotationInterval</strong> - Time between notifications in ms (default: 5000ms / 5 seconds)
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>maxPerSession</strong> - Maximum notifications to show per session (default: 5)
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>showIcons</strong> - Display emoji icons for each notification type (default: true)
                    </div>
                    <div style={{ padding: "0.75rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                      <strong>duration</strong> - Per-notification display time in ms (overrides rotationInterval)
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Best Practices</h4>
                  <ul
                    style={{
                      listStyle: "disc",
                      paddingLeft: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      color: "#52525b",
                      fontSize: "0.875rem",
                    }}
                  >
                    <li>Use real customer data for purchase notifications to maintain authenticity</li>
                    <li>Keep maxPerSession low (3-5) to avoid overwhelming users</li>
                    <li>Set rotationInterval between 4-6 seconds for optimal readability</li>
                    <li>Enable verified badges for purchase and review notifications to build trust</li>
                    <li>Position notifications away from CTAs to avoid blocking important content</li>
                    <li>Use visitor notifications during high-traffic periods for maximum FOMO effect</li>
                    <li>Match theme to your website's design for cohesive branding</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Popup Instances */}
        <EmailPopup
          isOpen={isEmailOpen}
          onClose={() => setIsEmailOpen(false)}
          theme={emailTheme}
          imagePosition={imagePosition}
          title="Join Our Community"
          description="Get exclusive updates, early access to new features, and special offers delivered to your inbox."
          buttonText="Subscribe Now"
          successMessage="Welcome to the community! Check your email for confirmation."
          discountCode="WELCOME15"
          showGdprCheckbox={true}
          collectName={true}
          onSubmit={handleEmailSubmit}
        />

        <SpinToWinPopup
          isOpen={isSpinOpen}
          onClose={() => setIsSpinOpen(false)}
          theme={spinTheme}
          imagePosition={spinImagePosition}
          title="Spin to Win Amazing Prizes!"
          description="Enter your email and spin the wheel for a chance to win exclusive discounts!"
          buttonText="Enter & Spin"
          spinButtonText="SPIN"
          successMessage="You're a Winner!"
          showGdprCheckbox={true}
          collectName={true}
          {...(isCustomBorder ? { wheelBorder } : {})}
          onWin={handleSpinWin}
        />

        <FlashSalePopup
          isOpen={isFlashSaleOpen}
          onClose={() => setIsFlashSaleOpen(false)}
          theme={saleTheme}
          size={saleSize}
          headline="Flash Sale!"
          supportingText="Limited time offer - Don't miss out on incredible savings!"
          discountPercent="50"
          originalPrice="$199"
          salePrice="$99"
          urgencyMessage="Hurry! Sale ends soon!"
          endTime={flashSaleEndTime}
          stockMessage="Only 5 left in stock!"
          ctaText="Shop Now"
          onCtaClick={handleFlashSaleCta}
          autoHideOnExpire={false}
        />

        <ProductUpsellPopup
          isOpen={isUpsellOpen}
          onClose={() => setIsUpsellOpen(false)}
          theme={upsellTheme}
          layout={upsellLayout}
          headline="Complete Your Look"
          subheadline="Customers who bought this also loved these products:"
          products={sampleProducts}
          bundleDiscount={15}
          bundleMessage="Save {discount}% when you bundle!"
          ctaText="Add to Cart"
          secondaryCtaText="No Thanks"
          onAddToCart={handleAddToCart}
        />

        <ScratchCardPopup
          isOpen={isScratchOpen}
          onClose={() => setIsScratchOpen(false)}
          theme={scratchTheme}
          imagePosition={scratchImagePosition}
          title="Scratch to Win!"
          description="Scratch the card below to reveal your exclusive prize!"
          prize={{
            text: "20% OFF",
            subtext: "Your Next Purchase",
            code: "SCRATCH20",
          }}
          scratchText="Scratch Here"
          revealThreshold={50}
          collectEmail={true}
          emailLabel="Enter your email to claim your prize"
          buttonText="Claim Prize"
          showGdprCheckbox={true}
          gdprLabel="I agree to receive promotional emails"
          onSubmit={handleScratchSubmit}
        />
      </div>
    </div>
  )
}
