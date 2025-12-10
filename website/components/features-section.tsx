import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Mail,
  Gift,
  ShoppingCart,
  Megaphone,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  MousePointerClick,
  Users
} from "lucide-react"

// Brand gradient: #AEE5AB → #0E7768
const categories = [
  {
    icon: Mail,
    title: "Grow Your Email List",
    count: 27,
    description: "Newsletter signups, spin-to-win wheels, and scratch cards to capture emails.",
    color: "from-[#AEE5AB] to-[#0E7768]",
    examples: ["Newsletter popups", "Spin-to-win wheels", "Scratch cards"],
  },
  {
    icon: Gift,
    title: "Boost Sales",
    count: 28,
    description: "Flash sales, countdown timers, and upsells to drive revenue.",
    color: "from-[#AEE5AB] to-[#0E7768]",
    examples: ["Flash sale banners", "Countdown timers", "Product upsells"],
  },
  {
    icon: ShoppingCart,
    title: "Recover Abandoned Carts",
    count: 6,
    description: "Smart exit-intent popups and cart reminders to save lost sales.",
    color: "from-[#AEE5AB] to-[#0E7768]",
    examples: ["Exit-intent offers", "Cart reminders", "Free shipping bars"],
  },
  {
    icon: Megaphone,
    title: "Announce & Engage",
    count: 16,
    description: "Announcements, social proof, and visitor notifications to build trust.",
    color: "from-[#AEE5AB] to-[#0E7768]",
    examples: ["Sales announcements", "Purchase notifications", "Visitor counts"],
  },
]

const triggers = [
  { icon: MousePointerClick, label: "Exit Intent", description: "Capture leaving visitors" },
  { icon: Clock, label: "Time on Page", description: "After X seconds" },
  { icon: Target, label: "Scroll Depth", description: "When engaged" },
  { icon: ShoppingCart, label: "Cart Value", description: "When cart hits $X" },
]

const targeting = [
  { icon: Users, label: "Customer Segments", description: "VIPs, first-time buyers" },
  { icon: Target, label: "Device Type", description: "Mobile vs desktop" },
  { icon: Clock, label: "New vs Returning", description: "Different offers" },
  { icon: Megaphone, label: "Page Targeting", description: "Specific products" },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4 gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            75+ Ready-to-Use Designs
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            A Design for Every Goal
          </h2>
          <p className="text-lg text-muted-foreground">
            Pick from our library of expert-designed popups. No design skills needed — just choose, customize, and launch.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.title}
              className="group relative overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color}`}
                >
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                  <Badge variant="secondary" className="text-xs">{category.count}</Badge>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{category.description}</p>
                <ul className="space-y-1">
                  {category.examples.map((example) => (
                    <li key={example} className="text-xs text-muted-foreground/80">
                      • {example}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Triggers & Targeting Section */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {/* Smart Triggers */}
          <div className="rounded-2xl border border-border/50 bg-card p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#AEE5AB] to-[#0E7768]">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Smart Triggers</h3>
                <p className="text-sm text-muted-foreground">Show at the perfect moment</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {triggers.map((trigger) => (
                <div key={trigger.label} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <trigger.icon className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{trigger.label}</p>
                    <p className="text-xs text-muted-foreground">{trigger.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Targeting */}
          <div className="rounded-2xl border border-border/50 bg-card p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#AEE5AB] to-[#0E7768]">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Advanced Targeting</h3>
                <p className="text-sm text-muted-foreground">Right message, right customer</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {targeting.map((target) => (
                <div key={target.label} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <target.icon className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{target.label}</p>
                    <p className="text-xs text-muted-foreground">{target.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <Link href="/designs">
              Browse All 75+ Designs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
