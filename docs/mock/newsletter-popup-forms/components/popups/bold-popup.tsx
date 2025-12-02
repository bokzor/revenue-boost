"use client"

import type React from "react"

import { useState } from "react"
import { X, Zap, Send, Check } from "lucide-react"

interface BoldPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function BoldPopup({ isOpen, onClose }: BoldPopupProps) {
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bold-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-orange-950/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="overflow-hidden rounded-3xl bg-orange-500 shadow-2xl shadow-orange-500/30">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-orange-100 transition-colors hover:bg-orange-400 hover:text-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:ring-offset-2 focus:ring-offset-orange-500"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 pt-12 sm:p-8 sm:pt-12">
            {!isSuccess ? (
              <>
                {/* Animated Icon */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-orange-200/30" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                      <Zap className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-8 text-center">
                  <h2
                    id="bold-title"
                    className="mb-3 text-3xl font-black uppercase tracking-tight text-orange-50 sm:text-4xl"
                  >
                    Level Up
                  </h2>
                  <p className="text-lg font-medium text-orange-100">
                    Join 50,000+ creators getting actionable tips every week.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full rounded-2xl border-2 border-orange-300/50 bg-orange-50 px-5 py-4 text-lg font-medium text-orange-900 placeholder:text-orange-400 focus:border-orange-200 focus:outline-none focus:ring-4 focus:ring-orange-200/30 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-900 px-6 py-4 text-lg font-bold uppercase tracking-wide text-orange-50 transition-all hover:bg-orange-950 focus:outline-none focus:ring-4 focus:ring-orange-200/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-orange-50 border-t-transparent" />
                    ) : (
                      <>
                        Subscribe Now
                        <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Social proof */}
                <div className="mt-6 flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-orange-500 bg-orange-200" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-orange-100">Join 50K+ subscribers</span>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
                  <Check className="h-10 w-10 text-orange-500" />
                </div>
                <h2 className="mb-2 text-3xl font-black uppercase text-orange-50">You're In!</h2>
                <p className="text-lg font-medium text-orange-100">Get ready for awesome content.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
