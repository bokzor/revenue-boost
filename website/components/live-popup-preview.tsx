"use client"

/**
 * LivePopupPreview - Renders actual popup components for the marketing site
 *
 * This component bridges the marketing website to the actual popup components
 * used in the Shopify app, providing real interactive demos.
 *
 * Features:
 * - Auto-respawn: When closed, popup reappears after 2.5 seconds
 * - Full E2E flow testing (spin wheel, form submit, etc.)
 *
 * Note: Uses dynamic import to ensure components only load on the client
 * to avoid SSR issues with browser-only APIs (like CSS.escape).
 */

import React, { useEffect, useState, useCallback } from "react"
import type { TemplateType } from "~/domains/campaigns/types/campaign"
import { DeviceFrame } from "~/shared/preview/DeviceFrame"

type DeviceType = "mobile" | "tablet" | "desktop"

interface LivePopupPreviewProps {
  templateType: TemplateType
  device?: DeviceType
}

// Time before popup respawns after being closed (in ms)
const RESPAWN_DELAY = 2500

// Loading placeholder
const LoadingPlaceholder = ({ device }: { device: DeviceType }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: device === "mobile" ? "600px" : "400px",
      color: "rgba(255,255,255,0.5)",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>✨</div>
      <div>Loading preview...</div>
    </div>
  </div>
)

// Closed state placeholder
const ClosedPlaceholder = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      minHeight: "400px",
      color: "rgba(0,0,0,0.4)",
      backgroundColor: "#f8f9fa",
    }}
  >
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>👋</div>
      <div style={{ fontSize: "14px" }}>Popup closed</div>
      <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>Reappearing soon...</div>
    </div>
  </div>
)

export default function LivePopupPreview({ templateType, device = "mobile" }: LivePopupPreviewProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [PreviewComponent, setPreviewComponent] = useState<React.ComponentType<{
    templateType: string
    config: Record<string, unknown>
    designConfig: Record<string, unknown>
    isVisible?: boolean
    onClose?: () => void
  }> | null>(null)
  const [demoConfig, setDemoConfig] = useState<{
    content: Record<string, unknown>
    design: Record<string, unknown>
  } | null>(null)

  // Handle close - hide popup and schedule respawn
  const handleClose = useCallback(() => {
    setIsVisible(false)

    // Respawn after delay
    setTimeout(() => {
      setIsVisible(true)
    }, RESPAWN_DELAY)
  }, [])

  // Reset visibility when template changes
  useEffect(() => {
    setIsVisible(true)
  }, [templateType])

  useEffect(() => {
    setMounted(true)

    // Dynamic imports to avoid SSR issues
    Promise.all([
      import("~/domains/popups/components/preview/TemplatePreview"),
      import("~/shared/preview/demo-configs"),
    ]).then(([previewModule, configModule]) => {
      setPreviewComponent(() => previewModule.TemplatePreview)
      setDemoConfig(configModule.getDemoConfig(templateType))
    })
  }, [templateType])

  if (!mounted || !PreviewComponent || !demoConfig) {
    return <LoadingPlaceholder device={device} />
  }

  // Merge content and design configs with preview mode enabled
  const config = {
    ...demoConfig.content,
    previewMode: true,
  }

  const designConfig = {
    ...demoConfig.design,
    previewMode: true,
    disablePortal: true,
  }

  const previewContent = (
    <PreviewComponent
      templateType={templateType}
      config={config}
      designConfig={designConfig}
      onClose={handleClose}
    />
  )

  return (
    <DeviceFrame device={device} addressBarUrl="your-store.myshopify.com">
      {isVisible ? previewContent : <ClosedPlaceholder />}
    </DeviceFrame>
  )
}

