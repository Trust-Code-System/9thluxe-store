"use client"

import type { Product } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, Heart, GitCompare, Star, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { formatPrice } from '@/lib/format'
import { ImageLightbox } from '@/components/ImageLightbox'

const labelThreshold = 1000 * 60 * 60 * 24 * 30 // 30 days

export function ProductCard({ product }: { product: Product }) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [compareCount, setCompareCount] = useState(0)
  const [showQuickView, setShowQuickView] = useState(false)
  const [isQuickAdding, setIsQuickAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()
  const images = Array.isArray(product.images) ? (product.images as string[]) : []
  const coverImage = images[0] || '/placeholder.png'
  const outOfStock = (product.stock ?? 0) <= 0
  const lowStock = !outOfStock && (product.stock ?? 0) < 5

  useEffect(() => {
    const stored = localStorage.getItem('compare')
    const compareList = stored ? JSON.parse(stored) : []
    setCompareCount(compareList.length)
  }, [])

  const label = useMemo(() => {
    const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : 0
    const now = Date.now()
    if (now - createdAt < labelThreshold) return 'New'
    if ((product.ratingCount ?? 0) > 10) return 'Bestseller'
    if (lowStock) return 'Limited'
    return null
  }, [product, lowStock])

  const ratingDisplay =
    typeof product.ratingAvg === 'number' && product.ratingAvg > 0
      ? product.ratingAvg.toFixed(1)
      : null

  const toggleWishlist = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsWishlisted((prev) => !prev)
  }

  const addToCompare = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const compareData = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      priceNGN: product.priceNGN,
      images,
      brand: product.brand,
      description: product.description,
      stock: product.stock,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
    }

    const existing = localStorage.getItem('compare')
    const compareList = existing ? JSON.parse(existing) : []

    if (compareList.some((item: any) => item.id === product.id)) {
      alert('Product is already in your compare list')
      return
    }

    if (compareList.length >= 4) {
      alert('You can compare up to 4 products at a time. Please remove a product first.')
      return
    }

    compareList.push(compareData)
    localStorage.setItem('compare', JSON.stringify(compareList))
    setCompareCount(compareList.length)
    router.push('/compare')
  }

  const openQuickView = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setShowQuickView(true)
  }

  const handleQuickAdd = async () => {
    setIsQuickAdding(true)
    setToast(null)
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToast('Added to cart')
      } else {
        setToast(data?.error || 'Unable to add to cart')
      }
    } catch (error) {
      console.error(error)
      setToast('Network error. Try again.')
    } finally {
      setIsQuickAdding(false)
    }
  }

  return (
    <>
      <Link href={`/product/${product.slug}`} className="group block">
        <article className="relative flex h-full flex-col overflow-hidden rounded-[32px] border border-border bg-card transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.25)] glass-panel glass-panel-soft">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            <Image
              src={coverImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
              loading="lazy"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex items-center gap-2">
                {label && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
                    {label}
                  </span>
                )}
                {lowStock && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-700 shadow-sm">
                    <AlertCircle className="h-3 w-3" />
                    Low stock
                  </span>
                )}
                {outOfStock && (
                  <span className="rounded-full bg-rose-100/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-700 shadow-sm">
                    Out of stock
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={addToCompare}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/90 text-gray-600 transition hover:border-white hover:text-foreground"
                    aria-label="Add to compare"
                  >
                    <GitCompare className="h-4 w-4" />
                    {compareCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {compareCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/90 text-gray-600 transition hover:border-white hover:text-foreground"
                    aria-label="Toggle wishlist"
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
                  </button>
                </div>
                <button
                  onClick={openQuickView}
                  className="text-xs font-semibold uppercase tracking-[0.4em] text-white/90 transition hover:text-white"
                >
                  Quick view
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 px-5 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{product.brand || 'Fàdè'}</p>
              {ratingDisplay && (
                <div className="mt-1 flex items-center gap-1 text-sm text-amber-500">
                  <Star className="h-4 w-4" />
                  {ratingDisplay}
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground transition hover:text-primary">
              {product.name}
            </h3>
            <p className="text-2xl font-bold text-primary">From {formatPrice(product.priceNGN)}</p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{outOfStock ? 'Temporarily unavailable' : 'Ships today'}</span>
              <span>{product.stock ?? 0} pcs</span>
            </div>
          </div>
        </article>
      </Link>

      {showQuickView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-5xl rounded-[36px] border border-border bg-background p-8 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
            <button
              onClick={() => setShowQuickView(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
              aria-label="Close quick view"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
              <div className="relative overflow-hidden rounded-[32px] bg-muted p-4">
                <ImageLightbox
                  src={coverImage}
                  alt={product.name}
                  width={600}
                  height={800}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.5em] text-muted-foreground">
                  {product.brand || 'Fàdè'}
                </p>
                <h3 className="text-3xl font-semibold text-foreground">{product.name}</h3>
                <div className="text-2xl font-bold text-primary">{formatPrice(product.priceNGN)}</div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{product.stock ?? 0} in stock</span>
                  {ratingDisplay && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4" />
                      {ratingDisplay}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleQuickAdd}
                    disabled={isQuickAdding || outOfStock}
                    className="btn inline-flex items-center justify-center px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em]"
                  >
                    {isQuickAdding ? 'Adding...' : 'Add to cart'}
                  </button>
                  <Link
                    href={`/product/${product.slug}`}
                    className="btn btn-outline text-sm font-semibold uppercase tracking-[0.3em]"
                  >
                    View product
                  </Link>
                </div>
                {toast && (
                  <div className="rounded-lg border border-muted-foreground/20 px-4 py-2 text-sm text-muted-foreground">
                    {toast}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
