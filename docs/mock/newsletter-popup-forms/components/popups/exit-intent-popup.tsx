"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Heart, Sparkles, Check } from "lucide-react"

interface ExitIntentPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ExitIntentPopup({ isOpen, onClose }: ExitIntentPopupProps) {
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
    if (diff > 0) {
      setDragY(diff)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (dragY > 100) {
      handleClose()
    } else {
      setDragY(0)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-rose-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragY}px)` }}
        className={`relative w-full md:max-w-2xl transition-transform ${isDragging ? "" : "duration-300"} animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0 md:zoom-in-95`}
      >
        <div className="overflow-hidden rounded-t-[2rem] md:rounded-[2rem] bg-gradient-to-b from-rose-50 to-rose-100 shadow-2xl">
          {/* Floating decorations */}
          <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-rose-200/50 blur-xl" />
          <div className="absolute -right-6 top-24 h-20 w-20 rounded-full bg-pink-200/50 blur-xl" />

          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="h-1.5 w-14 rounded-full bg-rose-300" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 md:right-4 md:top-4 z-10 h-12 w-12 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-rose-200/50 text-rose-500 transition-colors hover:bg-rose-300/50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative p-6 pt-8 md:p-0 md:flex">
            {/* Image column - hidden on mobile, shown on desktop */}
            <div className="hidden md:block md:w-2/5 bg-gradient-to-br from-rose-400 to-pink-500 p-8">
              <div className="h-full flex flex-col items-center justify-center text-rose-50">
                <div className="relative mb-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-rose-50/20 backdrop-blur-sm">
                    <Heart className="h-12 w-12 text-rose-50" />
                  </div>
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-lg">
                    <Sparkles className="h-4 w-4 text-amber-50" />
                  </div>
                </div>
                <p className="text-center font-medium text-rose-100/90 leading-relaxed">
                  Join our community of 25,000+ happy subscribers
                </p>
              </div>
            </div>

            {/* Form column */}
            <div className="md:w-3/5 md:p-8">
              {!isSuccess ? (
                <>
                  {/* Mobile icon - shown only on mobile */}
                  <div className="mx-auto mb-5 flex justify-center md:hidden">
                    <div className="relative">
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-300/50">
                        <Heart className="h-10 w-10 text-rose-50 animate-pulse" />
                      </div>
                      <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 shadow-lg">
                        <Sparkles className="h-3.5 w-3.5 text-amber-50" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-5 md:mb-6 text-center md:text-left">
                    <h2 id="exit-intent-title" className="mb-2 text-xl md:text-2xl font-bold text-rose-900">
                      Wait! Before you go...
                    </h2>
                    <p className="text-sm md:text-base text-rose-700 leading-relaxed">
                      Get weekly doses of joy, creativity tips, and exclusive goodies!
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mb-5 flex flex-wrap justify-center md:justify-start gap-2">
                    {["Free", "Weekly", "Fun"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-rose-200/70 px-3 py-1 text-sm font-medium text-rose-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Type your email here..."
                      required
                      className="w-full rounded-2xl border-2 border-rose-200 bg-rose-50/80 px-4 md:px-5 py-4 text-base text-rose-900 placeholder:text-rose-400 focus:border-rose-400 focus:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-200/50 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 font-bold text-rose-50 shadow-lg shadow-rose-300/50 transition-all hover:shadow-xl hover:shadow-rose-300/60 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-rose-300/50 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-50 border-t-transparent" />
                      ) : (
                        "Yes, Sign Me Up!"
                      )}
                    </button>
                  </form>

                  <p className="mt-4 text-center md:text-left text-xs text-rose-500">
                    Promise: No spam, just good vibes!{" "}
                    <a href="#" className="underline hover:text-rose-700">
                      Privacy
                    </a>
                  </p>
                </>
              ) : (
                <div className="py-6 md:py-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-300/50">
                    <Check className="h-8 w-8 md:h-10 md:w-10 text-emerald-50" />
                  </div>
                  <h2 className="mb-2 text-xl md:text-2xl font-bold text-rose-900">Yay! You're In!</h2>
                  <p className="text-sm md:text-base text-rose-700">Check your inbox for a welcome surprise!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
