import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Revenue Boost",
  description: "Terms of Service for Revenue Boost Shopify App",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">Terms of Service</h1>
          <p className="mb-6 text-sm text-muted-foreground">Last updated: November 2024</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By installing or using Revenue Boost ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Revenue Boost is a Shopify application that enables merchants to create and display popups, notifications, and lead capture forms on their storefronts. Features include email capture, gamification popups, social proof notifications, and more.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">3. Account and Billing</h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>You must have an active Shopify store to use the App.</li>
                <li>Billing is handled through Shopify's billing system.</li>
                <li>Subscription fees are billed according to your selected plan.</li>
                <li>You may cancel your subscription at any time through Shopify.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p className="mb-4 text-muted-foreground">You agree not to use the App to:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Violate any applicable laws or regulations</li>
                <li>Send spam or unsolicited communications</li>
                <li>Display misleading or deceptive content</li>
                <li>Interfere with the App's functionality</li>
                <li>Collect data without proper consent</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                The App, including its design, features, and code, is owned by Revenue Boost. You retain ownership of your content and campaign configurations. You grant us a license to use your content solely to provide the service.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground">
                The App is provided "as is" without warranties of any kind. We do not guarantee that the App will be error-free or uninterrupted. Results may vary based on your store, audience, and configuration.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Revenue Boost shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these Terms at any time. Continued use of the App after changes constitutes acceptance of the new terms. We will notify you of significant changes via email or in-app notification.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">9. Contact</h2>
              <p className="text-muted-foreground">
                For questions about these Terms, contact us at:{" "}
                <a href="mailto:legal@revenueboost.app" className="text-primary hover:underline">
                  legal@revenueboost.app
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

