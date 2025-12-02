"use client"

import type React from "react"

import { useState } from "react"
import { X, Check } from "lucide-react"

interface ElegantPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ElegantPopup({ isOpen, onClose }: ElegantPopupProps) {
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
      aria-labelledby="elegant-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-amber-950/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="overflow-hidden rounded-xl bg-amber-50 shadow-2xl">
          {/* Decorative top border */}
          <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-6 z-10 rounded-full p-2 text-amber-700/50 transition-colors hover:bg-amber-100 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="p-6 pt-10 sm:p-10">
            {!isSuccess ? (
              <>
                {/* Ornamental divider */}
                <div className="mx-auto mb-6 flex items-center justify-center gap-3">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
                  <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
                </div>

                {/* Content */}
                <div className="mb-8 text-center">
                  <h2
                    id="elegant-title"
                    className="mb-3 font-serif text-3xl font-medium tracking-tight text-amber-900 sm:text-4xl"
                  >
                    The Curated Edit
                  </h2>
                  <p className="font-light text-amber-800/80 leading-relaxed">
                    A refined selection of inspiration, insights, and exclusive access to our latest collections.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <label
                      htmlFor="elegant-email"
                      className="mb-2 block text-xs font-medium uppercase tracking-widest text-amber-700"
                    >
                      Email Address
                    </label>
                    <input
                      id="elegant-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border-b-2 border-amber-300 bg-transparent px-0 py-3 text-amber-900 placeholder:text-amber-400 focus:border-amber-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group mt-6 flex w-full items-center justify-center gap-2 border-2 border-amber-800 bg-amber-800 px-6 py-4 font-medium uppercase tracking-widest text-amber-50 transition-all hover:bg-transparent hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      "Join the List"
                    )}
                  </button>
                </form>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-amber-600">
                  By subscribing, you agree to our{" "}
                  <a href="#" className="underline hover:text-amber-800">
                    Privacy Policy
                  </a>{" "}
                  and consent to receive updates.
                </p>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-6 flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-400" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-600">
                    <Check className="h-7 w-7 text-amber-600" />
                  </div>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-400" />
                </div>
                <h2 className="mb-2 font-serif text-3xl font-medium text-amber-900">Welcome</h2>
                <p className="font-light text-amber-700">Your subscription has been confirmed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
