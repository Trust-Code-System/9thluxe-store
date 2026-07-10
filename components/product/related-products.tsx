import { SectionHeader } from "@/components/ui/section-header"
import { ProductGrid } from "@/components/ui/product-grid"
import type { Product } from "@/components/ui/product-card"

interface RelatedProductsProps {
  products: Product[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null

  return (
    <section className="mt-16 lg:mt-24 pt-12 border-t border-border">
      <SectionHeader title="You May Also Like" subtitle="Similar products you might love" />
      <ProductGrid products={products} columns={4} />
    </section>
  )
}





