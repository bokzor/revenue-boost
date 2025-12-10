import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Founder, Luxe Boutique",
    content:
      "Revenue Boost increased our email list by 340% in just two months. The spin-to-win popup is our customers' favorite!",
    rating: 5,
    avatar: "SM",
  },
  {
    name: "James Chen",
    role: "Marketing Lead, TechGear Pro",
    content:
      "The social proof notifications are incredible. We saw a 23% increase in conversions within the first week.",
    rating: 5,
    avatar: "JC",
  },
  {
    name: "Emily Rodriguez",
    role: "Owner, Organic Essentials",
    content:
      "Finally, a popup app that's both powerful and easy to use. Setup took 5 minutes and the results speak for themselves.",
    rating: 5,
    avatar: "ER",
  },
  {
    name: "Michael Brooks",
    role: "CEO, Urban Style Co",
    content:
      "The exit intent popup alone recovered $12,000 in potential lost sales last month. Best investment we've made.",
    rating: 5,
    avatar: "MB",
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-gradient-to-b from-background to-secondary/30 px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Loved by 15,000+ Merchants</h2>
          <p className="text-lg text-muted-foreground">See what store owners are saying about Revenue Boost.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-border/50 bg-card">
              <CardContent className="p-6">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#AEE5AB] to-[#0E7768] text-sm font-semibold text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
