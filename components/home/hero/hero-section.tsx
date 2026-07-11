import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { HeroData } from "@/lib/hero/types"
import { HeroStage } from "./hero-stage"
import { HeroPlaceholderStage } from "./hero-placeholder-stage"
import { HeroSceneMount } from "./hero-scene-mount"
import { NoteArrangement } from "./note-arrangement"

const FAMILY_TICKER = ["Citrus", "Woody", "Floral", "Oriental", "Fresh", "Spicy"]

const CTA_BASE =
  "inline-flex h-13 items-center justify-center gap-2 rounded-none px-8 font-mono text-[12px] uppercase tracking-[0.2em] transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/**
 * Homepage hero. Presents a real, merchant-approved published fragrance on a wet-stone pedestal, or a
 * polished neutral placeholder when nothing is approved for the homepage. The copy, product image and
 * calls to action are fully server-rendered; only the decorative ingredient descent is a client
 * island, code-split and skipped under reduced motion.
 */
export function HeroSection({ heroData }: { heroData: HeroData | null }) {
  const product = heroData?.product ?? null

  return (
    <section
      data-surface="night"
      className="veil grain relative flex min-h-[92svh] flex-col overflow-hidden bg-background text-foreground"
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

      <div className="container relative z-10 mx-auto flex flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Copy */}
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

            {product ? (
              <div className="mt-8">
                <p className="font-serif text-xl text-foreground">
                  {product.name}
                  {product.availability === "coming_soon" && (
                    <span className="ml-3 align-middle font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                      Coming soon
                    </span>
                  )}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                  {[product.brand, product.concentration, "Curated by Fádé"]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {heroData && <NoteArrangement arrangement={heroData.arrangement} />}
              </div>
            ) : null}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {product ? (
                <>
                  <Link
                    href={`/product/${product.slug}`}
                    className={cn(CTA_BASE, "bg-primary text-primary-foreground hover:bg-primary/90")}
                  >
                    Explore the scent
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/shop"
                    className={cn(
                      CTA_BASE,
                      "border border-border bg-transparent hover:border-accent hover:text-accent",
                    )}
                  >
                    Shop the collection
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Stage */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="relative z-10">
                {product ? <HeroStage product={product} /> : <HeroPlaceholderStage />}
              </div>
              {/* Decorative ingredient descent (client island, code-split, reduced-motion aware) */}
              {heroData && heroData.ingredients.length > 0 && (
                <HeroSceneMount
                  ingredients={heroData.ingredients}
                  motion={heroData.motion}
                />
              )}
            </div>
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
