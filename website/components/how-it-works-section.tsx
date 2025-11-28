import { Download, Palette, TrendingUp } from "lucide-react"

const steps = [
  {
    icon: Download,
    step: "1",
    title: "Install the App",
    description: "One-click installation directly from the Shopify App Store. No coding required.",
  },
  {
    icon: Palette,
    step: "2",
    title: "Choose a Template",
    description: "Pick from 11+ ready-to-use templates. Customize colors, text, and timing in minutes.",
  },
  {
    icon: TrendingUp,
    step: "3",
    title: "Watch Conversions Grow",
    description: "Go live instantly and track your results with built-in analytics dashboard.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Get Started in 3 Simple Steps</h2>
          <p className="text-lg text-muted-foreground">
            No technical skills needed. Launch your first campaign in under 5 minutes.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary via-accent to-primary/20 md:block" />

          <div className="grid gap-12 md:gap-0">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative flex items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <h3 className="mb-2 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                </div>

                <div className="hidden flex-1 md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
