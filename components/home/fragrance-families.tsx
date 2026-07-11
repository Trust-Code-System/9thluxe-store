"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Reveal, Stagger, StaggerItem } from "@/components/motion"

const FAMILIES = [
  {
    key: "CITRUS",
    name: "Citrus",
    mood: "Fresh & energising",
    notes: "Bergamot · lemon · mandarin",
  },
  {
    key: "WOODY",
    name: "Woody",
    mood: "Warm & grounded",
    notes: "Sandalwood · cedar · vetiver",
  },
  {
    key: "FLORAL",
    name: "Floral",
    mood: "Soft & romantic",
    notes: "Rose · jasmine · tuberose",
  },
  {
    key: "ORIENTAL",
    name: "Oriental",
    mood: "Deep & sensual",
    notes: "Amber · oud · incense",
  },
  {
    key: "FRESH",
    name: "Fresh",
    mood: "Clean & airy",
    notes: "Marine · aquatic · green",
  },
  {
    key: "SPICY",
    name: "Spicy",
    mood: "Bold & confident",
    notes: "Pepper · cardamom · cinnamon",
  },
]

/**
 * The Index of Scents: fragrance families as an editorial ledger,
 * not a grid of cards.
 */
export function FragranceFamilies() {
  return (
    <section
      data-surface="night"
      className="grain relative bg-background py-20 text-foreground lg:py-28"
    >
      <div className="container relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <header className="mb-12 lg:mb-16">
            <p className="eyebrow mb-4">Index of scents</p>
            <h2 className="max-w-xl text-balance">
              Every perfume belongs to a <em className="text-accent">family</em>.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Six characters, six moods. Start from the one that feels like
              you, or the one you have never dared to wear.
            </p>
          </header>
        </Reveal>

        <Stagger role="list" className="border-t border-border">
          {FAMILIES.map((family, i) => (
            <StaggerItem key={family.key} role="listitem">
              <Link
                href={`/shop?family=${family.key}`}
                className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-5 border-b border-border py-6 transition-colors duration-300 hover:bg-secondary/40 sm:grid-cols-[3rem_1fr_1fr_auto] sm:gap-x-8 md:py-7"
              >
                <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-2xl font-light transition-all duration-300 group-hover:italic group-hover:text-accent md:text-3xl">
                  {family.name}
                </span>
                <span className="col-start-2 mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:col-start-3 sm:mt-0 sm:text-[11px]">
                  {family.notes}
                  <span className="mt-1 block normal-case tracking-[0.06em] text-muted-foreground/70">
                    {family.mood}
                  </span>
                </span>
                <ArrowUpRight
                  className="h-5 w-5 self-center text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
