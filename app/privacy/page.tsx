import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"

export const metadata: Metadata = {
  title: "Privacy Policy | Fádé",
  description: "Privacy policy for Fádé.",
}

export default function PrivacyPage() {
  return (
    <MainLayout>
      <section data-surface="night" className="container mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <span className="eyebrow">Legal</span>
        <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em]">Privacy policy</h1>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Last updated · February 10, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-foreground/90">
          <div>
            <h2 className="font-semibold text-foreground">Information We Collect</h2>
            <p className="mt-2">
              We collect account details, order information, shipping/contact information, and
              technical usage data needed to operate the store.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">How We Use Information</h2>
            <p className="mt-2">
              We use your information to process orders, manage your account, provide support,
              improve services, and send service-related messages.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Data Sharing</h2>
            <p className="mt-2">
              We only share data with payment, delivery, and infrastructure providers required to
              run the platform and fulfill your orders.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Data Retention</h2>
            <p className="mt-2">
              We retain data for as long as needed for order history, legal compliance, fraud
              prevention, and legitimate business operations.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Your Rights</h2>
            <p className="mt-2">
              You can request access, correction, or deletion of your personal data by contacting
              support through the Help page.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
