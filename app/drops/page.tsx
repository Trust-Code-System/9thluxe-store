import Image from "next/image"

import { MainLayout } from "@/components/layout/main-layout"
import { prisma } from "@/lib/prisma"
import { mapPrismaProductToCard } from "@/lib/queries/products"
import { ProductCard } from "@/components/ui/product-card"
import { ProductGrid } from "@/components/ui/product-grid"
import { CountdownTimer } from "@/components/drops/countdown-timer"
import { NotifyButton } from "@/components/drops/notify-button"
import { getActiveCampaign } from "@/lib/campaigns/service"
import Link from "next/link"

export const metadata = {
  title: "Limited Drops | Fádé",
  description:
    "Exclusive limited-edition fragrances. Get notified before they sell out.",
}

export const dynamic = "force-dynamic"

export default async function DropsPage() {
  const now = new Date()
  const campaign = await getActiveCampaign(now)

  const upcomingDrops: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  const liveDrops: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  const soldOutDrops: Awaited<ReturnType<typeof prisma.product.findMany>> = []

  try {
    const limited = await prisma.product.findMany({
      where: {
        isLimited: true,
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
      orderBy: { dropDate: "asc" },
    })

    for (const p of limited) {
      if (p.dropDate && p.dropDate > now) {
        upcomingDrops.push(p)
      } else if (p.stock > 0) {
        liveDrops.push(p)
      } else {
        soldOutDrops.push(p)
      }
    }
  } catch {
    // database unavailable: show empty state
  }

  const hasContent = upcomingDrops.length > 0 || liveDrops.length > 0

  return (
    <MainLayout>
      {campaign && (
        <section className="relative overflow-hidden border-b border-border bg-secondary">
          {campaign.desktopImage && <Image src={campaign.desktopImage} alt="" fill className="object-cover opacity-25" priority />}
          <div className="container relative z-10 mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
            <p className="eyebrow">Current campaign</p>
            <h2 className="mt-3 font-serif text-3xl font-light">{campaign.title}</h2>
            {campaign.description && <p className="mt-2 max-w-xl text-muted-foreground">{campaign.description}</p>}
            {campaign.ctaLabel && campaign.ctaHref && <Link href={campaign.ctaHref} className="mt-5 inline-flex border border-accent px-5 py-2 text-sm text-accent">{campaign.ctaLabel}</Link>}
          </div>
        </section>
      )}
      {/* Night hero */}
      <section data-surface="night" className="veil grain relative bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 pb-14 pt-16 text-center sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <p className="eyebrow">Fádé exclusive</p>
          <h1 className="mx-auto mt-4 max-w-2xl font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
            Limited <em className="text-accent">drops</em>
          </h1>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground">
            Small allocations of rare bottles, released once. When a drop
            sells through, it does not return.
          </p>
        </div>
      </section>

      <section data-surface="night" className="bg-background pb-20 pt-16 text-foreground lg:pb-28 lg:pt-20">
        <div className="container mx-auto max-w-[1200px] space-y-20 px-4 sm:px-6 lg:px-8">
          {/* Empty state */}
          {!hasContent && soldOutDrops.length === 0 && (
            <div className="mx-auto max-w-md border border-dashed border-border px-8 pb-16 pt-20 text-center sm:pt-24">
              <p className="font-serif text-2xl font-light leading-snug">
                The next drop is being prepared
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Join the Sillage letter at the foot of this page. Subscribers
                hear about every drop before it goes live.
              </p>
            </div>
          )}

          {/* Upcoming */}
          {upcomingDrops.length > 0 && (
            <div>
              <header className="mb-10 flex items-baseline justify-between border-b border-border pb-5">
                <h2 className="font-serif text-3xl font-light">Coming soon</h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {upcomingDrops.length} {upcomingDrops.length === 1 ? "drop" : "drops"}
                </span>
              </header>
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingDrops.map((product) => {
                  const images = Array.isArray(product.images)
                    ? (product.images as string[])
                    : []
                  return (
                    <div key={product.id} className="group flex flex-col">
                      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                        <Image
                          src={images[0] || "/placeholder-flacon.svg"}
                          alt={product.name}
                          fill
                          className="object-cover opacity-40"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[color:var(--carbon)]/55">
                          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/80">
                            Dropping in
                          </p>
                          <CountdownTimer dropDate={product.dropDate!.toISOString()} />
                        </div>
                      </div>
                      <div className="mt-3.5 flex flex-1 flex-col gap-2 border-t border-border/70 pt-3.5">
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {product.brand || "Fádé"} · Limited edition
                        </span>
                        <h3 className="font-serif text-lg font-normal leading-snug">
                          {product.name}
                        </h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {product.description}
                        </p>
                        <div className="pt-2">
                          <NotifyButton productSlug={product.slug} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Live */}
          {liveDrops.length > 0 && (
            <div>
              <header className="mb-10 flex items-baseline justify-between border-b border-border pb-5">
                <h2 className="font-serif text-3xl font-light">Available now</h2>
                <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
                  Live
                </span>
              </header>
              <ProductGrid
                products={liveDrops.map(mapPrismaProductToCard)}
                columns={3}
              />
            </div>
          )}

          {/* Sold out */}
          {soldOutDrops.length > 0 && (
            <div>
              <header className="mb-10 flex items-baseline justify-between border-b border-border pb-5">
                <h2 className="font-serif text-3xl font-light text-muted-foreground">
                  Past drops
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Sold out
                </span>
              </header>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
                {soldOutDrops.map((product) => (
                  <div key={product.id} className="relative opacity-50">
                    <ProductCard product={mapPrismaProductToCard(product)} />
                    <span className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground">
                      Sold out
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  )
}
