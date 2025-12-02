"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Mail, ArrowRight, Check } from "lucide-react"

interface BottomSheetPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function BottomSheetPopup({ isOpen, onClose }: BottomSheetPopupProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

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
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragY}px)` }}
        className={`relative w-full md:max-w-md transition-transform ${isDragging ? "" : "duration-300"} animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0 md:zoom-in-95`}
      >
        <div className="overflow-hidden rounded-t-3xl md:rounded-2xl bg-stone-50 shadow-2xl">
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-stone-300" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 md:top-4 z-10 h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 pt-8 md:pt-12 pb-8 md:p-8">
            {!isSuccess ? (
              <>
                {/* Icon */}
                <div className="mx-auto mb-5 md:mb-6 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-stone-900">
                  <Mail className="h-6 w-6 md:h-7 md:w-7 text-stone-50" />
                </div>

                {/* Content */}
                <div className="mb-6 md:mb-8 text-center">
                  <h2
                    id="bottom-sheet-title"
                    className="mb-2 text-xl md:text-2xl font-semibold tracking-tight text-stone-900"
                  >
                    Stay in the loop
                  </h2>
                  <p className="text-sm md:text-base text-stone-600 leading-relaxed">
                    Get weekly insights on design and development delivered to your inbox.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-4 text-base text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400/20 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 font-medium text-stone-50 transition-all hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-50 border-t-transparent" />
                    ) : (
                      <>
                        Subscribe
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-stone-400">
                  No spam. Unsubscribe anytime.{" "}
                  <a href="#" className="underline hover:text-stone-600">
                    Privacy Policy
                  </a>
                </p>
              </>
            ) : (
              <div className="py-6 md:py-8 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-7 w-7 md:h-8 md:w-8 text-emerald-600" />
                </div>
                <h2 className="mb-2 text-xl md:text-2xl font-semibold text-stone-900">You're subscribed!</h2>
                <p className="text-sm md:text-base text-stone-600">Check your inbox to confirm.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
