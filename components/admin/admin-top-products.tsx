import Image from "next/image"

import { dummyProducts } from "@/lib/dummy-data"



const topProducts = dummyProducts.slice(0, 5).map((product, index) => ({

  ...product,

  sales: 50 - index * 8,

  revenue: product.price * (50 - index * 8),

}))



export function AdminTopProducts() {

  const formatPrice = (amount: number) => {

    return new Intl.NumberFormat("en-NG", {

      style: "currency",

      currency: "NGN",

      minimumFractionDigits: 0,

      notation: "compact",

    }).format(amount)

  }



  return (

    <div className="space-y-4">

      {topProducts.map((product, index) => (

        <div key={product.id} className="flex items-center gap-3">

          <span className="text-sm font-medium text-muted-foreground w-4">{index + 1}</span>

          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">

            <Image src={product.image || "/placeholder-flacon.svg"} alt={product.name} fill className="object-cover" />

          </div>

          <div className="flex-1 min-w-0">

            <p className="text-sm font-medium truncate">{product.name}</p>

            <p className="text-xs text-muted-foreground">{product.brand}</p>

          </div>

          <div className="text-right">

            <p className="text-sm font-medium">{formatPrice(product.revenue)}</p>

            <p className="text-xs text-muted-foreground">{product.sales} sold</p>

          </div>

        </div>

      ))}

    </div>

  )

}
