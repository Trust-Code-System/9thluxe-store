import Image from "next/image"
import { Product } from "@prisma/client"
import { formatPrice } from "@/lib/format"

interface AdminTopProductsProps {
  products: Array<Product & {
    sales: number
    revenue: number
  }>
}

export function AdminTopProducts({ products }: AdminTopProductsProps) {
  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No products yet</p>
      ) : (
        products.map((product, index) => {
          const images = Array.isArray(product.images) 
            ? product.images as string[]
            : typeof product.images === 'string'
            ? [product.images]
            : []
          return (
            <div key={product.id} className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}</span>
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                <Image src={images[0] || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.brand || "Unknown"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatPrice(product.revenue)}</p>
                <p className="text-xs text-muted-foreground">{product.sales} sold</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}





