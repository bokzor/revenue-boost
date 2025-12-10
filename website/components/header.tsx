"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.webp"
            alt="Revenue Boost"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <span className="text-xl font-bold text-foreground">Revenue Boost</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/designs"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Designs
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Button size="sm" asChild>
            <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
              Install on Shopify
            </a>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <Link
              href="/designs"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              Designs
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground" onClick={() => setIsOpen(false)}>
              FAQ
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Button size="sm" asChild>
                <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
                  Install on Shopify
                </a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
