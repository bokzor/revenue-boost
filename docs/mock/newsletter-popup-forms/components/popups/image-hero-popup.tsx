"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, ArrowRight, Check, Star } from "lucide-react"

interface ImageHeroPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ImageHeroPopup({ isOpen, onClose }: ImageHeroPopupProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setIsLoading(false)
    setIsSuccess(true)
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setEmail("")
      setIsSuccess(false)
      setDragY(0)
    }, 300)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current
    if (diff > 0) setDragY(diff)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (dragY > 100) handleClose()
    else setDragY(0)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-hero-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragY}px)` }}
        className={`relative w-full md:max-w-md transition-transform ${isDragging ? "" : "duration-300"} animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0 md:zoom-in-95`}
      >
        <div className="overflow-hidden rounded-t-3xl md:rounded-2xl bg-slate-50 shadow-2xl max-h-[90vh] md:max-h-none overflow-y-auto">
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 md:hidden sticky top-0 bg-slate-50 z-10">
            <div className="h-1.5 w-12 rounded-full bg-slate-300" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-20 h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-slate-900/30 text-slate-50 transition-colors hover:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-slate-50 focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Hero image - TOP */}
          <div className="relative h-40 md:h-48 overflow-hidden">
            <img
              src="/travel-adventure-mountains-scenic-landscape.jpg"
              alt="Adventure awaits"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

            {/* Overlay content on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-xs font-medium text-slate-200">4.9 from 2,500+ readers</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {!isSuccess ? (
              <>
                {/* Content */}
                <div className="mb-6 text-center">
                  <h2
                    id="image-hero-title"
                    className="mb-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
                  >
                    Wanderlust Weekly
                  </h2>
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                    Hidden gems, travel hacks, and destination guides for the modern explorer.
                  </p>
                </div>

                {/* Features */}
                <div className="mb-6 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Destinations", value: "100+" },
                    { label: "Guides", value: "Weekly" },
                    { label: "Deals", value: "Exclusive" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-100 p-3">
                      <div className="text-lg font-bold text-slate-900">{item.value}</div>
                      <div className="text-xs text-slate-500">{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 font-semibold text-slate-50 transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-50 border-t-transparent" />
                    ) : (
                      <>
                        Start Exploring
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-slate-500">
                  No spam. Just adventures.{" "}
                  <a href="#" className="underline hover:text-slate-700">
                    Privacy Policy
                  </a>
                </p>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">Adventure awaits!</h2>
                <p className="text-slate-600">Check your inbox for your first destination guide.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
