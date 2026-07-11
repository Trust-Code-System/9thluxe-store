import Link from "next/link"
import { Sparkles, ArrowRight } from "lucide-react"

/**
 * Fragrance DNA invitation. Intentional CTA only, never an auto-opening modal. Placed low on the
 * page after the customer has had a chance to browse.
 */
export function DnaQuizPromo() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary/60 to-card p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <span className="eyebrow mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Fragrance DNA
          </span>
          <h3 className="font-serif text-xl md:text-2xl">Not sure this is your scent?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Answer a few questions about the notes, intensity, occasions and climate you love. We&apos;ll build your
            Fragrance DNA and match you to bottles (and samples) from our real catalogue.
          </p>
        </div>
        <Link
          href="/find-your-fragrance"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Build your Fragrance DNA <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
