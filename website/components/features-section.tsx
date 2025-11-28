import { Card, CardContent } from "@/components/ui/card"
import { Mail, Gift, Timer, Ticket, LogOut, ShoppingCart, Users, Clock, Truck, Package, Megaphone } from "lucide-react"

const features = [
  {
    icon: Mail,
    title: "Newsletter Signup",
    description: "Elegant email collection forms with customizable backgrounds and incentives.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Gift,
    title: "Spin-to-Win",
    description: "Gamified wheel of fortune to capture emails with exciting rewards and discounts.",
    color: "from-primary to-accent",
  },
  {
    icon: Timer,
    title: "Flash Sale",
    description: "Create urgency with countdown timer popups for limited-time offers.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Ticket,
    title: "Scratch Card",
    description: "Interactive scratch-to-reveal experience for engaging discount discovery.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: LogOut,
    title: "Exit Intent",
    description: "Capture leaving visitors with perfectly timed offers before they go.",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: ShoppingCart,
    title: "Cart Abandonment",
    description: "Recover abandoned carts with smart reminders and exclusive offers.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Social Proof",
    description: "Real-time purchase notifications, visitor counts, and trending products.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Clock,
    title: "Countdown Timer",
    description: "Create urgency with customizable countdown timers for any campaign.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Truck,
    title: "Free Shipping Bar",
    description: "Motivate customers to reach free shipping thresholds with progress bars.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Package,
    title: "Product Upsell",
    description: "Smart product recommendations to increase average order value.",
    color: "from-amber-500 to-yellow-500",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    description: "Announce sales, new products, or important updates with banner popups.",
    color: "from-indigo-500 to-violet-500",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">11+ Powerful Popup Types</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to capture leads, create urgency, and boost conversions — all in one app.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
