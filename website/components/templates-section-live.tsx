"use client"

import { useState, Suspense, lazy, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Mail, Gift, Timer, Ticket, LogOut, ShoppingCart,
  Users, Clock, Truck, Package, Megaphone,
  Smartphone, Tablet, Monitor
} from "lucide-react"

// Template metadata for the selector
const templates = [
  { id: "NEWSLETTER", name: "Newsletter", icon: Mail, color: "from-blue-500 to-cyan-500", description: "Collect emails with signup forms" },
  { id: "SPIN_TO_WIN", name: "Spin to Win", icon: Gift, color: "from-purple-500 to-pink-500", description: "Gamified wheel of fortune" },
  { id: "SCRATCH_CARD", name: "Scratch Card", icon: Ticket, color: "from-yellow-500 to-orange-500", description: "Interactive scratch-to-reveal" },
  { id: "FLASH_SALE", name: "Flash Sale", icon: Timer, color: "from-orange-500 to-red-500", description: "Time-limited offers" },
  { id: "COUNTDOWN_TIMER", name: "Countdown Timer", icon: Clock, color: "from-cyan-500 to-blue-500", description: "Create urgency with timers" },
  { id: "FREE_SHIPPING", name: "Free Shipping", icon: Truck, color: "from-green-500 to-emerald-500", description: "Shipping threshold progress" },
  { id: "CART_ABANDONMENT", name: "Cart Abandonment", icon: ShoppingCart, color: "from-emerald-500 to-teal-500", description: "Recover abandoned carts" },
  { id: "PRODUCT_UPSELL", name: "Product Upsell", icon: Package, color: "from-amber-500 to-yellow-500", description: "Smart product recommendations" },
  { id: "SOCIAL_PROOF", name: "Social Proof", icon: Users, color: "from-violet-500 to-purple-500", description: "Real-time purchase notifications" },
  { id: "ANNOUNCEMENT", name: "Announcement", icon: Megaphone, color: "from-indigo-500 to-violet-500", description: "Important updates & promos" },
  { id: "EXIT_INTENT", name: "Exit Intent", icon: LogOut, color: "from-rose-500 to-pink-500", description: "Capture leaving visitors" },
] as const

type TemplateType = typeof templates[number]["id"]
type DeviceType = "mobile" | "tablet" | "desktop"

// Device configurations with min viewport widths required to show them
const devices: { id: DeviceType; name: string; icon: typeof Smartphone; minViewportWidth: number; frameWidth: number }[] = [
  { id: "mobile", name: "Mobile", icon: Smartphone, minViewportWidth: 0, frameWidth: 390 },
  { id: "tablet", name: "Tablet", icon: Tablet, minViewportWidth: 768, frameWidth: 768 },
  { id: "desktop", name: "Desktop", icon: Monitor, minViewportWidth: 1024, frameWidth: 1024 },
]

// Lazy load the preview component to avoid SSR issues
const LivePopupPreview = lazy(() => import("./live-popup-preview"))

// Loading fallback
const PreviewSkeleton = () => (
  <div className="flex items-center justify-center h-[500px]">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-16 h-16 bg-white/20 rounded-full" />
      <div className="w-48 h-6 bg-white/20 rounded" />
      <div className="w-32 h-4 bg-white/10 rounded" />
    </div>
  </div>
)

// Hook to get current viewport width
function useViewportWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return width
}

export function TemplatesSectionLive() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("NEWSLETTER")
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>("mobile")
  const selected = templates.find(t => t.id === selectedTemplate) || templates[0]
  const viewportWidth = useViewportWidth()

  // Filter available devices based on viewport width
  const availableDevices = devices.filter(d => viewportWidth >= d.minViewportWidth + 100) // +100 for padding

  // Reset to mobile if current device is no longer available
  useEffect(() => {
    if (!availableDevices.find(d => d.id === selectedDevice)) {
      setSelectedDevice("mobile")
    }
  }, [availableDevices, selectedDevice])

  return (
    <section id="templates" className="bg-secondary/30 px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            11 Template Types
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Ready-to-Use Templates for Every Goal
          </h2>
          <p className="text-lg text-muted-foreground">
            From email capture to gamification — choose the perfect template and customize it in minutes.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          {/* Live Template Preview */}
          <Card className="mb-8 overflow-hidden border-border/50">
            {/* Device Switcher - only show if more than one device available */}
            {availableDevices.length > 1 && (
              <div className="flex items-center justify-center gap-2 border-b border-border/50 bg-slate-800/50 px-4 py-3">
                {availableDevices.map((device) => {
                  const IconComponent = device.icon
                  return (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDevice(device.id)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        selectedDevice === device.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                      title={`Preview on ${device.name}`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden sm:inline">{device.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex justify-center p-4 sm:p-6 w-full">
              <Suspense fallback={<PreviewSkeleton />}>
                <LivePopupPreview
                  templateType={selectedTemplate}
                  device={selectedDevice}
                />
              </Suspense>
            </div>

            {/* Footer with template info */}
            <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-3">
              <Badge variant="secondary" className="gap-2">
                <selected.icon className="h-4 w-4" />
                {selected.name}
              </Badge>
              <span className="text-sm text-muted-foreground">
                ✨ Try it - it's interactive!
              </span>
            </div>
          </Card>

          {/* Template Selector */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:flex md:flex-wrap md:justify-center md:gap-3">
            {templates.map((template) => {
              const IconComponent = template.icon
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-3 text-xs font-medium transition-all md:flex-row md:gap-2 md:px-4 md:py-2 md:text-sm ${
                    selectedTemplate === template.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted"
                  }`}
                  title={template.description}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-center leading-tight">{template.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

