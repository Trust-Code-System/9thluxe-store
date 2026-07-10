import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"
import { CollectionsHero } from "@/components/collections/collections-hero"
import { FeaturedCollections } from "@/components/collections/featured-collections"
import { CollectionsGrid } from "@/components/collections/collections-grid"
import { BrandShowcase } from "@/components/collections/brand-showcase"
import { SpecialCollections } from "@/components/collections/special-collections"
import { CollectionsStats } from "@/components/collections/collections-stats"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Collections | Fádé",
  description: "Explore our curated collections of luxury perfumes. Discover timeless elegance and premium craftsmanship.",
}

export const dynamic = "force-dynamic"

export default async function CollectionsPage() {
  // Fetch all products from database (best-effort: avoid crashing route if DB isn't ready).
  let dbProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  try {
    dbProducts = await prisma.product.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted products
      },
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

  // Transform database products to match ProductCard format
  const allProducts = dbProducts.map((product) => {
    const images = Array.isArray(product.images) ? (product.images as string[]) : []
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand || "",
      price: product.priceNGN,
      oldPrice: product.oldPriceNGN || undefined,
      image: images[0] || "/placeholder.svg",
      images: images,
      category: "perfumes" as const,
      rating: product.ratingAvg,
      reviewCount: product.ratingCount,
      tags: [
        product.isBestseller && "bestseller",
        product.isNew && "new",
        product.isLimited && "limited",
      ].filter(Boolean) as ("new" | "bestseller" | "limited")[],
    }
  })

  // Organize products by collections
  const featuredProducts = allProducts.filter((p) => p.tags?.includes("bestseller"))
  const newArrivals = allProducts.filter((p) => p.tags?.includes("new"))
  const limitedEdition = allProducts.filter((p) => p.tags?.includes("limited"))

  return (
    <MainLayout>
      <CollectionsHero />
      <CollectionsStats />
      <FeaturedCollections products={allProducts} />
      <SpecialCollections
        featured={featuredProducts}
        newArrivals={newArrivals}
        limited={limitedEdition}
      />
      <BrandShowcase />
      <CollectionsGrid products={allProducts} />
    </MainLayout>
  )
}

