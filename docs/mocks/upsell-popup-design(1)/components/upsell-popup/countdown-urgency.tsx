"use client"

import { useState, useEffect } from "react"
import type { UpsellPopupProps } from "./types"

interface CountdownUrgencyProps extends UpsellPopupProps {
  expiresInSeconds?: number
}

export function CountdownUrgency({
  product,
  isOpen,
  onClose,
  onAccept,
  onDecline,
  currency = "$",
  expiresInSeconds = 300,
}: CountdownUrgencyProps) {
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(expiresInSeconds)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          onDecline()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, expiresInSeconds, onDecline])

  if (!isOpen) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const discount = Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)

  const urgencyLevel = timeLeft < 60 ? "high" : timeLeft < 180 ? "medium" : "low"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 fade-in duration-300 bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Countdown Header */}
        <div
          className={`p-4 text-center transition-colors ${
            urgencyLevel === "high" ? "bg-destructive" : urgencyLevel === "medium" ? "bg-accent" : "bg-primary"
          }`}
        >
          <p
            className={`text-sm font-medium mb-1 ${
              urgencyLevel === "high" || urgencyLevel === "medium"
                ? "text-accent-foreground"
                : "text-primary-foreground"
            }`}
          >
            ⚡ This offer expires in
          </p>
          <div
            className={`text-3xl md:text-4xl font-bold font-mono ${
              urgencyLevel === "high" || urgencyLevel === "medium"
                ? "text-accent-foreground"
                : "text-primary-foreground"
            } ${urgencyLevel === "high" ? "animate-pulse" : ""}`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/20 hover:bg-card/40 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product */}
        <div className="p-5 md:p-6">
          <div className="flex gap-4 mb-4">
            <div className="w-24 h-24 rounded-lg bg-muted shrink-0 overflow-hidden">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-card-foreground mb-1 text-pretty">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
            </div>
          </div>

          {/* Price with urgency styling */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary mb-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Limited Time Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-card-foreground">
                  {currency}
                  {product.salePrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {currency}
                  {product.originalPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-success text-success-foreground text-sm font-bold">
              -{discount}%
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex items-center gap-2 mb-5 text-sm text-muted-foreground">
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>127 people added this in the last hour</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onAccept(product)}
              className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                urgencyLevel === "high"
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              Claim This Deal Now
            </button>
            <button
              onClick={onDecline}
              className="w-full py-2.5 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
