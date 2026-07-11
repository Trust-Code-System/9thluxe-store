"use client"



import Image from "next/image"

import Link from "next/link"

import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Card } from "@/components/ui/card"

import { QuantitySelector } from "@/components/ui/quantity-selector"

import type { Product } from "@/components/ui/product-card"



interface CartItemProps {

  product: Product

  quantity: number

  onUpdateQuantity: (quantity: number) => void

  onRemove: () => void

}



export function CartItem({ product, quantity, onUpdateQuantity, onRemove }: CartItemProps) {

  const formatPrice = (amount: number) => {

    return new Intl.NumberFormat("en-NG", {

      style: "currency",

      currency: "NGN",

      minimumFractionDigits: 0,

      maximumFractionDigits: 0,

    }).format(amount)

  }



  return (

    <Card className="p-4">

      <div className="flex gap-4">

        {/* Image */}

        <Link href={`/product/${product.slug}`} className="shrink-0">

          <div className="relative h-24 w-24 overflow-hidden bg-muted sm:h-32 sm:w-32">

            <Image

              src={product.image || "/placeholder-flacon.svg"}

              alt={product.name}

              fill

              className="object-cover"

              sizes="128px"

            />

          </div>

        </Link>



        {/* Info */}

        <div className="flex-1 min-w-0">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">

            <div>

              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{product.brand}</p>

              <Link href={`/product/${product.slug}`}>

                <h3 className="mt-0.5 font-serif text-sm font-medium leading-snug hover:text-accent transition-colors line-clamp-2 sm:text-base">

                  {product.name}

                </h3>

              </Link>

            </div>

            <p className="whitespace-nowrap font-mono text-sm tracking-[0.04em]">{formatPrice(product.price * quantity)}</p>

          </div>



          <div className="flex items-center justify-between mt-4">

            <QuantitySelector value={quantity} onChange={onUpdateQuantity} />

            <Button

              variant="ghost"

              size="icon"

              className="text-muted-foreground hover:text-destructive"

              onClick={onRemove}

            >

              <Trash2 className="h-4 w-4" />

              <span className="sr-only">Remove item</span>

            </Button>

          </div>

        </div>

      </div>

    </Card>

  )

}
