"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, Eye } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  tags?: ("new" | "bestseller" | "limited")[];
  category: "perfumes";
}

interface ProductCardProps {
  product: Product;
  imageLoading?: "eager" | "lazy";
  onAddToWishlist?: (productId: string) => void;
  onQuickView?: (productId: string) => void;
  className?: string;
}

const tagLabels: Record<string, string> = {
  new: "New",
  bestseller: "Bestseller",
  limited: "Limited",
};

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProductCard({
  product,
  imageLoading,
  onAddToWishlist,
  onQuickView,
  className,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null;

  const primaryTag = product.tags?.[0];

  return (
    <div className={cn("group relative flex flex-col", className)}>
      {/* Image plate */}
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="relative block h-full w-full"
        >
          <Image
            src={
              imageFailed
                ? "/placeholder-flacon.svg"
                : product.image || "/placeholder-flacon.svg"
            }
            alt={product.name}
            fill
            loading={imageLoading}
            onError={() => setImageFailed(true)}
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Pedestal light on hover */}
          <span
            aria-hidden
            className="pedestal-light pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </Link>

        {/* Tag + discount: mono whispers, not badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
          {primaryTag && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
              <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
              {tagLabels[primaryTag]}
            </span>
          )}
        </div>
        {discount && (
          <span className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.18em] text-accent [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
            −{discount}%
          </span>
        )}

        {/* Hover actions */}
        {(onQuickView || onAddToWishlist) && (
          <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(product.id)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border/60 bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
                aria-label={`Quick view ${product.name}`}
              >
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
            {onAddToWishlist && (
              <button
                type="button"
                onClick={() => onAddToWishlist(product.id)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border/60 bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
                aria-label={`Add ${product.name} to wishlist`}
              >
                <Heart className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Meta: editorial rows under a hairline */}
      <div className="flex flex-1 flex-col gap-1 border-t border-border/70 pt-3.5 mt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {product.brand || "Fádé"}
          </span>
          {product.reviewCount > 0 && (
            <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
              <Star
                className="h-2.5 w-2.5 fill-accent text-accent"
                aria-hidden
              />
              {product.rating.toFixed(1)}
              <span className="text-muted-foreground/60">
                ({product.reviewCount})
              </span>
            </span>
          )}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="line-clamp-2 font-serif text-lg font-normal leading-snug transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-baseline gap-2.5 pt-1">
          <span className="font-mono text-sm tracking-[0.04em]">
            {formatNaira(product.price)}
          </span>
          {product.originalPrice && (
            <span className="font-mono text-xs tracking-[0.04em] text-muted-foreground line-through">
              {formatNaira(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
