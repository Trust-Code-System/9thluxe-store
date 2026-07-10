import type { Product } from '@prisma/client'
import { ProductCard } from '@/components/ProductCard'
import { Card } from '@/components/ui/card'

type FeaturedProductsProps = {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products.length) {
    return (
      <section className="py-16">
        <div className="container mx-auto max-w-[1200px] px-6">
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <h2 className="text-2xl font-semibold text-foreground">Featured collections coming soon</h2>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="container-max">
        <Card className="space-y-5">
          <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Fresh drops</p>
          <h2 className="text-3xl font-semibold text-foreground">Curated for now</h2>
        </div>
        </Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
