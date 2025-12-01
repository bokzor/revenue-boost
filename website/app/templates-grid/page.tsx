"use client"

import { Suspense, lazy } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

// Lazy load to avoid SSR issues
const TemplateShowcaseGrid = lazy(() => 
  import("~/shared/preview/examples/TemplateShowcaseGrid").then(m => ({ default: m.TemplateShowcaseGrid }))
)

const TemplateSpotlight = lazy(() => 
  import("~/shared/preview/examples/TemplateShowcaseGrid").then(m => ({ default: m.TemplateSpotlight }))
)

const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-pulse text-muted-foreground">Loading templates...</div>
  </div>
)

export default function TemplatesGridPage() {
  return (
    <main className="min-h-screen">
      <Header />
      
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Template Showcase Grid</h1>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            This page shows the TemplateShowcaseGrid component - a grid layout displaying all 11 template types with interactive previews.
          </p>
          
          <Suspense fallback={<LoadingPlaceholder />}>
            <TemplateShowcaseGrid 
              columns={3}
              device="none"
              showInfo={true}
            />
          </Suspense>
        </div>
      </section>

      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Template Spotlight</h2>
          <p className="text-center text-muted-foreground mb-12">
            Single template spotlight view with device frame
          </p>
          
          <Suspense fallback={<LoadingPlaceholder />}>
            <TemplateSpotlight templateType="SPIN_TO_WIN" device="mobile" />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  )
}

