import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { ProductGrid } from "@/components/ui/product-grid"
import { resolveBrandFromSlug } from "@/lib/brand-slug-map"
import { prisma } from "@/lib/prisma"
import { mapPrismaProductToCard } from "@/lib/queries/products"

interface BrandPageProps {
  params: Promise<{ brand: string }>
}

async function getDbBrands(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { deletedAt: null },
    distinct: ["brand"],
    select: { brand: true },
  })
  return rows.map((r) => r.brand).filter(Boolean) as string[]
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand } = await params
  let brandName: string | undefined
  try {
    brandName = resolveBrandFromSlug(brand, await getDbBrands())
  } catch {
    brandName = undefined
  }

  if (!brandName) {
    return { title: "Brand Not Found | Fádé" }
  }

  return {
    title: `${brandName} | Fádé`,
    description: `Explore our curated ${brandName} perfumes: authentic bottles, honest guidance.`,
  }
}

export default async function BrandCollectionPage({ params }: BrandPageProps) {
  const { brand } = await params

  let brandName: string | undefined
  let brandProducts: ReturnType<typeof mapPrismaProductToCard>[] = []

  try {
    brandName = resolveBrandFromSlug(brand, await getDbBrands())
    if (brandName) {
      const dbProducts = await prisma.product.findMany({
        where: { brand: brandName, deletedAt: null },
        orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
      })
      brandProducts = dbProducts.map(mapPrismaProductToCard)
    }
  } catch (err) {
    console.error("BrandCollectionPage: failed to load", err)
  }

  if (!brandName) {
    notFound()
  }

  return (
    <MainLayout>
      {/* Night header */}
      <section data-surface="night" className="grain relative bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="mb-8">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All collections
            </Link>
          </div>
          <p className="eyebrow block">The house of</p>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
            {brandName}
          </h1>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {brandProducts.length}{" "}
            {brandProducts.length === 1 ? "fragrance" : "fragrances"} in the
            catalogue
          </p>
        </div>
      </section>

      {/* Day catalogue */}
      <section data-surface="day" className="bg-background py-12 text-foreground lg:py-16">
        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          {brandProducts.length > 0 ? (
            <ProductGrid products={brandProducts} columns={4} />
          ) : (
            <div className="mx-auto max-w-md border border-dashed border-border bg-card/60 px-8 py-16 text-center">
              <p className="font-serif text-2xl font-light">
                Nothing from {brandName} right now
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This house is between allocations. Explore the rest of the
                collection while it restocks.
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
