import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"
import { ConciergeClient } from "@/components/concierge/concierge-client"

export const metadata: Metadata = {
  title: "AI Scent Concierge",
  description:
    "Describe the mood, occasion and notes you love — the Fàdè Scent Concierge recommends real, in-stock fragrances from our catalogue.",
}

export default function ConciergePage() {
  return (
    <MainLayout>
      <section className="border-b border-border bg-secondary/40 paper-texture">
        <div className="container mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <span className="eyebrow">Guided by scent</span>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            The Scent Concierge
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
            A conversation, not a catalogue. Tell us what you’re drawn to and we’ll compose a
            shortlist of fragrances we genuinely stock.
          </p>
        </div>
      </section>

      <section className="py-8 lg:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ConciergeClient />
        </div>
      </section>
    </MainLayout>
  )
}
