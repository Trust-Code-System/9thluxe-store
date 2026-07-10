import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductGrid } from "@/components/ui/product-grid"
import { Button } from "@/components/ui/button"
import { getBrandNameFromSlug } from "@/lib/brand-slug-map"
import { prisma } from "@/lib/prisma"
import { mapPrismaProductToCard } from "@/lib/queries/products"

interface BrandPageProps {
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand } = await params
  const brandName = getBrandNameFromSlug(brand)

  if (!brandName) {
    return {
      title: "Brand Not Found | Fádé",
    }
  }

  return {
    title: `${brandName} Collection | Fádé`,
    description: `Explore our curated collection of ${brandName} luxury products. Discover timeless elegance and premium craftsmanship.`,
  }
}

export default async function BrandCollectionPage({ params }: BrandPageProps) {
  const { brand } = await params
  const brandName = getBrandNameFromSlug(brand)

  // If brand slug doesn't match any known brand, show 404
  if (!brandName) {
    notFound()
  }

  // Fetch products by brand from the database
  const dbProducts = await prisma.product.findMany({
    where: { brand: brandName, deletedAt: null },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
  })
  const brandProducts = dbProducts.map(mapPrismaProductToCard)

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <div className="mb-4">
            <Link
              href="/collections"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              ← Back to Collections
            </Link>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-4">
            {brandName} Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover our handpicked selection of {brandName} luxury products, featuring timeless elegance and premium craftsmanship.
          </p>
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {brandProducts.length} {brandProducts.length === 1 ? "product" : "products"} found
          </p>
        </div>

        {/* Product Grid or Empty State */}
        {brandProducts.length > 0 ? (
          <ProductGrid products={brandProducts} columns={4} />
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h2 className="font-serif text-2xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground mb-6">
                No products found for this collection. Check back soon for new arrivals.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/collections">Back to Collections</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

