import { MousePointerClick, Paintbrush, Rocket } from "lucide-react"

const steps = [
  {
    icon: MousePointerClick,
    step: "1",
    title: "Pick a Design",
    description: "Browse 40+ ready-to-use popup designs. Find one that matches your brand in seconds.",
  },
  {
    icon: Paintbrush,
    step: "2",
    title: "Add Your Brand",
    description: "Customize colors, text, and images. Your popup, your style — no design skills needed.",
  },
  {
    icon: Rocket,
    step: "3",
    title: "Go Live",
    description: "One click to publish. Watch your conversions grow with built-in analytics.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 md:py-32">
      <div className="container mx-auto">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Launch in 60 Seconds</h2>
          <p className="text-lg text-muted-foreground">
            No coding. No design skills. Just pick, customize, and go live.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connection line - brand gradient */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-[#AEE5AB] via-[#5AB990] to-[#0E7768] md:block" />

          <div className="grid gap-16 md:gap-20">
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

                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#AEE5AB] to-[#0E7768] shadow-lg">
                  <step.icon className="h-8 w-8 text-white" />
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
