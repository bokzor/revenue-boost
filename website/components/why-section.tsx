import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  Target, 
  Ticket, 
  BarChart3, 
  Clock, 
  Palette,
  Shield,
  Layers
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Under 25KB gzipped. Loads async, zero impact on your page speed or Core Web Vitals.",
    stat: "<25KB",
  },
  {
    icon: Layers,
    title: "Works With All Themes",
    description: "Shadow DOM isolation means zero CSS conflicts. Works perfectly with any Shopify theme.",
    stat: "100%",
  },
  {
    icon: Target,
    title: "Smart Targeting",
    description: "Target by device, location, customer segment, new vs returning, cart value, and more.",
    stat: "10+",
  },
  {
    icon: Clock,
    title: "Intelligent Triggers",
    description: "Exit intent, scroll depth, time on page, cart value threshold—show popups at the perfect moment.",
    stat: "5",
  },
  {
    icon: Ticket,
    title: "Auto Discount Codes",
    description: "Generate unique codes automatically. Auto-apply to cart. Set expiry and usage limits.",
    stat: "∞",
  },
  {
    icon: BarChart3,
    title: "Revenue Attribution",
    description: "See exactly how much money each popup generates. Track real ROI, not just conversions.",
    stat: "$",
  },
  {
    icon: Palette,
    title: "A/B Testing Built-In",
    description: "Test up to 4 variants. Statistical significance. Know what actually works.",
    stat: "4x",
  },
  {
    icon: Shield,
    title: "No Setup Required",
    description: "Works with Klaviyo, Mailchimp, Omnisend—uses Shopify's native customer system. Zero API keys.",
    stat: "0",
  },
]

export function WhySection() {
  return (
    <section className="px-4 py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4 gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Built Different
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Why Revenue Boost?
          </h2>
          <p className="text-lg text-muted-foreground">
            Enterprise-level features at a fraction of the price. No coding required.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#AEE5AB] to-[#0E7768]">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-primary/80">{feature.stat}</span>
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

