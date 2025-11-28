import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Revenue Boost",
  description: "Privacy Policy for Revenue Boost Shopify App",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mb-6 text-sm text-muted-foreground">Last updated: November 2024</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-muted-foreground">
                Revenue Boost ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Shopify application.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Information We Collect</h2>
              <p className="mb-4 text-muted-foreground">When you install and use Revenue Boost, we may collect:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li><strong>Store Information:</strong> Your Shopify store domain, email, and store settings necessary to provide our services.</li>
                <li><strong>Campaign Data:</strong> Popup configurations, targeting rules, and design settings you create.</li>
                <li><strong>Analytics Data:</strong> Popup impressions, clicks, and conversion metrics.</li>
                <li><strong>Visitor Data:</strong> Email addresses collected through your popups (stored in your Shopify store).</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>To provide and maintain our service</li>
                <li>To display popups on your storefront</li>
                <li>To generate analytics and reporting</li>
                <li>To improve our application</li>
                <li>To communicate with you about your account</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Data Storage and Security</h2>
              <p className="text-muted-foreground">
                We use industry-standard security measures to protect your data. Campaign data is stored securely in our database. Customer email addresses collected through popups are stored in your Shopify store, not on our servers.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. GDPR Compliance</h2>
              <p className="text-muted-foreground">
                For users in the European Economic Area, we comply with GDPR requirements. You have the right to access, rectify, or delete your data. Our popups support consent collection features to help you comply with privacy regulations.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Third-Party Services</h2>
              <p className="text-muted-foreground">
                We integrate with Shopify's platform. Your use of Shopify is governed by Shopify's own privacy policy. We may also use analytics services to improve our application.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your data as long as your app remains installed. Upon uninstallation, we delete your campaign data within 30 days unless required by law to retain it longer.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at:{" "}
                <a href="mailto:privacy@revenueboost.app" className="text-primary hover:underline">
                  privacy@revenueboost.app
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

