import type { Product } from '@prisma/client'

type ProductSpecsProps = {
  product: Product
}

const renderRow = (label: string, value?: string | null) => {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-3 last:border-none">
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

export function ProductSpecs({ product }: ProductSpecsProps) {
  const typeKey = (product.productType ?? product.category.toLowerCase()).toLowerCase()
  const isPerfume = typeKey.includes("perfume")
  const isWatch = typeKey.includes("watch")
  const isGlass = typeKey.includes("glass")

  return (
    <div className="space-y-3">
      {isPerfume && (
        <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Fragrance pyramid</p>
          <div className="mt-3 space-y-2">
            {renderRow("Top notes", product.notesTop)}
            {renderRow("Heart notes", product.notesHeart)}
            {renderRow("Base notes", product.notesBase)}
            {renderRow("Longevity", product.longevity)}
            {renderRow("Occasion", product.occasion)}
          </div>
        </div>
      )}

      {(isWatch || isGlass) && (
        <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Material details</p>
          <div className="mt-3 space-y-2">
            {renderRow("Material", product.material)}
            {renderRow("Lens type", product.lensType)}
            {renderRow("Warranty", product.warranty)}
            {renderRow("Water resistance", product.waterResistance)}
          </div>
        </div>
      )}

      {!isPerfume && !isWatch && !isGlass && (
        <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-inner">
          <p className="text-sm text-muted-foreground">No additional specs available for this product.</p>
        </div>
      )}
    </div>
  )
}
