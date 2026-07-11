import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"
import { SectionHeader } from "@/components/ui/section-header"
import { ProductGrid } from "@/components/ui/product-grid"
import { prisma } from "@/lib/prisma"
import { mapPrismaProductToCard } from "@/lib/queries/products"
import { slugifyBrand } from "@/lib/brand-slug-map"

export const metadata: Metadata = {
  title: "Collections | Fádé",
  description:
    "Explore our curated collections of luxury perfumes: bestsellers, new arrivals, limited drops and the houses we carry.",
}

export const dynamic = "force-dynamic"

export default async function CollectionsPage() {
  let dbProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  try {
    dbProducts = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: [
        { isFeatured: "desc" },
        { isBestseller: "desc" },
        { ratingAvg: "desc" },
        { createdAt: "desc" },
      ],
      take: 100,
    })
  } catch (err) {
    console.error("CollectionsPage: failed to load products", err)
    dbProducts = []
  }

  const allProducts = dbProducts.map(mapPrismaProductToCard)

  const edits = [
    {
      key: "bestsellers",
      title: "Bestsellers",
      note: "The most re-ordered bottles in the house.",
      products: dbProducts.filter((p) => p.isBestseller).map(mapPrismaProductToCard),
    },
    {
      key: "new",
      title: "New arrivals",
      note: "Fresh in from the ateliers.",
      products: dbProducts.filter((p) => p.isNew).map(mapPrismaProductToCard),
    },
    {
      key: "limited",
      title: "Limited editions",
      note: "Small allocations. When they go, they go.",
      products: dbProducts.filter((p) => p.isLimited).map(mapPrismaProductToCard),
    },
  ].filter((edit) => edit.products.length > 0)

  // The houses actually present in the catalogue: real data, no marketing lists.
  const brands = [...new Set(dbProducts.map((p) => p.brand).filter(Boolean) as string[])].sort()

  return (
    <MainLayout>
      {/* Night editorial header */}
      <section data-surface="night" className="veil grain relative bg-background text-foreground">
        <div className="container relative z-10 mx-auto max-w-[1200px] px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <span className="eyebrow">Curated by the house</span>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl font-light tracking-[-0.01em] md:text-6xl">
            Collections with a <em className="text-accent">point of view</em>.
          </h1>
          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            Not everything, only the worthwhile: our edits, and the houses we
            choose to carry.
          </p>
        </div>
      </section>

      {/* Edits */}
      <section data-surface="day" className="bg-background py-16 text-foreground lg:py-24">
        <div className="container mx-auto max-w-[1200px] space-y-20 px-4 sm:px-6 lg:px-8">
          {edits.length > 0 ? (
            edits.map((edit) => (
              <div key={edit.key}>
                <SectionHeader
                  eyebrow="The edit"
                  title={edit.title}
                  subtitle={edit.note}
                  viewAllHref="/collections/featured"
                />
                <ProductGrid products={edit.products.slice(0, 4)} columns={4} />
              </div>
            ))
          ) : (
            <div>
              <SectionHeader
                eyebrow="The collection"
                title="The full catalogue"
                subtitle="Every perfume currently in the house."
                viewAllHref="/shop"
              />
              <ProductGrid products={allProducts.slice(0, 8)} columns={4} />
            </div>
          )}
        </div>
      </section>

      {/* The houses: real brand ledger */}
      {brands.length > 0 && (
        <section data-surface="night" className="grain relative bg-background py-16 text-foreground lg:py-24">
          <div className="container relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <header className="mb-10">
              <p className="eyebrow mb-4">The houses</p>
              <h2 className="font-serif text-3xl font-light md:text-4xl">
                Maisons we carry
              </h2>
            </header>
            <ul className="border-t border-border">
              {brands.map((brand, i) => (
                <li key={brand}>
                  <Link
                    href={`/collections/${slugifyBrand(brand)}`}
                    className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-6 border-b border-border py-5 transition-colors hover:bg-secondary/40"
                  >
                    <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-serif text-2xl font-light transition-all duration-300 group-hover:italic group-hover:text-accent">
                      {brand}
                    </span>
                    <ArrowUpRight
                      className="h-5 w-5 self-center text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </MainLayout>
  )
}
