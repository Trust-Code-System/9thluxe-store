"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { RatingStars } from "@/components/ui/rating-stars"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquare, Clock, Sparkles } from "lucide-react"
import Link from "next/link"

interface Review {
  id: string
  rating: number
  comment: string | null
  displayName: string | null
  createdAt: string
  user: { name: string | null }
}

interface ProductTabsProps {
  description: string
  specifications: { label: string; value: string }[]
  productId: string
  productSlug: string
  notesTop?: string
  notesHeart?: string
  notesBase?: string
  longevity?: string
  occasion?: string
}

function FragrancePyramid({
  notesTop,
  notesHeart,
  notesBase,
  longevity,
  occasion,
}: {
  notesTop?: string
  notesHeart?: string
  notesBase?: string
  longevity?: string
  occasion?: string
}) {
  const hasNotes = notesTop || notesHeart || notesBase

  if (!hasNotes) return null

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted-foreground mb-8">
        Every great fragrance tells a story in three acts: the opening top notes, the evolving heart, and the lasting
        base that lingers on your skin.
      </p>

      {/* Pyramid */}
      <div className="flex flex-col items-center gap-0 mb-8">
        {/* Top Notes */}
        {notesTop && (
          <div className="w-full flex flex-col items-center">
            <div className="w-[45%] min-w-[200px] bg-primary/10 border border-primary/20 rounded-t-lg flex flex-col items-center justify-center py-5 px-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Top Notes</span>
              <span className="text-sm text-foreground font-medium">{notesTop}</span>
              <span className="text-xs text-muted-foreground mt-1">First impression • 0–30 min</span>
            </div>
          </div>
        )}

        {/* Heart Notes */}
        {notesHeart && (
          <div className="w-full flex flex-col items-center">
            <div className="w-[70%] min-w-[260px] bg-primary/5 border border-primary/15 border-t-0 flex flex-col items-center justify-center py-5 px-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Heart Notes</span>
              <span className="text-sm text-foreground font-medium">{notesHeart}</span>
              <span className="text-xs text-muted-foreground mt-1">The soul • 30 min–4 hrs</span>
            </div>
          </div>
        )}

        {/* Base Notes */}
        {notesBase && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-[480px] bg-muted/60 border border-border border-t-0 rounded-b-lg flex flex-col items-center justify-center py-5 px-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Base Notes
              </span>
              <span className="text-sm text-foreground font-medium">{notesBase}</span>
              <span className="text-xs text-muted-foreground mt-1">The signature • 4+ hrs</span>
            </div>
          </div>
        )}
      </div>

      {/* Longevity & Occasion badges */}
      {(longevity || occasion) && (
        <div className="flex flex-wrap gap-3">
          {longevity && (
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{longevity}</span>
            </div>
          )}
          {occasion && (
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">{occasion}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ProductTabs({
  description,
  specifications,
  productId,
  productSlug,
  notesTop,
  notesHeart,
  notesBase,
  longevity,
  occasion,
}: ProductTabsProps) {
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [reviewsLoaded, setReviewsLoaded] = React.useState(false)
  const [reviewsLoading, setReviewsLoading] = React.useState(false)

  const hasFragranceDNA = notesTop || notesHeart || notesBase

  const loadReviews = React.useCallback(async () => {
    if (reviewsLoaded) return
    setReviewsLoading(true)
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      const data = await res.json()
      setReviews(data.reviews ?? [])
    } catch {
      setReviews([])
    } finally {
      setReviewsLoading(false)
      setReviewsLoaded(true)
    }
  }, [productId, reviewsLoaded])

  return (
    <Tabs defaultValue="description" className="mt-12 lg:mt-16">
      <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-8 overflow-x-auto">
        <TabsTrigger
          value="description"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 whitespace-nowrap"
        >
          Description
        </TabsTrigger>

        {hasFragranceDNA && (
          <TabsTrigger
            value="fragrance-dna"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 whitespace-nowrap"
          >
            Fragrance DNA
          </TabsTrigger>
        )}

        <TabsTrigger
          value="specifications"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 whitespace-nowrap"
        >
          Specifications
        </TabsTrigger>

        <TabsTrigger
          value="reviews"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 whitespace-nowrap"
          onClick={loadReviews}
        >
          Reviews
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="pt-6">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed">{description}</p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Each product in our collection undergoes rigorous quality control to ensure it meets our exacting standards.
            We partner only with authorized dealers and brands to guarantee authenticity and provide you with peace of
            mind in every purchase.
          </p>
        </div>
      </TabsContent>

      {hasFragranceDNA && (
        <TabsContent value="fragrance-dna" className="pt-6">
          <FragrancePyramid
            notesTop={notesTop}
            notesHeart={notesHeart}
            notesBase={notesBase}
            longevity={longevity}
            occasion={occasion}
          />
        </TabsContent>
      )}

      <TabsContent value="specifications" className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {specifications.length === 0 ? (
            <p className="text-muted-foreground text-sm col-span-2">No specifications available for this product.</p>
          ) : (
            specifications.map((spec) => (
              <div key={spec.label} className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">{spec.label}</span>
                <span className="font-medium">{spec.value}</span>
              </div>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="reviews" className="pt-6">
        {reviewsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading reviews…</span>
          </div>
        ) : reviews.length === 0 && reviewsLoaded ? (
          <div className="text-center py-12 space-y-4">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
            <div>
              <p className="font-medium">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to share your experience with this product.
              </p>
            </div>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href={`/product/${productSlug}#write-review`}>Write a Review</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{review.displayName || review.user.name || "Verified Buyer"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <RatingStars rating={review.rating} showCount={false} size="sm" />
                </div>
                {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
