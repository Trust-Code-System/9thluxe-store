import { notFound } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { CategoryHeader } from "@/components/category/category-header"
import { CategoryFilters } from "@/components/category/category-filters"
import { ProductGrid } from "@/components/ui/product-grid"
import { categoryData } from "@/lib/category-data"
import { getProductsByCategory } from "@/lib/queries/products"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = categoryData[slug as keyof typeof categoryData]
  if (!category) {
    return { title: "Category Not Found | Fádé" }
  }
  return {
    title: `${category.title} | Fádé`,
    description: category.description,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = categoryData[slug as keyof typeof categoryData]
  if (!category) {
    notFound()
  }

  const filteredProducts = await getProductsByCategory(slug)
  const brands = ["All Brands", ...[...new Set(filteredProducts.map((p) => p.brand).filter(Boolean))].sort()]



  return (

    <MainLayout>

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

              <p className="text-sm text-muted-foreground">{filteredProducts.length} products</p>

              <CategoryFilters sortOnly />

            </div>



            {/* Product Grid */}

            {filteredProducts.length > 0 ? (

              <ProductGrid products={filteredProducts} columns={3} />

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
