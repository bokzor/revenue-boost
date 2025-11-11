"use client"

import { useState } from "react"
import { EmailPopup, type PopupTheme, type ImagePosition } from "@/components/email-popup"

export default function PopupDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState<PopupTheme>("modern")
  const [imagePosition, setImagePosition] = useState<ImagePosition>("left")

  const handleSubmit = async (data: { email: string; name?: string; gdprConsent: boolean }) => {
    console.log("Form submitted:", data)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fafafa 0%, #e5e5e5 100%)", padding: "2rem" }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "1rem" }}>Email Popup Component</h1>
          <p style={{ fontSize: "1.125rem", color: "#52525b" }}>
            Professional, customizable, and GDPR-compliant email collection popup
          </p>
        </div>

        {/* Demo Controls */}
        <div
          style={{
            background: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "2rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Live Demo</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as PopupTheme)}
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
                <option value="glass">Glass (Glassmorphism)</option>
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
            onClick={() => setIsOpen(true)}
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
            Open Popup
          </button>
        </div>

        {/* Documentation */}
        <div
          style={{
            background: "white",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Documentation</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Installation</h3>
              <pre
                style={{
                  background: "#fafafa",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  overflow: "auto",
                }}
              >
                {`import { EmailPopup } from '@/components/email-popup'`}
              </pre>
            </section>

            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Key Features</h3>
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <li>
                  <strong>Zero dependencies</strong> - Only React, no external UI libraries
                </li>
                <li>
                  <strong>Tiny bundle size</strong> - Optimized for Shopify storefronts (~8KB gzipped)
                </li>
                <li>
                  <strong>10 pre-designed themes</strong> - Modern, Minimal, Elegant, Bold, Glass, Dark, Gradient,
                  Luxury, Neon, Ocean
                </li>
                <li>
                  <strong>GDPR compliant</strong> - Built-in consent checkbox
                </li>
                <li>
                  <strong>Fully responsive</strong> - Perfect on all screen sizes
                </li>
                <li>
                  <strong>Flexible layout</strong> - Image positioning (left, right, top, bottom, or none for form-only)
                </li>
                <li>
                  <strong>Custom styling</strong> - Override colors to match your brand
                </li>
                <li>
                  <strong>Form validation</strong> - Built-in email and field validation
                </li>
                <li>
                  <strong>Success state</strong> - Optional discount code display
                </li>
                <li>
                  <strong>Keyboard accessible</strong> - ESC key to close
                </li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Available Themes</h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Modern</strong> - Clean black and white design, perfect for contemporary brands
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Minimal</strong> - Ultra-light design with thin fonts, ideal for luxury/minimalist brands
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Elegant</strong> - Soft rose tones with serif fonts, perfect for beauty/fashion brands
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Bold</strong> - Vibrant gradients and heavy fonts, great for energetic brands
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Glass</strong> - Glassmorphism with blur effects, modern and sophisticated
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Dark</strong> - Dark mode optimized, perfect for tech/gaming brands
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Gradient</strong> - Purple gradient with white accents, eye-catching and vibrant
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Luxury</strong> - Gold on black, perfect for premium/exclusive brands
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Neon</strong> - Cyberpunk neon glow effects, ideal for tech/gaming brands
                </div>
                <div style={{ padding: "1rem", background: "#fafafa", borderRadius: "0.5rem" }}>
                  <strong>Ocean</strong> - Fresh blue tones, great for health/wellness brands
                </div>
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Basic Usage</h3>
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
                {`<EmailPopup
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  theme="modern"
  imagePosition="left"
  onSubmit={async (data) => {
    // Handle form submission
    await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }}
/>`}
              </pre>
            </section>

            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Image Position Options</h3>
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <li>
                  <strong>left</strong> - Image on left, form on right (2-column layout on desktop)
                </li>
                <li>
                  <strong>right</strong> - Image on right, form on left (2-column layout on desktop)
                </li>
                <li>
                  <strong>top</strong> - Image on top, form below (stacked layout)
                </li>
                <li>
                  <strong>bottom</strong> - Image on bottom, form above (stacked layout)
                </li>
                <li>
                  <strong>none</strong> - No image, form only (centered single-column layout, perfect for simple
                  opt-ins)
                </li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Shopify Integration</h3>
              <p style={{ lineHeight: 1.6, marginBottom: "0.75rem" }}>
                This component is designed specifically for Shopify storefronts with minimal overhead:
              </p>
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <li>No external dependencies to conflict with theme code</li>
                <li>Scoped CSS prevents style conflicts</li>
                <li>Self-contained - just drop in and configure</li>
                <li>Optimized bundle size for fast loading</li>
                <li>Works with any Shopify theme architecture</li>
              </ul>
            </section>

            <section>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem" }}>Bundle Size Comparison</h3>
              <div
                style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "0.5rem", padding: "1rem" }}
              >
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>With external dependencies:</p>
                <p style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
                  ~45KB (gzipped) - includes Radix UI, shadcn components
                </p>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#16a34a" }}>Vanilla CSS version:</p>
                <p style={{ fontSize: "0.875rem", color: "#16a34a" }}>~8KB (gzipped) - only React and vanilla CSS</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Popup Instance */}
      <EmailPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        theme={theme}
        imagePosition={imagePosition}
        title="Join Our Community"
        description="Get exclusive updates, early access to new features, and special offers delivered to your inbox."
        buttonText="Subscribe Now"
        successMessage="Welcome to the community! Check your email for confirmation."
        discountCode="WELCOME15"
        showGdprCheckbox={true}
        collectName={true}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
