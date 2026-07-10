import { notFound } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { CategoryHeader } from "@/components/category/category-header"
import { CategoryFilters } from "@/components/category/category-filters"
import { ProductGrid } from "@/components/ui/product-grid"
import { getProductsByCategory, getBrands } from "@/lib/queries/products"
import { mapProductToUI } from "@/lib/mappers"
import type { Metadata } from "next"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ brand?: string; sort?: string }>
}

const categoryData: Record<string, { title: string; subtitle: string; description?: string }> = {
  watches: {
    title: "Watches",
    subtitle: "Timepieces for every moment.",
    description: "Discover our curated collection of luxury watches from the world's most prestigious brands.",
  },
  perfumes: {
    title: "Perfumes",
    subtitle: "Fragrances that define you.",
    description: "Explore exquisite scents crafted by master perfumers for the discerning individual.",
  },
  eyeglasses: {
    title: "Eyeglasses",
    subtitle: "Vision meets style.",
    description: "Premium eyewear that combines cutting-edge design with uncompromising quality.",
  },
  glasses: {
    title: "Eyeglasses",
    subtitle: "Vision meets style.",
    description: "Premium eyewear that combines cutting-edge design with uncompromising quality.",
  },
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = categoryData[slug as keyof typeof categoryData]

  if (!category) {
    return { title: "Category Not Found | Fàdè" }
  }

  return {
    title: `${category.title} | Fàdè`,
    description: category.description || category.subtitle,
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { brand, sort } = await searchParams
  const category = categoryData[slug as keyof typeof categoryData]

  if (!category) {
    notFound()
  }

  const [products, brands] = await Promise.all([
    getProductsByCategory(slug, { brand, sort }),
    getBrands(),
  ])

  const uiProducts = products.map(mapProductToUI)

  return (
    <MainLayout cartItemCount={3}>
      <CategoryHeader title={category.title} subtitle={category.subtitle} description={category.description} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <CategoryFilters brands={brands} />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters & Sort */}
            <div className="lg:hidden mb-6">
              <CategoryFilters brands={brands} mobile />
            </div>

            {/* Results Count & Sort (Desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">{uiProducts.length} products</p>
              <CategoryFilters sortOnly />
            </div>

            {/* Product Grid */}
            {uiProducts.length > 0 ? (
              <ProductGrid products={uiProducts} columns={3} />
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
