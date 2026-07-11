import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OrbitData } from "@/lib/hero/orbit"
import { OrbitRotator } from "./orbit-rotator"

const FAMILY_TICKER = ["Citrus", "Woody", "Floral", "Oriental", "Fresh", "Spicy"]

const CTA_BASE =
  "inline-flex h-13 items-center justify-center gap-2 rounded-none px-8 font-mono text-[12px] uppercase tracking-[0.2em] transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/**
 * Stage 2 homepage hero: the approved editorial copy on the left (unchanged from Stage 1, fully
 * server-rendered) with the orbital perfume showcase on the right. The rotator is a client island
 * whose first render is deterministic (slide 0), so the front bottle and its product information
 * are part of the SSR HTML; rotation only begins after hydration and never under reduced motion.
 * Rendered only when the `hero_orbit` flag is on AND at least two approved slides resolve;
 * otherwise app/page.tsx keeps the Stage 1 hero.
 */
export function HeroOrbitSection({ orbit }: { orbit: OrbitData }) {
  return (
    <section
      data-surface="night"
      className="veil grain relative flex flex-col overflow-hidden bg-background text-foreground"
    >
      {/* Oversized whisper word behind the stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none overflow-hidden"
      >
        <p className="whitespace-nowrap text-center font-serif italic text-[26vw] font-light leading-none tracking-tight text-foreground/[0.035] lg:text-[19rem]">
          sillage
        </p>
      </div>

      <div className="container relative z-10 mx-auto flex flex-1 items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Copy (static, server-rendered; identical to the approved Stage 1 copy) */}
          <div className="order-2 max-w-xl lg:order-1">
            <p className="eyebrow mb-6">Fádé · Lagos · Curated Perfumery</p>
            <h1 className="text-balance">
              Worn close,
              <br />
              <em className="text-accent">remembered</em> long.
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              A curated house of rare and coveted perfumes. Every bottle sourced
              and inspected, every recommendation guided by scent, delivered
              across Nigeria.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/shop"
                className={cn(CTA_BASE, "bg-primary text-primary-foreground hover:bg-primary/90")}
              >
                Shop the collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/find-your-fragrance"
                className={cn(
                  CTA_BASE,
                  "border border-border bg-transparent hover:border-accent hover:text-accent",
                )}
              >
                Find your fragrance
              </Link>
            </div>
          </div>

          {/* Orbital showcase */}
          <div className="order-1 lg:order-2">
            <OrbitRotator slides={orbit.slides} motion={orbit.motion} />
          </div>
        </div>
      </div>

      {/* Family ticker */}
      <div className="relative z-10 border-t border-border/60">
        <div className="flex overflow-hidden py-4" aria-hidden>
          <div className="animate-sillage-marquee flex shrink-0 items-center">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {FAMILY_TICKER.map((family) => (
                  <span
                    key={`${half}-${family}`}
                    className="mx-8 flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.34em] text-muted-foreground"
                  >
                    {family}
                    <span className="h-1 w-1 rounded-full bg-accent/50" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="sr-only">Fragrance families: {FAMILY_TICKER.join(", ")}</p>
      </div>
    </section>
  )
}
