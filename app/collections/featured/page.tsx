import type { Metadata } from "next"
import Link from "next/link"

import { MainLayout } from "@/components/layout/main-layout"
import { ProductGrid } from "@/components/ui/product-grid"
import { prisma } from "@/lib/prisma"
import { mapPrismaProductToCard } from "@/lib/queries/products"

export const metadata: Metadata = {
  title: "Featured | Fádé",
  description:
    "The featured edit: bestsellers, new arrivals and limited perfumes, chosen by the house.",
}

export const dynamic = "force-dynamic"

export default async function FeaturedCollectionsPage() {
  let dbProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  try {
    dbProducts = await prisma.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          { isBestseller: true },
          { isNew: true },
          { isLimited: true },
          { isFeatured: true },
        ],
      },
      orderBy: [
        { isFeatured: "desc" },
        { isBestseller: "desc" },
        { ratingAvg: "desc" },
        { createdAt: "desc" },
      ],
      take: 50,
    })
  } catch (err) {
    console.error("FeaturedCollectionsPage: failed to load products", err)
    dbProducts = []
  }

  const featuredProducts = dbProducts.map(mapPrismaProductToCard)

  return (
    <MainLayout>
      <section data-surface="night" className="grain relative bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <span className="eyebrow">The edit</span>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
            Featured <em className="text-accent">perfumes</em>
          </h1>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Bestsellers, new arrivals and limited allocations: the bottles the
            house is wearing right now.
          </p>
        </div>
      </section>

      <section data-surface="day" className="bg-background py-12 text-foreground lg:py-16">
        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-foreground">{featuredProducts.length}</span>{" "}
            {featuredProducts.length === 1 ? "fragrance" : "fragrances"}
          </p>

          {featuredProducts.length > 0 ? (
            <ProductGrid products={featuredProducts} columns={4} />
          ) : (
            <div className="mx-auto max-w-md border border-dashed border-border bg-card/60 px-8 py-16 text-center">
              <p className="font-serif text-2xl font-light">
                Nothing featured right now
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The edit rotates. Meanwhile, the full collection is open.
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
