"use client";

import { Suspense, lazy } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Lazy load to avoid SSR issues with preview components
const RecipeShowcaseGrid = lazy(() =>
  import("~/shared/preview/examples/RecipeShowcaseGrid").then((m) => ({
    default: m.RecipeShowcaseGrid,
  }))
);

// Loading placeholder while components load
const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-pulse text-muted-foreground">
      Loading designs...
    </div>
  </div>
);

export default function DesignsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          {/* Brand gradient: #AEE5AB → #0E7768 */}
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#AEE5AB] to-[#0E7768] bg-clip-text text-transparent">
            Ready-to-Use Popup Designs
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse 75+ professionally designed popups. Pick one, customize your
            colors, and go live in 60 seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              No design skills needed
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Mobile-optimized
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Customizable colors & text
            </span>
          </div>
        </div>
      </section>

      {/* Recipe Grid Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Suspense fallback={<LoadingPlaceholder />}>
            <RecipeShowcaseGrid
              columns={3}
              showFilters={true}
              onRecipeClick={(recipe) => {
                console.log("Recipe clicked:", recipe);
                // TODO: Open full preview modal
              }}
            />
          </Suspense>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-indigo-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to boost your conversions?
          </h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Install Revenue Boost and start using these designs today. Free plan
            available.
          </p>
          <a
            href="https://apps.shopify.com/revenue-boost"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-indigo-50 transition-colors"
          >
            Install Free on Shopify
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}

