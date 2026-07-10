import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@prisma/client'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'

type HeroStats = {
  newArrivals: number
  watches: number
  accessories: number
}

type HeroSectionProps = {
  heroHighlight?: Product
  stats: HeroStats
}

export function HeroSection({ heroHighlight, stats }: HeroSectionProps) {
  const imageSrc =
    heroHighlight && Array.isArray(heroHighlight.images) && typeof heroHighlight.images[0] === 'string'
      ? (heroHighlight.images[0] as string)
      : '/placeholder.png'

  return (
    <section className="page-section">
      <div className="absolute inset-0 opacity-30 blur-3xl">
        <div className="absolute -top-16 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-40 w-40 rounded-full bg-emerald-500/30 blur-3xl" />
      </div>
      <div className="relative container mx-auto max-w-[1200px]">
        <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.6em] text-slate-200">Fàdè Essence</p>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Quiet luxury that feels effortless—perfumes, watches, and shades composed for ritual.
            </h1>
            <p className="max-w-2xl text-lg text-slate-200">
              Muted gradients, glassy textures, and serif gestures bring calm luxury to everyday gestures.
              Discover scents, timepieces, and eyewear that feel editorial yet lived-in.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="primary">
                <Link href="/category/perfumes">Shop perfumes</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/collections">View all collections</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-full border border-white/40 bg-white/10 px-4 py-3 text-center text-white/80">
                <strong className="text-lg font-bold">{stats.newArrivals}</strong>
                <span className="text-xs uppercase tracking-[0.3em]">New Arrivals</span>
              </div>
              <div className="flex flex-col gap-1 rounded-full border border-white/40 bg-white/10 px-4 py-3 text-center text-white/80">
                <strong className="text-lg font-bold">{stats.watches}</strong>
                <span className="text-xs uppercase tracking-[0.3em]">Horlogerie</span>
              </div>
              <div className="flex flex-col gap-1 rounded-full border border-white/40 bg-white/10 px-4 py-3 text-center text-white/80">
                <strong className="text-lg font-bold">{stats.accessories}</strong>
                <span className="text-xs uppercase tracking-[0.3em]">Essentials</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full overflow-hidden rounded-[32px] border border-white/20 bg-white/5 p-6 shadow-2xl backdrop-blur-[40px] hover:-translate-y-1 transition-transform duration-300">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.5em] text-white/70">Spotlight</div>
              <div className="relative overflow-hidden rounded-[24px] bg-black/20">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={imageSrc}
                    alt={heroHighlight?.name ?? 'Fàdè collection'}
                    fill
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    priority
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.5em] text-white/70">
                    {heroHighlight?.brand ?? 'Fàdè'}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold">{heroHighlight?.name ?? 'Quiet Luxury'}</h3>
                  {heroHighlight && (
                    <p className="mt-2 text-sm text-white/70">{formatPrice(heroHighlight.priceNGN)}</p>
                  )}
                  <Link
                    href={heroHighlight ? `/product/${heroHighlight.slug}` : '/'}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-white transition hover:text-primary"
                  >
                    View details
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
