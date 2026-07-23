import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { ManagedPage } from "@/components/pages/managed-page"
import { getManagedPageMetadata, getPublishedPage } from "@/lib/pages/queries"

export const dynamic = "force-dynamic"

const fallbackMetadata: Metadata = {
  title: "About Fádé",
  description:
    "Fádé is a Lagos house for rare and coveted perfumes, curated with care, described honestly, delivered nationwide.",
}

export function generateMetadata() { return getManagedPageMetadata("about", fallbackMetadata) }

const PRINCIPLES = [
  {
    title: "Sourced deliberately",
    body: "We buy from suppliers we trust and record the provenance of every fragrance. If we can't stand behind a bottle, we don't stock it.",
  },
  {
    title: "Inspected on arrival",
    body: "Each item is checked and sealed before dispatch: a retailer's inspection, honestly described, not a manufacturer's guarantee.",
  },
  {
    title: "Described truthfully",
    body: "Notes, sillage, longevity, how a scent behaves in Nigerian heat. We write what we know and mark what is opinion.",
  },
  {
    title: "Delivered carefully",
    body: "Across all 36 states and the FCT, packed like the object it is. A bottle should arrive the way it left the atelier.",
  },
]

export default async function AboutPage() {
  const managed = await getPublishedPage("about")
  if (managed) return <ManagedPage page={managed} />
  return (
    <MainLayout>
      {/* Manifesto hero */}
      <section data-surface="night" className="veil grain relative bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
          <span className="eyebrow">Our house</span>
          <h1 className="mt-5 text-balance font-serif text-4xl font-light leading-[1.05] tracking-[-0.01em] md:text-6xl">
            A small house with a <em className="text-accent">strong nose</em>.
          </h1>
          <div className="mt-10 space-y-6 text-base leading-[1.85] text-foreground/85 md:text-lg">
            <p>
              Fádé began in Lagos with a simple discipline: stock only what we
              would wear ourselves. We are not a marketplace and we are not
              trying to carry everything. We are a considered edit of luxury
              perfumes, chosen bottle by bottle.
            </p>
            <p>
              Scent is the most intimate thing you wear. It enters a room
              before you and stays after you leave. Choosing one deserves
              honest guidance, real notes and a straight answer about how a
              fragrance behaves in our climate. That is the service we exist
              to give.
            </p>
          </div>
        </div>
      </section>

      {/* Principles ledger */}
      <section data-surface="day" className="bg-background py-16 text-foreground lg:py-24">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <p className="eyebrow mb-10">How we work</p>
          <div className="border-t border-border">
            {PRINCIPLES.map((principle, i) => (
              <div
                key={principle.title}
                className="grid gap-4 border-b border-border py-8 sm:grid-cols-[3rem_1fr]"
              >
                <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-serif text-2xl font-light">{principle.title}</h2>
                  <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/collections"
              className="inline-flex h-13 items-center justify-center gap-2 bg-primary px-8 font-mono text-[12px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Explore the collections
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/help/contact"
              className="inline-flex h-13 items-center justify-center border border-border px-8 font-mono text-[12px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Contact the concierge
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
