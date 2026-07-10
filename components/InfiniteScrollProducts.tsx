"use client"

import type { Product } from '@prisma/client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ProductCard } from './ProductCard'
import { ProductGridSkeleton } from './ProductCardSkeleton'

interface InfiniteScrollProductsProps {
  initialProducts: Product[]
  category: string
  sort?: string
  brand?: string
  pageSize?: number
}

export function InfiniteScrollProducts({
  initialProducts,
  category,
  sort,
  brand,
  pageSize = 12,
}: InfiniteScrollProductsProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length === pageSize)
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(Math.floor(products.length / pageSize) + 1),
        category,
        ...(sort && { sort }),
        ...(brand && { brand }),
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (data.products.length > 0) {
        setProducts((prev) => [...prev, ...data.products])
        setHasMore(data.products.length === pageSize)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more products:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [products.length, loading, hasMore, category, sort, brand, pageSize])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore, hasMore, loading])

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {loading && (
        <div className="mt-8">
          <ProductGridSkeleton count={3} />
        </div>
      )}

      <div ref={observerTarget} className="h-10" />
    </>
  )
}



