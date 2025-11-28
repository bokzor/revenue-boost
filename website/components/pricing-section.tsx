import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "Up to 1,000 popup views/month",
      "3 popup templates",
      "Basic analytics",
      "Email support",
      "Mobile responsive",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Growth",
    price: "$19",
    period: "/month",
    description: "For growing stores",
    features: [
      "Up to 25,000 popup views/month",
      "All 11 popup types",
      "A/B testing",
      "Advanced targeting",
      "Auto discount codes",
      "Priority support",
      "Remove branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For high-volume stores",
    features: [
      "Unlimited popup views",
      "All Growth features",
      "Custom CSS",
      "API access",
      "Dedicated account manager",
      "White-label solution",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border/50"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "bg-gradient-to-r from-primary to-accent hover:opacity-90" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
                    {plan.cta}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
