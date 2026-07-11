"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useReviewStore } from "@/lib/stores/review-store"

type OrderItem = {
  product: { id: string; name: string; slug: string; brand: string | null; image: string; price: number }
  quantity: number
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = React.useState<{ id: string; items: OrderItem[] } | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`)
        if (!res.ok) {
          if (!cancelled) setOrder(null)
          return
        }
        const data = await res.json()
        if (!cancelled) setOrder(data.order)
      } catch {
        if (!cancelled) setOrder(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [orderId])

  const addReview = useReviewStore((state) => state.addReview)
  const getReviewByOrderAndProduct = useReviewStore((state) => state.getReviewByOrderAndProduct)

  const [reviews, setReviews] = React.useState<Record<string, { rating: number; comment: string }>>({})

  React.useEffect(() => {
    if (!order) return
    const initial: Record<string, { rating: number; comment: string }> = {}
    order.items.forEach((item) => {
      const existing = getReviewByOrderAndProduct(orderId, item.product.id)
      if (existing) {
        initial[item.product.id] = { rating: existing.rating, comment: existing.comment }
      } else {
        initial[item.product.id] = { rating: 0, comment: "" }
      }
    })
    setReviews(initial)
  }, [order, orderId, getReviewByOrderAndProduct])

  const handleRatingChange = (productId: string, rating: number) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], rating },
    }))
  }

  const handleCommentChange = (productId: string, comment: string) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], comment },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    const hasRating = Object.values(reviews).some((r) => r.rating > 0)
    if (!hasRating) {
      toast.error("Please provide a rating", {
        description: "At least one product must have a rating.",
      })
      return
    }

    let savedCount = 0
    order.items.forEach((item) => {
      const review = reviews[item.product.id]
      if (review && review.rating > 0) {
        addReview({
          productId: item.product.id,
          orderId: orderId,
          rating: review.rating,
          comment: review.comment || "",
        })
        savedCount++
      }
    })

    if (savedCount > 0) {
      toast.success("Review submitted", {
        description: `Thank you for your feedback! ${savedCount} review${savedCount > 1 ? "s" : ""} ${savedCount > 1 ? "have" : "has"} been submitted.`,
      })
      router.push(`/account/orders/${orderId}`)
    } else {
      toast.error("No reviews to submit", {
        description: "Please provide at least one rating before submitting.",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild variant="outline">
          <Link href="/account/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/account/orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-semibold">Leave a Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Order {order.id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {order.items.map((item) => {
          const productId = item.product.id
          const review = reviews[productId] || { rating: 0, comment: "" }
          const hasExistingReview = getReviewByOrderAndProduct(orderId, productId)

          return (
            <Card key={productId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Review {item.product.name}</CardTitle>
                  {hasExistingReview && (
                    <Badge variant="secondary" className="text-xs">
                      Previously reviewed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Link href={`/product/${item.product.slug}`} className="shrink-0">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={item.product.image || "/placeholder-flacon.svg"}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/product/${item.product.slug}`}>
                      <h3 className="font-medium hover:text-accent transition-colors">{item.product.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(productId, star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= review.rating
                              ? "fill-accent text-accent"
                              : "fill-muted text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`comment-${productId}`}>Your Review</Label>
                  <Textarea
                    id={`comment-${productId}`}
                    placeholder="Share your experience with this product..."
                    value={review.comment}
                    onChange={(e) => handleCommentChange(productId, e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}

        <div className="flex gap-3">
          <Button type="submit" disabled={Object.keys(reviews).length === 0}>
            Submit Reviews
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/account/orders/${orderId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

