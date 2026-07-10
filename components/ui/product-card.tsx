"use client"



import * as React from "react"

import Link from "next/link"

import Image from "next/image"

import { Heart, Star, Eye } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"



export interface Product {

  id: string

  slug: string

  name: string

  brand: string

  price: number

  originalPrice?: number

  image: string

  rating: number

  reviewCount: number

  tags?: ("new" | "bestseller" | "limited")[]

  category: "watches" | "perfumes" | "eyeglasses"

}



interface ProductCardProps {

  product: Product

  onAddToWishlist?: (productId: string) => void

  onQuickView?: (productId: string) => void

  className?: string

}



const tagLabels: Record<string, string> = {

  new: "New",

  bestseller: "Bestseller",

  limited: "Limited",

}



const tagColors: Record<string, string> = {

  new: "bg-primary text-primary-foreground",

  bestseller: "bg-accent text-accent-foreground",

  limited: "bg-destructive text-destructive-foreground",

}



export function ProductCard({ product, onAddToWishlist, onQuickView, className }: ProductCardProps) {

  const [isHovered, setIsHovered] = React.useState(false)



  const formatPrice = (amount: number) => {

    return new Intl.NumberFormat("en-NG", {

      style: "currency",

      currency: "NGN",

      minimumFractionDigits: 0,

      maximumFractionDigits: 0,

    }).format(amount)

  }



  const discount = product.originalPrice

    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)

    : null



  return (

    <div

      className={cn(

        "group relative flex flex-col rounded-xl bg-card border border-border overflow-hidden transition-all duration-300",

        isHovered && "shadow-lg -translate-y-1",

        className,

      )}

      onMouseEnter={() => setIsHovered(true)}

      onMouseLeave={() => setIsHovered(false)}

    >

      {/* Image Container */}

      <div className="relative aspect-square overflow-hidden bg-muted">

        <Link href={`/product/${product.slug}`}>

          <Image

            src={product.image || "/placeholder.svg"}

            alt={product.name}

            fill

            className="object-cover transition-transform duration-500 group-hover:scale-105"

            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"

          />

        </Link>



        {/* Tags */}

        {product.tags && product.tags.length > 0 && (

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">

            {product.tags.map((tag) => (

              <Badge key={tag} className={cn("text-xs font-medium px-2 py-0.5", tagColors[tag])}>

                {tagLabels[tag]}

              </Badge>

            ))}

          </div>

        )}



        {/* Discount Badge */}

        {discount && (

          <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs font-medium px-2 py-0.5">

            -{discount}%

          </Badge>

        )}



        {/* Hover Actions */}

        <div

          className={cn(

            "absolute bottom-3 left-3 right-3 flex gap-2 transition-all duration-300",

            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",

          )}

        >

          {onQuickView && (

            <Button

              variant="secondary"

              size="sm"

              className="flex-1 h-9 text-xs font-medium"

              onClick={() => onQuickView(product.id)}

            >

              <Eye className="h-3.5 w-3.5 mr-1.5" />

              Quick View

            </Button>

          )}

          {onAddToWishlist && (

            <Button variant="secondary" size="icon" className="h-9 w-9" onClick={() => onAddToWishlist(product.id)}>

              <Heart className="h-4 w-4" />

              <span className="sr-only">Add to wishlist</span>

            </Button>

          )}

        </div>

      </div>



      {/* Content */}

      <div className="flex flex-col gap-2 p-4">

        {/* Brand */}

        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{product.brand}</span>



        {/* Name */}

        <Link href={`/product/${product.slug}`}>

          <h3 className="font-medium text-sm leading-tight line-clamp-2 hover:text-accent transition-colors">

            {product.name}

          </h3>

        </Link>



        {/* Rating */}

        <div className="flex items-center gap-1.5">

          <div className="flex items-center gap-0.5">

            {Array.from({ length: 5 }).map((_, i) => (

              <Star

                key={i}

                className={cn(

                  "h-3 w-3",

                  i < Math.floor(product.rating) ? "fill-accent text-accent" : "fill-muted text-muted",

                )}

              />

            ))}

          </div>

          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>

        </div>



        {/* Price */}

        <div className="flex items-center gap-2 mt-auto pt-1">

          <span className="font-semibold text-base">{formatPrice(product.price)}</span>

          {product.originalPrice && (

            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>

          )}

        </div>

      </div>

    </div>

  )

}





