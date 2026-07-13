import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MainLayout } from '@/components/layout/main-layout'
import { ProductCard } from '@/components/ui/product-card'
import { mapPrismaProductToCard } from '@/lib/queries/products'
import { ShopFiltersForm } from '@/components/shop/shop-filters-form'
import type { Product } from '@prisma/client'

const CATEGORY_MAP: Record<string, Product['category']> = {
  perfumes: 'PERFUMES',
}

const SORT_MAP: Record<string, { [key: string]: 'asc' | 'desc' }> = {
  price_asc: { priceNGN: 'asc' },
  price_desc: { priceNGN: 'desc' },
  best_selling: { ratingCount: 'desc' },
  newest: { createdAt: 'desc' },
}

type ShopSearchParams = {
  category?: string
  brand?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  note?: string
  notes?: string
  q?: string
  family?: string
  occasion?: string
  intensity?: string
  climate?: string
  timeOfDay?: string
  forWhom?: string
}

export const dynamic = 'force-dynamic'

export default async function ShopPage({ searchParams }: { searchParams?: Promise<ShopSearchParams> }) {
  const params = (await searchParams) || {}
  const where: Record<string, unknown> = {}

  if (params.category) {
    const mapped = CATEGORY_MAP[params.category.toLowerCase()]
    if (mapped) where.category = mapped
  }

  if (params.brand) {
    where.brand = params.brand
  }

  if (params.minPrice) {
    const min = Number(params.minPrice)
    if (!Number.isNaN(min)) {
      where.priceNGN = { ...((where.priceNGN as object) ?? {}), gte: min }
    }
  }

  if (params.maxPrice) {
    const max = Number(params.maxPrice)
    if (!Number.isNaN(max)) {
      where.priceNGN = { ...((where.priceNGN as object) ?? {}), lte: max }
    }
  }

  if (params.family && params.family.trim()) {
    where.fragranceFamily = params.family.trim().toUpperCase()
  }

  const noteTerms = [
    ...new Set([
      ...(params.note ? [params.note.trim()] : []),
      ...(params.notes
        ? params.notes.split(",").map((n) => n.trim()).filter(Boolean)
        : []),
    ]),
  ].filter(Boolean)

  if (noteTerms.length) {
    where.OR = noteTerms.flatMap((term) => [
      { notesTop: { contains: term, mode: 'insensitive' as const } },
      { notesHeart: { contains: term, mode: 'insensitive' as const } },
      { notesBase: { contains: term, mode: 'insensitive' as const } },
    ])
  }

  // Occasion / intensity / climate are captured by the quiz for preference
  // context, but only applied when present on products so sparse catalogue
  // fields do not empty the results.

  if (params.q && params.q.trim()) {
    const q = params.q.trim()
    const qClause = {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { brand: { contains: q, mode: 'insensitive' as const } },
        { notesTop: { contains: q, mode: 'insensitive' as const } },
        { notesHeart: { contains: q, mode: 'insensitive' as const } },
        { notesBase: { contains: q, mode: 'insensitive' as const } },
      ],
    }
    where.AND = [...(Array.isArray(where.AND) ? where.AND : []), qClause]
  }

  const orderBy = SORT_MAP[params.sort || 'newest'] || SORT_MAP.newest

  let products: Awaited<ReturnType<typeof prisma.product.findMany>>
  let brands: string[]
  let fetchError: Error | null = null

  try {
    const [productsResult, brandRows] = await Promise.all([
      prisma.product.findMany({
        where: {
          ...where,
          deletedAt: null,
        },
        orderBy: orderBy,
        take: 24,
      }),
      prisma.product.findMany({
        where: { deletedAt: null },
        distinct: ['brand'],
        select: { brand: true },
      }),
    ])
    products = productsResult
    brands = brandRows.map((row) => row.brand).filter(Boolean) as string[]
  } catch (err) {
    console.error('Shop page data fetch failed:', err)
    fetchError = err instanceof Error ? err : new Error(String(err))
    products = []
    brands = []
  }

  if (fetchError) {
    return (
      <MainLayout>
        <section data-surface="day" className="bg-background py-20 text-foreground lg:py-28">
          <div className="container mx-auto max-w-[1200px] px-6">
            <div className="mx-auto max-w-md border border-border bg-card p-10 text-center">
              <h1 className="font-serif text-2xl font-light text-foreground">Couldn’t load the shop</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Something went wrong while loading products. Please try again or browse without filters.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/shop"
                  className="inline-flex h-12 items-center justify-center bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Back to shop
                </Link>
                <Link
                  href="/"
                  className="inline-flex h-12 items-center justify-center border border-border px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  Go to homepage
                </Link>
              </div>
            </div>
          </div>
        </section>
      </MainLayout>
    )
  }

  const activeFilters =
    params.q || params.brand || params.note || params.notes || params.family || params.occasion || params.intensity || params.climate || params.minPrice || params.maxPrice

  return (
    <MainLayout>
      {/* Night editorial header */}
      <section data-surface="night" className="grain relative bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <span className="eyebrow">The collection</span>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
            {params.q ? (
              <>
                Search: <em className="text-accent">“{params.q}”</em>
              </>
            ) : (
              <>
                Perfumes, <em className="text-accent">catalogued</em>.
              </>
            )}
          </h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            {params.q
              ? 'Refine by note, family, brand and price to narrow your search.'
              : 'Filter by family, note, brand and price. Find a fragrance that lingers.'}
          </p>
        </div>
      </section>

      {/* Day commerce surface */}
      <section data-surface="day" className="bg-background py-10 text-foreground lg:py-14">
        <div className="container mx-auto max-w-[1200px] space-y-8 px-4 sm:px-6 lg:px-8">
          <ShopFiltersForm params={params} brands={brands} />

          {/* Result summary */}
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="text-foreground">{products.length}</span>{' '}
              {products.length === 1 ? 'fragrance' : 'fragrances'}
              {params.q ? ' found' : ''}
            </p>
            {activeFilters && (
              <Link
                href="/shop"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
              >
                Clear all
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={mapPrismaProductToCard(product)} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md border border-dashed border-border bg-card/60 px-8 py-16 text-center">
              <p className="font-serif text-2xl font-light text-foreground">
                Nothing matched your filters
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Try widening your price range, clearing a note, or exploring the full collection.
              </p>
              <Link
                href="/shop"
                className="mt-7 inline-flex h-12 items-center justify-center bg-primary px-7 font-mono text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                View all perfumes
              </Link>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  )
}
