"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Reveal } from "@/components/motion"

/**
 * The house manifesto: a typographic story moment on a day surface.
 * No stock photography: the words carry the room.
 */
export function BrandStorySection() {
  return (
    <section data-surface="day" className="bg-background py-20 text-foreground lg:py-32">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow mb-8 text-center">The house</p>
        </Reveal>
        <Reveal delay={0.08}>
          <blockquote className="text-balance text-center font-serif text-3xl font-light leading-[1.2] tracking-[-0.01em] md:text-5xl">
            “A fragrance is the only thing you wear that enters a room{" "}
            <em className="text-accent">before</em> you, and stays{" "}
            <em className="text-accent">after</em> you leave.”
          </blockquote>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mx-auto mt-12 grid max-w-2xl gap-8 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2 md:text-base">
            <p>
              Fádé began in Lagos with a simple discipline: stock only what we
              would wear ourselves, source every bottle from authorised
              channels, and describe each scent honestly: its notes, its
              sillage, how it behaves in our climate.
            </p>
            <p>
              We are not a marketplace. We are a small house with a strong
              nose: a considered edit of perfumes, guidance that listens
              before it recommends, and delivery that treats a bottle like
              the object it is.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.22}>
          <div className="mt-12 flex justify-center">
            <Link
              href="/about"
              className="group flex items-center gap-2 border-b border-border pb-1 font-mono text-[11px] uppercase tracking-[0.24em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Read our story
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
