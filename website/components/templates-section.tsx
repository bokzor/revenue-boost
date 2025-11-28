"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Gift, Timer, Ticket, LogOut, ShoppingCart, Users, Clock, Truck, Package, Megaphone } from "lucide-react"

const templates = [
  {
    id: "NEWSLETTER",
    name: "Newsletter",
    icon: Mail,
    description: "Collect emails with signup forms",
    preview: {
      headline: "Get 15% OFF",
      subtext: "Subscribe to our newsletter",
      cta: "Subscribe",
      showEmail: true,
    },
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "SPIN_TO_WIN",
    name: "Spin to Win",
    icon: Gift,
    description: "Gamified wheel of fortune",
    preview: {
      headline: "Spin to Win!",
      subtext: "Try your luck for a discount",
      cta: "Spin Now",
      showWheel: true,
    },
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "FLASH_SALE",
    name: "Flash Sale",
    icon: Timer,
    description: "Time-limited offers",
    preview: {
      headline: "🔥 Flash Sale!",
      subtext: "30% OFF - Ends in 2:00:00",
      cta: "Shop Now",
      showTimer: true,
    },
    color: "from-orange-500 to-red-500",
  },
  {
    id: "SCRATCH_CARD",
    name: "Scratch Card",
    icon: Ticket,
    description: "Interactive scratch-to-reveal",
    preview: {
      headline: "Scratch & Win!",
      subtext: "Reveal your mystery discount",
      cta: "Claim Prize",
      showScratch: true,
    },
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "EXIT_INTENT",
    name: "Exit Intent",
    icon: LogOut,
    description: "Capture leaving visitors",
    preview: {
      headline: "Wait! Don't Go",
      subtext: "Get 10% off before you leave",
      cta: "Get Discount",
      showEmail: true,
    },
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "CART_ABANDONMENT",
    name: "Cart Abandonment",
    icon: ShoppingCart,
    description: "Recover abandoned carts",
    preview: {
      headline: "Complete Your Order",
      subtext: "Your cart is waiting + 15% off",
      cta: "Return to Cart",
      showCart: true,
    },
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "SOCIAL_PROOF",
    name: "Social Proof",
    icon: Users,
    description: "Real-time purchase notifications",
    preview: {
      headline: "Sarah from NYC",
      subtext: "just purchased iPhone Case",
      cta: "",
      showNotification: true,
    },
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "COUNTDOWN_TIMER",
    name: "Countdown Timer",
    icon: Clock,
    description: "Create urgency with timers",
    preview: {
      headline: "Sale Ends Soon!",
      subtext: "03:24:15 remaining",
      cta: "Shop Now",
      showTimer: true,
    },
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "FREE_SHIPPING",
    name: "Free Shipping",
    icon: Truck,
    description: "Shipping threshold progress",
    preview: {
      headline: "Free Shipping",
      subtext: "Add $25 more to qualify",
      cta: "Continue Shopping",
      showProgress: true,
    },
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "PRODUCT_UPSELL",
    name: "Product Upsell",
    icon: Package,
    description: "Smart product recommendations",
    preview: {
      headline: "You May Also Like",
      subtext: "Customers also bought these",
      cta: "Add to Cart",
      showProducts: true,
    },
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "ANNOUNCEMENT",
    name: "Announcement",
    icon: Megaphone,
    description: "Important updates & promos",
    preview: {
      headline: "New Collection",
      subtext: "Check out our latest arrivals",
      cta: "Learn More",
      showBanner: true,
    },
    color: "from-indigo-500 to-violet-500",
  },
]

export function TemplatesSection() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])

  const renderPreview = () => {
    const { preview } = selectedTemplate
    const IconComponent = selectedTemplate.icon

    // Special render for Social Proof (notification style)
    if (selectedTemplate.id === "SOCIAL_PROOF") {
      return (
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-foreground">{preview.headline}</p>
            <p className="text-sm text-muted-foreground">{preview.subtext}</p>
            <p className="text-xs text-muted-foreground">2 minutes ago</p>
          </div>
        </div>
      )
    }

    // Special render for Free Shipping (bar style)
    if (selectedTemplate.id === "FREE_SHIPPING") {
      return (
        <div className="w-full max-w-md rounded-lg bg-card p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-500" />
              <span className="font-medium text-foreground">{preview.headline}</span>
            </div>
            <span className="text-sm text-muted-foreground">{preview.subtext}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
          </div>
        </div>
      )
    }

    // Default popup style
    return (
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
          ✕
        </div>
        <div className="mb-4 text-center">
          <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${selectedTemplate.color}`}>
            <IconComponent className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground">{preview.headline}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{preview.subtext}</p>
        </div>
        {preview.showEmail && (
          <div className="mb-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Enter your email
          </div>
        )}
        {preview.showTimer && (
          <div className="mb-3 flex justify-center gap-2 text-2xl font-bold text-foreground">
            <span className="rounded bg-muted px-2 py-1">02</span>
            <span>:</span>
            <span className="rounded bg-muted px-2 py-1">24</span>
            <span>:</span>
            <span className="rounded bg-muted px-2 py-1">15</span>
          </div>
        )}
        {preview.showWheel && (
          <div className="mb-3 flex justify-center">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30" />
              <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${selectedTemplate.color} animate-pulse`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}
        {preview.showScratch && (
          <div className="mb-3 flex justify-center">
            <div className="relative h-20 w-32 overflow-hidden rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <span className="text-2xl">🎁 ?</span>
              </div>
            </div>
          </div>
        )}
        {preview.cta && (
          <Button className={`w-full bg-gradient-to-r ${selectedTemplate.color} hover:opacity-90 text-white`}>
            {preview.cta}
          </Button>
        )}
      </div>
    )
  }

  return (
    <section id="templates" className="bg-secondary/30 px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">
            11 Template Types
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Ready-to-Use Templates for Every Goal</h2>
          <p className="text-lg text-muted-foreground">
            From email capture to gamification — choose the perfect template and customize it in minutes.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          {/* Template Preview */}
          <Card className="mb-8 overflow-hidden border-border/50">
            <div className={`relative flex min-h-[400px] items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-8`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid h-full w-full grid-cols-6 gap-4 p-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-white/20" />
                  ))}
                </div>
              </div>
              <div className="relative z-10">
                {renderPreview()}
              </div>
              {/* Template label */}
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="gap-2">
                  <selectedTemplate.icon className="h-4 w-4" />
                  {selectedTemplate.name}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Template Selector - Grid on mobile, flex on desktop */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:flex md:flex-wrap md:justify-center md:gap-3">
            {templates.map((template) => {
              const IconComponent = template.icon
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`flex flex-col items-center gap-1 rounded-lg px-3 py-3 text-xs font-medium transition-all md:flex-row md:gap-2 md:px-4 md:py-2 md:text-sm ${
                    selectedTemplate.id === template.id
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
