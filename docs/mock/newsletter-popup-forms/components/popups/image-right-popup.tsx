"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Send, Check, Sparkles } from "lucide-react"

interface ImageRightPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ImageRightPopup({ isOpen, onClose }: ImageRightPopupProps) {
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
      aria-labelledby="image-right-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-indigo-950/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragY}px)` }}
        className={`relative w-full md:max-w-3xl transition-transform ${isDragging ? "" : "duration-300"} animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0 md:zoom-in-95`}
      >
        <div className="overflow-hidden rounded-t-3xl md:rounded-2xl bg-indigo-50 shadow-2xl">
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-indigo-300" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 md:right-4 md:top-4 z-10 h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-indigo-900/10 text-indigo-600 transition-colors hover:bg-indigo-900/20 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="md:flex md:flex-row">
            {/* Content column - LEFT on desktop */}
            <div className="md:w-3/5 p-6 pt-8 md:p-10">
              {!isSuccess ? (
                <>
                  {/* Icon with sparkle */}
                  <div className="mb-5 inline-flex items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
                      <Sparkles className="h-6 w-6 text-indigo-50" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">New</span>
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <h2
                      id="image-right-title"
                      className="mb-3 text-2xl md:text-3xl font-bold tracking-tight text-indigo-900"
                    >
                      AI & Tech Insights
                    </h2>
                    <p className="text-sm md:text-base text-indigo-700 leading-relaxed">
                      Stay ahead of the curve. Get curated AI news, tutorials, and industry insights delivered weekly.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="mb-6 flex gap-6">
                    <div>
                      <div className="text-2xl font-bold text-indigo-900">50K+</div>
                      <div className="text-xs text-indigo-600">Subscribers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-900">200+</div>
                      <div className="text-xs text-indigo-600">Issues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-900">4.9</div>
                      <div className="text-xs text-indigo-600">Rating</div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-4 text-base text-indigo-900 placeholder:text-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-indigo-50 transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-50 border-t-transparent" />
                      ) : (
                        <>
                          Get Started
                          <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-4 text-xs text-indigo-600">
                    Free forever. No spam.{" "}
                    <a href="#" className="underline hover:text-indigo-800">
                      Privacy Policy
                    </a>
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-200">
                    <Check className="h-8 w-8 text-indigo-700" />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-indigo-900">You're subscribed!</h2>
                  <p className="text-indigo-700">Your first issue is on its way.</p>
                </div>
              )}
            </div>

            {/* Image column - RIGHT on desktop, hidden on mobile */}
            <div className="hidden md:block md:w-2/5 relative overflow-hidden">
              <img
                src="/futuristic-technology-ai-abstract-gradient.jpg"
                alt="AI Technology"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-indigo-950/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
