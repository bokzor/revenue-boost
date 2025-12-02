"use client"

import type React from "react"

import { useState } from "react"
import { X, Heart, Sparkles, Check } from "lucide-react"

interface PlayfulPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function PlayfulPopup({ isOpen, onClose }: PlayfulPopupProps) {
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
      aria-labelledby="playful-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-rose-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-rose-50 to-rose-100 shadow-2xl">
          {/* Floating decorations */}
          <div className="absolute -left-4 top-8 h-16 w-16 rounded-full bg-rose-200/50 blur-xl" />
          <div className="absolute -right-6 top-24 h-20 w-20 rounded-full bg-pink-200/50 blur-xl" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-rose-200/50 p-2 text-rose-500 transition-colors hover:bg-rose-300/50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative p-6 pt-10 sm:p-8">
            {!isSuccess ? (
              <>
                {/* Animated illustration */}
                <div className="mx-auto mb-6 flex justify-center">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-300/50">
                      <Heart className="h-12 w-12 text-rose-50 animate-pulse" />
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-lg">
                      <Sparkles className="h-4 w-4 text-amber-50" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6 text-center">
                  <h2 id="playful-title" className="mb-2 text-2xl font-bold text-rose-900 sm:text-3xl">
                    You're Gonna Love This! ✨
                  </h2>
                  <p className="text-rose-700 leading-relaxed">
                    Get weekly doses of joy, creativity tips, and exclusive goodies!
                  </p>
                </div>

                {/* Features */}
                <div className="mb-6 flex justify-center gap-4">
                  {["Free", "Weekly", "Fun"].map((tag) => (
                    <span key={tag} className="rounded-full bg-rose-200/70 px-3 py-1 text-sm font-medium text-rose-700">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Type your email here..."
                      required
                      className="w-full rounded-2xl border-2 border-rose-200 bg-rose-50/80 px-5 py-4 text-rose-900 placeholder:text-rose-400 focus:border-rose-400 focus:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-200/50 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 font-bold text-rose-50 shadow-lg shadow-rose-300/50 transition-all hover:shadow-xl hover:shadow-rose-300/60 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-rose-300/50 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-50 border-t-transparent" />
                    ) : (
                      <>
                        Yes, Sign Me Up!
                        <span className="text-lg">💌</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <p className="mt-4 text-center text-xs text-rose-500">
                  Promise: No spam, just good vibes!{" "}
                  <a href="#" className="underline hover:text-rose-700">
                    Privacy
                  </a>
                </p>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-300/50">
                  <Check className="h-10 w-10 text-emerald-50" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-rose-900">Yay! You're In! 🎉</h2>
                <p className="text-rose-700">Check your inbox for a welcome surprise!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
