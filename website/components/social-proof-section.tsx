"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, ShoppingBag, Flame } from "lucide-react"

const stats = [
  {
    icon: ShoppingBag,
    label: "Purchase Notifications",
    value: "+15-25%",
    description: "Conversion increase",
    color: "from-emerald-500 to-green-500",
  },
  {
    icon: Users,
    label: "Live Visitor Count",
    value: "+10-18%",
    description: "Conversion increase",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    label: "Sales Count (24h)",
    value: "+12-20%",
    description: "Conversion increase",
    color: "from-primary to-accent",
  },
  {
    icon: Flame,
    label: "Trending Products",
    value: "+8-12%",
    description: "Conversion increase",
    color: "from-orange-500 to-red-500",
  },
]

export function SocialProofSection() {
  return (
    <section className="bg-gradient-to-b from-secondary/50 to-background px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Real-Time Social Proof That Converts</h2>
          <p className="text-lg text-muted-foreground">
            Create FOMO and build trust with live notifications that show what others are buying.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50 bg-card">
              <CardContent className="p-6 text-center">
                <div
                  className={`mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${stat.color}`}
                >
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <p className="mb-1 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mb-2 font-medium text-foreground">{stat.label}</p>
                <p className="text-sm text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <SocialProofDemo />
        </div>
      </div>
    </section>
  )
}

function SocialProofDemo() {
  const [notifications, setNotifications] = useState([
    { name: "John from LA", product: "Premium Headphones", time: "2 min ago" },
    { name: "Emma from NYC", product: "Wireless Earbuds", time: "5 min ago" },
    { name: "Michael from Chicago", product: "Smart Watch", time: "8 min ago" },
  ])

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % notifications.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [notifications.length])

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-xl border border-border bg-card p-8">
      <div className="absolute left-4 top-4 text-sm font-medium text-muted-foreground">Live Preview</div>

      <div className="flex items-center justify-center py-8">
        <div className="relative">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-lg transition-all duration-500 ${
                index === activeIndex ? "translate-y-0 opacity-100" : "absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <ShoppingBag className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{notification.name}</p>
                <p className="text-sm text-muted-foreground">just purchased {notification.product}</p>
                <p className="text-xs text-muted-foreground">{notification.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {notifications.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-2 rounded-full transition-colors ${index === activeIndex ? "bg-primary" : "bg-muted"}`}
            aria-label={`Show notification ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
