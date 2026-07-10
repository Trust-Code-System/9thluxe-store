import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"

export const metadata: Metadata = {
  title: "Terms of Service | Fádé",
  description: "Terms of service for Fádé.",
}

export default function TermsPage() {
  return (
    <MainLayout>
      <section className="container mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: February 10, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-foreground/90">
          <div>
            <h2 className="font-semibold text-foreground">Use of the Platform</h2>
            <p className="mt-2">
              By using this website, you agree to comply with applicable laws and not misuse the
              platform, content, or services.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Orders and Payments</h2>
            <p className="mt-2">
              Orders are subject to availability and confirmation. Pricing and payment processing
              are handled at checkout via supported payment providers.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Shipping and Returns</h2>
            <p className="mt-2">
              Shipping timelines and return rules are published in the Help section and may be
              updated from time to time.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Account Responsibility</h2>
            <p className="mt-2">
              You are responsible for maintaining account confidentiality and all activities under
              your login credentials.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Liability and Changes</h2>
            <p className="mt-2">
              We may update these terms as needed. Continued use after updates means you accept the
              revised terms.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
