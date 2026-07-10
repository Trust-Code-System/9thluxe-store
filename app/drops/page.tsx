import { prisma } from "@/lib/prisma"
import { mapPrismaProductToCard } from "@/lib/queries/products"
import { ProductCard } from "@/components/ui/product-card"
import { CountdownTimer } from "@/components/drops/countdown-timer"
import { NotifyButton } from "@/components/drops/notify-button"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Limited Drops | Fádé",
  description: "Exclusive limited-edition fragrances. Get notified before they sell out.",
}

export const dynamic = "force-dynamic"

export default async function DropsPage() {
  const now = new Date()

  let upcomingDrops: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  let liveDrops: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  let soldOutDrops: Awaited<ReturnType<typeof prisma.product.findMany>> = []

  try {
    const limited = await prisma.product.findMany({
      where: { isLimited: true, deletedAt: null },
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
    // database unavailable — show empty state
  }

  const hasContent = upcomingDrops.length > 0 || liveDrops.length > 0

  return (
    <section className="py-16">
      <div className="container mx-auto max-w-[1200px] px-6 space-y-16">
        {/* Header */}
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Fádé Exclusive</p>
          <h1 className="text-4xl sm:text-5xl font-semibold">Limited Drops</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Rare and exclusive fragrances, available for a limited time only. Once they&apos;re gone, they&apos;re gone.
          </p>
        </header>

        {/* Empty state */}
        {!hasContent && (
          <div className="text-center py-20 space-y-4">
            <div className="h-20 w-20 rounded-full bg-muted mx-auto flex items-center justify-center text-3xl">
              🕰️
            </div>
            <h2 className="text-xl font-semibold">The next drop is being prepared</h2>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
              Subscribe to our newsletter to be the first to know when exclusive fragrances become available.
            </p>
          </div>
        )}

        {/* Upcoming / Coming Soon */}
        {upcomingDrops.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold border-b border-border pb-4">Coming Soon</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingDrops.map((product) => (
                <div key={product.id} className="border border-border rounded-2xl overflow-hidden bg-card">
                  {/* Image with overlay */}
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {Array.isArray(product.images) && (product.images as string[])[0] ? (
                      <img
                        src={(product.images as string[])[0]}
                        alt={product.name}
                        className="w-full h-full object-cover opacity-50"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-muted" />
                    )}
                    {/* Countdown overlay */}
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">Dropping in</p>
                      <CountdownTimer dropDate={product.dropDate!.toISOString()} />
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge>Limited Edition</Badge>
                      {product.brand && (
                        <span className="text-xs text-muted-foreground">{product.brand}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg leading-snug">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    <NotifyButton productSlug={product.slug} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Drops */}
        {liveDrops.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <h2 className="text-2xl font-semibold">Available Now</h2>
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {liveDrops.map((product) => (
                <ProductCard key={product.id} product={mapPrismaProductToCard(product)} />
              ))}
            </div>
          </div>
        )}

        {/* Sold Out */}
        {soldOutDrops.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold border-b border-border pb-4 text-muted-foreground">
              Past Drops — Sold Out
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {soldOutDrops.map((product) => (
                <div key={product.id} className="relative opacity-60">
                  <ProductCard product={mapPrismaProductToCard(product)} />
                  <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                    <Badge variant="secondary" className="text-xs">
                      Sold Out
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
