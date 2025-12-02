"use client"

import type React from "react"

import { useState } from "react"
import { X, Mail, ArrowRight, Check } from "lucide-react"

interface MinimalistPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function MinimalistPopup({ isOpen, onClose }: MinimalistPopupProps) {
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
      aria-labelledby="minimalist-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="overflow-hidden rounded-2xl bg-stone-50 shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 pt-12 sm:p-8 sm:pt-12">
            {!isSuccess ? (
              <>
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-900">
                  <Mail className="h-7 w-7 text-stone-50" />
                </div>

                {/* Content */}
                <div className="mb-8 text-center">
                  <h2
                    id="minimalist-title"
                    className="mb-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl"
                  >
                    Stay in the loop
                  </h2>
                  <p className="text-stone-600 leading-relaxed">
                    Get weekly insights on design, development, and creativity delivered straight to your inbox.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-xl border border-stone-200 bg-stone-100 px-4 py-4 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400/20 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-4 font-medium text-stone-50 transition-all hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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

                {/* Footer */}
                <p className="mt-4 text-center text-xs text-stone-400">
                  No spam. Unsubscribe anytime.{" "}
                  <a href="#" className="underline hover:text-stone-600">
                    Privacy Policy
                  </a>
                </p>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="mb-2 text-2xl font-semibold text-stone-900">You're subscribed!</h2>
                <p className="text-stone-600">Check your inbox to confirm your email address.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
