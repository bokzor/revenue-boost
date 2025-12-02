"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Check } from "lucide-react"

interface SlidePanelPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function SlidePanelPopup({ isOpen, onClose }: SlidePanelPopupProps) {
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
    if (dragY > 80) {
      handleClose()
    } else {
      setDragY(0)
    }
  }

  if (!isOpen) return null

  const backdropOpacity = Math.max(0.3, 0.7 - dragY / 400)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slide-panel-title"
    >
      {/* Backdrop with dynamic opacity */}
      <div
        className="absolute inset-0 backdrop-blur-sm animate-in fade-in duration-300"
        style={{ backgroundColor: `rgba(120, 53, 15, ${backdropOpacity})` }}
        onClick={handleClose}
      />

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragY}px)`, opacity: 1 - dragY / 400 }}
        className={`relative w-full h-[85vh] md:h-auto md:max-w-md transition-all ${isDragging ? "" : "duration-300"} animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0 md:zoom-in-95`}
      >
        <div className="h-full md:h-auto overflow-hidden rounded-t-3xl md:rounded-xl bg-amber-50 shadow-2xl flex flex-col">
          <div className="flex justify-center pt-4 pb-2 md:hidden shrink-0">
            <div className="h-1.5 w-16 rounded-full bg-amber-300" />
          </div>

          {/* Decorative top border */}
          <div className="h-1 md:h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shrink-0" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-8 md:top-4 z-10 h-12 w-12 md:h-10 md:w-10 flex items-center justify-center rounded-full text-amber-700/50 transition-colors hover:bg-amber-100 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex-1 overflow-auto p-6 pt-6 md:pt-8 md:p-10">
            {!isSuccess ? (
              <>
                {/* Ornamental divider */}
                <div className="mx-auto mb-6 flex items-center justify-center gap-3">
                  <div className="h-px w-10 md:w-12 bg-gradient-to-r from-transparent to-amber-400" />
                  <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <div className="h-px w-10 md:w-12 bg-gradient-to-l from-transparent to-amber-400" />
                </div>

                {/* Content - responsive sizing */}
                <div className="mb-8 text-center">
                  <h2
                    id="slide-panel-title"
                    className="mb-3 font-serif text-2xl md:text-3xl font-medium tracking-tight text-amber-900"
                  >
                    The Curated Edit
                  </h2>
                  <p className="text-sm md:text-base font-light text-amber-800/80 leading-relaxed max-w-sm mx-auto">
                    A refined selection of inspiration, insights, and exclusive access to our latest collections.
                  </p>
                </div>

                <div className="hidden md:block mb-8 mx-auto max-w-xs">
                  <img src="/elegant-luxury-fashion-editorial.jpg" alt="Editorial preview" className="rounded-lg w-full h-auto" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="slide-email"
                      className="mb-2 block text-xs font-medium uppercase tracking-widest text-amber-700"
                    >
                      Email Address
                    </label>
                    <input
                      id="slide-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border-b-2 border-amber-300 bg-transparent px-0 py-3 text-base md:text-lg text-amber-900 placeholder:text-amber-400 focus:border-amber-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group mt-6 flex w-full items-center justify-center gap-2 border-2 border-amber-800 bg-amber-800 px-6 py-4 font-medium uppercase tracking-widest text-amber-50 transition-all hover:bg-transparent hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      "Join the List"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-amber-600">
                  By subscribing, you agree to our{" "}
                  <a href="#" className="underline hover:text-amber-800">
                    Privacy Policy
                  </a>
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
                <h2 className="mb-2 font-serif text-2xl md:text-3xl font-medium text-amber-900">Welcome</h2>
                <p className="text-sm md:text-base font-light text-amber-700">Your subscription has been confirmed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
