"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReviewStore } from "@/lib/stores/review-store"

interface ReviewStatusProps {
  orderId: string
  items: Array<{ product: { id: string } }>
}

export function ReviewStatus({ orderId, items }: ReviewStatusProps) {
  const hasReviewed = useReviewStore((state) => state.hasReviewed)
  const _getReviewByOrderAndProduct = useReviewStore((state) => state.getReviewByOrderAndProduct)

  const allReviewed = items.every((item) => hasReviewed(orderId, item.product.id))
  const someReviewed = items.some((item) => hasReviewed(orderId, item.product.id))

  if (allReviewed) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>All items reviewed</span>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/account/orders/${orderId}/review`}>Edit Reviews</Link>
        </Button>
      </div>
    )
  }

  if (someReviewed) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>Some items reviewed</span>
        </div>
        <Button className="w-full" asChild>
          <Link href={`/account/orders/${orderId}/review`}>Complete Reviews</Link>
        </Button>
      </div>
    )
  }

  return (
    <Button className="w-full" asChild>
      <Link href={`/account/orders/${orderId}/review`}>Leave Review</Link>
    </Button>
  )
}

