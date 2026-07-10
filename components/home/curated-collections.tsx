import Image from 'next/image'
import type { Collection } from '@/components/home/types'
import { ProductCard } from '@/components/ProductCard'

type CuratedCollectionsProps = {
  collections: Collection[]
}

export function CuratedCollections({ collections }: CuratedCollectionsProps) {
  return (
    <>
      {collections.map((collection) => {
        const highlight = collection.products[0]
        const gridProducts = highlight ? collection.products.slice(1) : collection.products
        const heroImage =
          highlight && Array.isArray(highlight.images) && typeof highlight.images[0] === 'string'
            ? (highlight.images[0] as string)
            : '/placeholder.png'

        return (
          <section key={collection.id} className="py-16">
            <div className="container mx-auto max-w-[1200px] px-6">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.5em] text-muted-foreground">{collection.title}</p>
                  <h2 className="text-3xl font-semibold text-foreground font-serif">{collection.title}</h2>
                  <p className="text-sm text-muted-foreground">{collection.description}</p>
                </div>
                <div className="rounded-full border border-muted-foreground/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground transition hover:border-white hover:text-white">
                  View Collection
                </div>
              </div>
              <div className="grid gap-10 lg:grid-cols-[0.95fr,1.05fr]">
                <div
                  className={`glass-panel relative group rounded-[36px] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] bg-gradient-to-b ${collection.accent}`}
                >
                  {highlight && (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                      <Image src={heroImage} alt={highlight.name} fill className="h-full w-full object-cover opacity-30" sizes="(max-width: 768px) 100vw, 40vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    </div>
                  )}
                  <div className="flex h-full flex-col gap-4 text-white">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-white/70">
                      {collection.title}
                    </p>
                    <h3 className="text-3xl font-serif font-semibold">{highlight ? highlight.name : 'New arrivals'}</h3>
                    <p className="max-w-sm text-sm text-white/70">{collection.description}</p>
                    <div className="mt-auto flex flex-wrap gap-3 text-xs uppercase tracking-[0.4em] text-white">
                      <span>{collection.products.length} pieces</span>
                      <span className="hidden lg:inline">Hand-finished</span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {gridProducts.length === 0 ? (
                    <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                      <h3 className="text-lg font-semibold text-foreground">Curating now</h3>
                      <p className="mt-2 text-sm text-muted-foreground">We are selecting the perfect pieces for the next drop.</p>
                    </div>
                  ) : (
                    gridProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
