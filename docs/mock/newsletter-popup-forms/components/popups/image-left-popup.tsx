"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, ArrowRight, Check } from "lucide-react"

interface ImageLeftPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ImageLeftPopup({ isOpen, onClose }: ImageLeftPopupProps) {
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
      aria-labelledby="image-left-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-teal-950/70 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${dragY}px)` }}
        className={`relative w-full md:max-w-3xl transition-transform ${isDragging ? "" : "duration-300"} animate-in slide-in-from-bottom duration-300 md:slide-in-from-bottom-0 md:zoom-in-95`}
      >
        <div className="overflow-hidden rounded-t-3xl md:rounded-2xl bg-teal-50 shadow-2xl">
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="h-1.5 w-12 rounded-full bg-teal-300" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 md:right-4 md:top-4 z-10 h-11 w-11 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-teal-900/10 text-teal-700 transition-colors hover:bg-teal-900/20 hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="md:flex md:flex-row">
            {/* Image column - LEFT on desktop, hidden on mobile */}
            <div className="hidden md:block md:w-2/5 relative overflow-hidden">
              <img
                src="/sustainable-nature-plants-eco-friendly-minimal.jpg"
                alt="Sustainable living"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-teal-950/20" />
            </div>

            {/* Content column */}
            <div className="md:w-3/5 p-6 pt-8 md:p-10">
              {!isSuccess ? (
                <>
                  {/* Badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-teal-200 px-3 py-1 text-xs font-semibold text-teal-800">
                      Free Weekly Newsletter
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <h2
                      id="image-left-title"
                      className="mb-3 text-2xl md:text-3xl font-bold tracking-tight text-teal-900"
                    >
                      Sustainable Living Tips
                    </h2>
                    <p className="text-sm md:text-base text-teal-700 leading-relaxed">
                      Join 15,000+ eco-conscious readers. Get practical tips for a more sustainable lifestyle every
                      week.
                    </p>
                  </div>

                  {/* Benefits list */}
                  <ul className="mb-6 space-y-2">
                    {["Zero waste recipes", "Eco product reviews", "DIY projects"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-teal-800">
                        <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-xl border border-teal-200 bg-white px-4 py-4 text-base text-teal-900 placeholder:text-teal-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-4 font-semibold text-teal-50 transition-all hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-50 border-t-transparent" />
                      ) : (
                        <>
                          Subscribe
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="mt-4 text-xs text-teal-600">
                    Unsubscribe anytime.{" "}
                    <a href="#" className="underline hover:text-teal-800">
                      Privacy Policy
                    </a>
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal-200">
                    <Check className="h-8 w-8 text-teal-700" />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-teal-900">Welcome aboard!</h2>
                  <p className="text-teal-700">Check your inbox to confirm your subscription.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
