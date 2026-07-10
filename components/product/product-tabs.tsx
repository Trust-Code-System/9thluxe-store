"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { RatingStars } from "@/components/ui/rating-stars"
import { Review } from "@prisma/client"
import { formatDate } from "@/lib/format"

interface ProductTabsProps {
  description: string
  specifications: { label: string; value: string }[]
  reviews?: Array<Review & {
    user: {
      name: string | null
    }
  }>
}

export function ProductTabs({ description, specifications, reviews = [] }: ProductTabsProps) {
  return (
    <Tabs defaultValue="description" className="mt-12 lg:mt-16">
      <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-8">
        <TabsTrigger
          value="description"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
        >
          Description
        </TabsTrigger>
        <TabsTrigger
          value="specifications"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
        >
          Specifications
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
        >
          Reviews ({reviews.length})
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

      <TabsContent value="specifications" className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {specifications.map((spec) => (
            <div key={spec.label} className="flex justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">{spec.label}</span>
              <span className="font-medium">{spec.value}</span>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="reviews" className="pt-6">
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{review.displayName || review.user.name || "Anonymous"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <RatingStars rating={review.rating} showCount={false} size="sm" />
                </div>
                {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
              </Card>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}





