"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play, ShieldCheck, Star, Sparkles } from "lucide-react"

export function HeroSection() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const target = 15000
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 md:pb-32 md:pt-24">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute -left-40 -top-40 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-40 top-20 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="container mx-auto">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Trusted by {count.toLocaleString()}+ Shopify merchants</span>
          </Badge>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Turn visitors into{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">customers</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Capture leads, create urgency, and boost conversions with intelligent popups and real-time social proof.
            Zero configuration required.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent px-8 hover:opacity-90" asChild>
              <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
                Install on Shopify
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
              <a href="#templates">
                <Play className="h-4 w-4" />
                See Templates
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>4.9/5 on Shopify</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground">Free plan available</span>
            </div>
          </div>

          {/* ESP Integrations */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Works with your email platform</span>
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground/70">
              <span>Klaviyo</span>
              <span>•</span>
              <span>Mailchimp</span>
              <span>•</span>
              <span>Omnisend</span>
              <span>•</span>
              <span>ActiveCampaign</span>
              <span>•</span>
              <span className="text-muted-foreground/50">+ any Shopify-synced ESP</span>
            </div>
          </div>
        </div>

        {/* Hero Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-4 text-sm text-muted-foreground">yourstore.myshopify.com</span>
            </div>
            <div className="relative aspect-video bg-gradient-to-br from-muted to-secondary p-8">
              <HeroPopupPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroPopupPreview() {
  return (
    <div className="relative flex h-full items-center justify-center">
      {/* Background store mockup */}
      <div className="absolute inset-0 grid grid-cols-3 gap-4 p-4 opacity-30">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg bg-card/50" />
        ))}
      </div>

      {/* Popup Preview */}
      <div className="relative z-10 w-full max-w-sm animate-pulse rounded-2xl bg-card p-6 shadow-xl">
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
          ✕
        </div>
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h3 className="mb-2 text-center text-xl font-bold text-foreground">Get 15% OFF</h3>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Subscribe to our newsletter and get exclusive deals!
        </p>
        <div className="mb-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Enter your email...
        </div>
        <div className="rounded-lg bg-gradient-to-r from-primary to-accent py-3 text-center font-semibold text-primary-foreground">
          Claim My Discount
        </div>
      </div>

      {/* Social proof notification */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-lg bg-card p-3 shadow-lg">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500" />
        <div>
          <p className="text-sm font-medium text-foreground">Sarah from NYC</p>
          <p className="text-xs text-muted-foreground">just purchased iPhone Case</p>
        </div>
      </div>
    </div>
  )
}
