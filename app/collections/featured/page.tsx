import type { Metadata } from "next"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductGrid } from "@/components/ui/product-grid"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Featured Collections | Fádé",
  description: "Explore our featured collections of luxury perfumes. Discover timeless elegance and premium craftsmanship.",
}

export const dynamic = "force-dynamic"

export default async function FeaturedCollectionsPage() {
  // Fetch featured products (best-effort: avoid crashing route if DB isn't ready).
  let dbProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  try {
    dbProducts = await prisma.product.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted products
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

  // Transform database products to match ProductCard format
  const featuredProducts = dbProducts.map((product) => {
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            Featured Collections
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover our handpicked selection of luxury items, from timeless timepieces to signature fragrances and premium eyewear.
          </p>
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {featuredProducts.length} {featuredProducts.length === 1 ? "product" : "products"} found
          </p>
        </div>

        {/* Product Grid */}
        {featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} />
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No featured products available at the moment.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

