import { cn } from "@/lib/utils"

import { ProductCard, type Product } from "./product-card"



interface ProductGridProps {

  products: Product[]

  columns?: 2 | 3 | 4

  onAddToWishlist?: (productId: string) => void

  onQuickView?: (productId: string) => void

  className?: string

}



export function ProductGrid({ products, columns = 4, onAddToWishlist, onQuickView, className }: ProductGridProps) {

  const gridCols = {

    2: "grid-cols-2",

    3: "grid-cols-2 lg:grid-cols-3",

    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",

  }



  return (

    <div className={cn("grid gap-4 md:gap-6", gridCols[columns], className)}>

      {products.map((product) => (

        <ProductCard key={product.id} product={product} onAddToWishlist={onAddToWishlist} onQuickView={onQuickView} />

      ))}

    </div>

  )

}





