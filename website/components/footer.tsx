import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card px-4 py-12">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image
                src="/logo.webp"
                alt="Revenue Boost"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <span className="text-xl font-bold text-foreground">Revenue Boost</span>
            </Link>
            <p className="text-sm text-muted-foreground">The #1 popup and notification app for Shopify stores.</p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#features" className="hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#templates" className="hover:text-foreground">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@revenueboost.app" className="hover:text-foreground">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Revenue Boost. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Made for Shopify</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
