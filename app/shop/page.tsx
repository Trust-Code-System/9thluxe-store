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
  q?: string
  family?: string
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

  if (params.note && params.note.trim()) {
    const term = params.note.trim().toLowerCase()
    where.OR = [
      { notesTop: { contains: term, mode: 'insensitive' } },
      { notesHeart: { contains: term, mode: 'insensitive' } },
      { notesBase: { contains: term, mode: 'insensitive' } },
    ]
  }

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
        <section className="py-16 lg:py-24">
          <div className="container mx-auto max-w-[1200px] px-6">
            <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-10 text-center">
              <h1 className="font-serif text-2xl font-semibold text-foreground">Couldn’t load the shop</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Something went wrong while loading products. Please try again or browse without filters.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Back to shop
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
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

  return (
    <MainLayout>
      <section className="py-12 lg:py-20">
        <div className="container mx-auto max-w-[1200px] space-y-10 px-4 sm:px-6 lg:px-8">
          <header className="max-w-2xl space-y-3">
            <span className="eyebrow">The Collection</span>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {params.q ? (
                <>Search: <span className="italic text-accent">“{params.q}”</span></>
              ) : (
                'Browse the perfumes'
              )}
            </h1>
            <p className="leading-relaxed text-muted-foreground">
              {params.q
                ? 'Refine by note, family, brand and price to narrow your search.'
                : 'Filter by family, note, brand and price to discover a fragrance that lingers.'}
            </p>
          </header>

          <ShopFiltersForm params={params} brands={brands} />

          {/* Result summary */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{products.length}</span>{' '}
              {products.length === 1 ? 'fragrance' : 'fragrances'}
              {params.q ? ' found' : ''}
            </p>
            {(params.q || params.brand || params.note || params.family || params.minPrice || params.maxPrice) && (
              <Link href="/shop" className="text-sm font-medium text-accent hover:underline underline-offset-4">
                Clear all
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={mapPrismaProductToCard(product)} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <p className="font-serif text-xl text-foreground">Nothing matched your filters</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Try widening your price range, clearing a note, or exploring the full collection.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
