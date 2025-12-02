"use client"

import { useState } from "react"
import { BottomSheetPopup } from "@/components/popups/bottom-sheet-popup"
import { CenteredModalPopup } from "@/components/popups/centered-modal-popup"
import { SlidePanelPopup } from "@/components/popups/slide-panel-popup"
import { ExitIntentPopup } from "@/components/popups/exit-intent-popup"
import { ImageLeftPopup } from "@/components/popups/image-left-popup"
import { ImageRightPopup } from "@/components/popups/image-right-popup"
import { ImageHeroPopup } from "@/components/popups/image-hero-popup"
import {
  Layers,
  Square,
  PanelBottom,
  LogOut,
  ImageIcon,
  LayoutTemplate,
  LucideComponent as ImageIconComponent,
} from "lucide-react"

export default function Home() {
  const [activePopup, setActivePopup] = useState<string | null>(null)

  const behaviorPopups = [
    {
      id: "bottom-sheet",
      name: "Bottom Sheet",
      description: "Native mobile feel with swipe-to-dismiss gesture and drag handle",
      icon: PanelBottom,
      color: "bg-stone-900 text-stone-50",
      mobile: "Full-width, swipe down",
      desktop: "Centered modal, click outside",
    },
    {
      id: "centered",
      name: "Centered Modal",
      description: "Classic centered modal with backdrop blur and Escape key support",
      icon: Square,
      color: "bg-orange-500 text-orange-50",
      mobile: "Bottom-anchored, 90% width",
      desktop: "Fixed 500px, fade + zoom",
    },
    {
      id: "slide-panel",
      name: "Slide Panel",
      description: "Story-like tall panel with drag handle and dynamic backdrop opacity",
      icon: Layers,
      color: "bg-amber-700 text-amber-50",
      mobile: "85% height, swipe down",
      desktop: "Two-column with hero image",
    },
    {
      id: "exit-intent",
      name: "Exit Intent",
      description: "Last-chance popup with playful design and two-column desktop layout",
      icon: LogOut,
      color: "bg-rose-500 text-rose-50",
      mobile: "Bottom sheet, full-width",
      desktop: "Wide modal with image side",
    },
  ]

  const imageLayoutPopups = [
    {
      id: "image-left",
      name: "Image Left",
      description: "Two-column layout with image on the left side for visual storytelling",
      icon: LayoutTemplate,
      color: "bg-teal-700 text-teal-50",
      mobile: "Image hidden, form only",
      desktop: "40/60 split, image left",
    },
    {
      id: "image-right",
      name: "Image Right",
      description: "Two-column layout with image on the right for content-first approach",
      icon: ImageIcon,
      color: "bg-indigo-600 text-indigo-50",
      mobile: "Image hidden, form only",
      desktop: "60/40 split, image right",
    },
    {
      id: "image-hero",
      name: "Image Hero",
      description: "Full-width hero image at top with form below for maximum visual impact",
      icon: ImageIconComponent,
      color: "bg-slate-800 text-slate-50",
      mobile: "Compact hero, scrollable",
      desktop: "Tall hero, fixed modal",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-20">
        <header className="mb-10 md:mb-16 text-center">
          <h1 className="mb-4 font-serif text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
            Newsletter Popup Collection
          </h1>
          <p className="mx-auto max-w-2xl text-base md:text-xl text-muted-foreground leading-relaxed">
            Seven mobile-first popup patterns with swipe-to-dismiss, responsive layouts, and UX best practices.
          </p>
        </header>

        {/* Behavior-based Popups */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Behavior Patterns
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {behaviorPopups.map((popup) => (
              <button
                key={popup.id}
                onClick={() => setActivePopup(popup.id)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl ${popup.color} transition-transform duration-300 group-hover:scale-110`}
                >
                  <popup.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="mb-2 text-lg md:text-xl font-semibold text-card-foreground">{popup.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{popup.description}</p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground/70 w-14">Mobile:</span>
                    <span className="text-muted-foreground">{popup.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground/70 w-14">Desktop:</span>
                    <span className="text-muted-foreground">{popup.desktop}</span>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                  Preview popup
                  <svg
                    className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Image Layout Popups */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Image Layouts
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {imageLayoutPopups.map((popup) => (
              <button
                key={popup.id}
                onClick={() => setActivePopup(popup.id)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6 text-left transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl ${popup.color} transition-transform duration-300 group-hover:scale-110`}
                >
                  <popup.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">{popup.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{popup.description}</p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground/70 w-14">Mobile:</span>
                    <span className="text-muted-foreground">{popup.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-muted-foreground/70 w-14">Desktop:</span>
                    <span className="text-muted-foreground">{popup.desktop}</span>
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                  Preview popup
                  <svg
                    className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 md:p-8">
          <h2 className="mb-4 text-lg md:text-xl font-semibold text-card-foreground">Best Practices Implemented</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-card-foreground mb-2">Mobile UX</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Swipe-to-dismiss with drag handle",
                  "Bottom-anchored for thumb reach",
                  "44px+ touch targets",
                  "Slide-up animation",
                  "Images hidden or compact on mobile",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-card-foreground mb-2">Desktop UX</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Escape key to close",
                  "Click outside to dismiss",
                  "Fade + zoom animation",
                  "Two-column layouts with images",
                  "Hero images for visual impact",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Behavior Popups */}
      <BottomSheetPopup isOpen={activePopup === "bottom-sheet"} onClose={() => setActivePopup(null)} />
      <CenteredModalPopup isOpen={activePopup === "centered"} onClose={() => setActivePopup(null)} />
      <SlidePanelPopup isOpen={activePopup === "slide-panel"} onClose={() => setActivePopup(null)} />
      <ExitIntentPopup isOpen={activePopup === "exit-intent"} onClose={() => setActivePopup(null)} />

      {/* Image Layout Popups */}
      <ImageLeftPopup isOpen={activePopup === "image-left"} onClose={() => setActivePopup(null)} />
      <ImageRightPopup isOpen={activePopup === "image-right"} onClose={() => setActivePopup(null)} />
      <ImageHeroPopup isOpen={activePopup === "image-hero"} onClose={() => setActivePopup(null)} />
    </main>
  )
}
