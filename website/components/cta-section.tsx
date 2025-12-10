import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, ShieldCheck, Star, Clock } from "lucide-react"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      {/* Brand gradient background: #AEE5AB → #0E7768 */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#AEE5AB]/15 via-[#5AB990]/10 to-[#0E7768]/15" />
      <div className="absolute -left-20 top-0 -z-10 h-60 w-60 rounded-full bg-[#AEE5AB]/25 blur-3xl" />
      <div className="absolute -right-20 bottom-0 -z-10 h-60 w-60 rounded-full bg-[#0E7768]/25 blur-3xl" />

      <div className="container mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Pick a Design. Go Live in 60 Seconds.
          </h2>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            75+ expert-designed popups ready to use. No design skills needed.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8 text-lg" asChild>
              <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
                Install Free on Shopify
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/designs">
                Browse Designs
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Go live in 60 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>Free plan available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>4.9/5 on Shopify</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
