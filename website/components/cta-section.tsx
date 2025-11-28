import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Star } from "lucide-react"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5" />
      <div className="absolute -left-20 top-0 -z-10 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 -z-10 h-60 w-60 rounded-full bg-accent/20 blur-3xl" />

      <div className="container mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Ready to Boost Your Revenue?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Join 15,000+ Shopify merchants who are already growing their stores with Revenue Boost.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent px-8 text-lg hover:opacity-90" asChild>
              <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
                Install Free on Shopify
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <span>30-day money back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>4.9/5 on Shopify App Store</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
