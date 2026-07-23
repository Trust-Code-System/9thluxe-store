import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ApprovedFusionHeroFragrance } from "@/lib/hero/fusion-config"
import { CinematicHeroScene } from "./cinematic-hero-scene"
import { FusionHeroSequence } from "./fusion-hero-sequence"
import { PermanentDropScene } from "./permanent-drop-scene"

const FAMILIES = ["Citrus", "Woody", "Floral", "Amber", "Fresh", "Spicy"]
const CTA =
  "inline-flex h-13 items-center justify-center gap-2 rounded-none px-8 font-mono text-[12px] uppercase tracking-[0.2em] transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function PermanentHeroSection({
  cinematic = false,
  fusion = null,
}: {
  cinematic?: boolean
  fusion?: ApprovedFusionHeroFragrance | null
}) {
  return (
    <section
      data-surface="night"
      className="permanent-hero veil grain relative flex flex-col overflow-hidden bg-background text-foreground"
    >
      <div className="permanent-hero-stage container relative z-10 mx-auto flex items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-9 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
          <div className="order-2 max-w-xl lg:order-1">
            <p className="eyebrow mb-5 lg:mb-6">FÁDÉ · Lagos · Curated Perfumery</p>
            <h1 className="text-balance">
              Worn close,
              <br />
              <em className="text-accent">remembered</em> long.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground md:mt-6 md:text-lg">
              Two icons, revealed through the notes that shape them. Bright fruit
              meets smoky woods in a permanent scent composition made for the FÁDÉ
              world.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-9">
              <Link
                href="/shop"
                className={cn(CTA, "bg-primary text-primary-foreground hover:bg-primary/90")}
              >
                Shop the collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/find-your-fragrance"
                className={cn(
                  CTA,
                  "border border-border bg-transparent hover:border-accent hover:text-accent",
                )}
              >
                Find your fragrance
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            {fusion ? (
              <FusionHeroSequence fragrance={fusion} />
            ) : cinematic ? (
              <div className="cinematic-hero-presentation relative mx-auto h-[430px] w-full max-w-[610px] sm:h-[520px]">
                <CinematicHeroScene />
                <PermanentDropScene priority={false} />
                <p className="cinematic-reduced-brand" aria-hidden="true">FÁDÉ</p>
              </div>
            ) : (
              <PermanentDropScene />
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 shrink-0 border-t border-border/60">
        <div className="flex overflow-hidden py-3.5 lg:py-4" aria-hidden>
          <div className="animate-sillage-marquee flex shrink-0 items-center">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {FAMILIES.map((family) => (
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
        <p className="sr-only">Fragrance families: {FAMILIES.join(", ")}</p>
      </div>
    </section>
  )
}
