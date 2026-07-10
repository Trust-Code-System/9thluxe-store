import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-espresso">
      {/* Atelier environment image */}
      <div className="absolute inset-0">
        <Image
          src="/luxury-perfume-bottles.png"
          alt="A perfume bottle resting on a walnut pedestal in warm amber light"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-90"
        />
        {/* Espresso wash for legibility, warmer on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/95 via-espresso/80 to-espresso/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-transparent to-espresso/30" />
      </div>

      {/* Warm amber ambient glow */}
      <div className="amber-glow pointer-events-none absolute right-[8%] top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full blur-2xl" aria-hidden />

      {/* Slow-floating scent particles (decorative, reduced-motion safe) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <span className="animate-atelier-float absolute left-[18%] top-[30%] h-1.5 w-1.5 rounded-full bg-[color:var(--amber)]/50" />
        <span className="animate-atelier-float absolute left-[42%] top-[58%] h-1 w-1 rounded-full bg-[color:var(--amber)]/40 [animation-delay:1.5s]" />
        <span className="animate-atelier-float absolute left-[68%] top-[24%] h-1 w-1 rounded-full bg-[color:var(--amber)]/40 [animation-delay:3s]" />
        <span className="animate-atelier-float absolute left-[80%] top-[64%] h-1.5 w-1.5 rounded-full bg-[color:var(--amber)]/30 [animation-delay:2.2s]" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-[color:#f4efe7]">
          <span className="eyebrow text-[color:var(--amber)]">The Olfactory Atelier · Lagos</span>

          <h1 className="mt-5 font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl lg:text-7xl">
            Fragrance,
            <br />
            <span className="italic text-[color:var(--amber)]">composed</span> for you.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:#e6ddcd]/90 md:text-xl">
            A curated house of rare and coveted perfumes. Discover a signature
            that lingers — guided by scent, not noise.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-13 bg-[color:var(--amber)] px-8 text-base text-[#1b140f] hover:bg-[color:var(--amber)]/90"
            >
              <Link href="/find-your-fragrance">
                Find Your Scent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 border-[#e6ddcd]/30 bg-transparent px-8 text-base text-[#f4efe7] hover:bg-[#f4efe7]/10 hover:text-[#f4efe7]"
            >
              <Link href="/shop">Shop Perfumes</Link>
            </Button>
          </div>

          {/* Quick access to search / concierge */}
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2.5 text-sm text-[#e6ddcd]/75 transition-colors hover:text-[color:var(--amber)]"
          >
            <Search className="h-4 w-4" />
            <span>Try “a warm oud for Lagos evenings”</span>
          </Link>
        </div>
      </div>

      {/* Subtle scroll cue */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[#e6ddcd]/50 md:flex" aria-hidden>
        <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-[color:var(--amber)]/60 to-transparent" />
      </div>
    </section>
  )
}
