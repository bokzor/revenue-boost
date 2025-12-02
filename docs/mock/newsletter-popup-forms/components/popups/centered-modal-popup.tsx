"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Zap, Send, Check } from "lucide-react"

interface CenteredModalPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function CenteredModalPopup({ isOpen, onClose }: CenteredModalPopupProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="centered-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-orange-950/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-[calc(100%-2rem)] md:max-w-lg animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 fade-in duration-300">
        <div className="overflow-hidden rounded-3xl bg-orange-500 shadow-2xl shadow-orange-500/30">
          {/* Close button - larger touch target on mobile */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 md:right-4 md:top-4 z-10 h-12 w-12 md:h-10 md:w-10 flex items-center justify-center rounded-full text-orange-100 transition-colors hover:bg-orange-400 hover:text-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-orange-500"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 pt-14 md:p-8 md:pt-12">
            {!isSuccess ? (
              <>
                <div className="mx-auto mb-5 md:mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center">
                  <div className="relative">
                    <div className="hidden md:block absolute inset-0 animate-ping rounded-full bg-orange-200/30" />
                    <div className="relative flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-orange-50">
                      <Zap className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
                    </div>
                  </div>
                </div>

                {/* Content - responsive text sizes */}
                <div className="mb-6 md:mb-8 text-center">
                  <h2
                    id="centered-modal-title"
                    className="mb-2 md:mb-3 text-2xl md:text-4xl font-black uppercase tracking-tight text-orange-50"
                  >
                    Level Up
                  </h2>
                  <p className="text-base md:text-lg font-medium text-orange-100">
                    Join 50,000+ creators getting actionable tips every week.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full rounded-2xl border-2 border-orange-300/50 bg-orange-50 px-4 md:px-5 py-4 text-base md:text-lg font-medium text-orange-900 placeholder:text-orange-400 focus:border-orange-200 focus:outline-none focus:ring-4 focus:ring-orange-200/30 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-900 px-6 py-4 text-base md:text-lg font-bold uppercase tracking-wide text-orange-50 transition-all hover:bg-orange-950 focus:outline-none focus:ring-4 focus:ring-orange-200/30 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 md:h-6 md:w-6 animate-spin rounded-full border-3 border-orange-50 border-t-transparent" />
                    ) : (
                      <>
                        Subscribe Now
                        <Send className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 md:mt-6 hidden sm:flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-orange-500 bg-orange-200" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-orange-100">Join 50K+ subscribers</span>
                </div>
              </>
            ) : (
              <div className="py-6 md:py-8 text-center">
                <div className="mx-auto mb-5 md:mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-orange-50">
                  <Check className="h-8 w-8 md:h-10 md:w-10 text-orange-500" />
                </div>
                <h2 className="mb-2 text-2xl md:text-3xl font-black uppercase text-orange-50">You're In!</h2>
                <p className="text-base md:text-lg font-medium text-orange-100">Get ready for awesome content.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
