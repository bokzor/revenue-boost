import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "For new stores getting started",
    features: [
      "10,000 popup views/month",
      "5 active campaigns",
      "500 leads/month",
      "Social proof templates",
      "Scheduled campaigns",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    price: "$29",
    period: "/month",
    description: "For growing stores",
    features: [
      "50,000 popup views/month",
      "15 active campaigns",
      "2,500 leads/month",
      "A/B testing (2 variants)",
      "Advanced targeting",
      "Gamification (Spin-to-Win)",
      "Remove branding",
      "Custom CSS",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    description: "For high-volume stores",
    features: [
      "200,000 popup views/month",
      "Unlimited campaigns",
      "10,000 leads/month",
      "A/B testing (4 variants)",
      "All Growth features",
      "Unlimited experiments",
      "Unlimited custom templates",
      "Priority support",
    ],
    cta: "Start Free Trial",
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
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Need to test first? Start with our{" "}
            <a
              href="https://apps.shopify.com/revenue-boost"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              free plan
            </a>
            {" "}— 3,000 views/month, no credit card.
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
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#AEE5AB] to-[#0E7768] text-white">
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
                  className="w-full"
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
