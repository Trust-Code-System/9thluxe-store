"use client";

import * as React from "react";

import Link from "next/link";

import {
  Heart,
  Share2,
  Check,
  AlertCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { QuantitySelector } from "@/components/ui/quantity-selector";

import { RatingStars } from "@/components/ui/rating-stars";

import { useCartStore } from "@/lib/stores/cart-store";

import { useWishlistStore } from "@/lib/stores/wishlist-store";

import { cn } from "@/lib/utils";

import type { Product } from "@/components/ui/product-card";

interface ProductInfoProps {
  product: Product & {
    description: string;

    specifications: { label: string; value: string }[];

    inStock: boolean;

    stockCount: number;
  };
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);

  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);

  const isInWishlist = useWishlistStore((state) =>
    state.isInWishlist(product.id),
  );

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",

      currency: "NGN",

      minimumFractionDigits: 0,

      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddToCart = async () => {
    if (!product.inStock) {
      toast.error("Out of stock", {
        description: "This product is currently out of stock.",
      });
      return;
    }

    if (quantity > product.stockCount) {
      toast.error("Insufficient stock", {
        description: `Only ${product.stockCount} unit${product.stockCount !== 1 ? "s" : ""} available.`,
      });
      return;
    }

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add");

      // Optimistically update client cart so /cart shows the item immediately
      addItem(
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.image,
        },
        quantity,
        product.stockCount,
      );

      // Then sync from server cookie to keep things in lockstep
      await useCartStore.getState().syncFromServer();

      toast.success("Added to cart", {
        description: `${quantity} × ${product.name} added to your cart.`,
      });
    } catch {
      toast.error("Could not add to cart", {
        description: "Please try again.",
      });
    }
  };

  const handleAddToWishlist = () => {
    const wasInWishlist = isInWishlist;

    toggleWishlist(product);

    if (wasInWishlist) {
      toast.info("Removed from wishlist", {
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      toast.success("Added to wishlist", {
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,

        text: `Check out ${product.name} by ${product.brand}`,

        url: window.location.href,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Brand */}

      {product.brand ? (
        <Link
          href={`/shop?brand=${encodeURIComponent(product.brand)}`}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-accent transition-colors hover:text-accent/80"
        >
          {product.brand}
        </Link>
      ) : null}

      {/* Title */}

      <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight -mt-3">
        {product.name}
      </h1>

      {/* Rating */}

      <RatingStars
        rating={product.rating}
        reviewCount={product.reviewCount}
        size="md"
      />

      {/* Price */}

      <div className="flex items-center gap-3">
        <span className="text-2xl font-semibold">
          {formatPrice(product.price)}
        </span>

        {product.originalPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>

            <Badge variant="destructive" className="text-xs">
              {Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100,
              )}
              % OFF
            </Badge>
          </>
        )}
      </div>

      {/* Stock Status */}

      <div className="flex items-center gap-2">
        {product.inStock ? (
          product.stockCount <= 5 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
              <AlertCircle className="h-3.5 w-3.5" />

              {product.stockCount === 1
                ? "Last one, order soon"
                : `Only ${product.stockCount} left`}
            </span>
          ) : (
            <>
              <Check className="h-4 w-4 text-primary" />

              <span className="text-sm">In Stock</span>
            </>
          )
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />

            <span className="text-sm text-destructive">Out of Stock</span>
          </>
        )}
      </div>

      {/* Description */}

      <p className="text-muted-foreground leading-relaxed">
        {product.description}
      </p>

      {/* Key Specs */}

      <div className="grid grid-cols-2 gap-3">
        {product.specifications.slice(0, 4).map((spec) => (
          <div key={spec.label} className="text-sm">
            <span className="text-muted-foreground">{spec.label}:</span>{" "}
            <span className="font-medium">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Quantity & Add to Cart */}

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={product.stockCount}
        />

        <Button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="flex-1 h-12 text-base"
        >
          Add to Cart
        </Button>
      </div>

      {/* Wishlist & Share */}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 bg-transparent"
          onClick={handleAddToWishlist}
        >
          <Heart
            className={cn("h-4 w-4 mr-2", isInWishlist && "fill-current")}
          />

          {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 bg-transparent"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />

          <span className="sr-only">Share</span>
        </Button>
      </div>

      {/* Tags */}

      {product.tags && product.tags.length > 0 && (
        <div className="flex gap-2 pt-2">
          {product.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Trust row */}
      <div className="mt-2 grid grid-cols-1 gap-3 rounded-xl border border-border bg-secondary/50 p-4 sm:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="text-xs leading-snug">
            <p className="font-medium text-foreground">Inspected on arrival</p>
            <p className="text-muted-foreground">
              Sealed &amp; authenticity-checked
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="text-xs leading-snug">
            <p className="font-medium text-foreground">Nationwide delivery</p>
            <p className="text-muted-foreground">Tracked dispatch</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="text-xs leading-snug">
            <p className="font-medium text-foreground">Easy returns</p>
            <p className="text-muted-foreground">On eligible items</p>
          </div>
        </div>
      </div>
    </div>
  );
}
