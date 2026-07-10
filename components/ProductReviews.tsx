"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import { format } from "date-fns"
import { useEffect, useMemo, useState } from "react"

interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: Date
  tag?: string | null
  displayName?: string | null
  user: {
    name?: string | null
  }
}

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
  averageRating: number
  ratingCount: number
}

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  ratingCount,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [activeReviews, setActiveReviews] = useState<Review[]>(reviews)
  const [filter, setFilter] = useState<"recent" | "highest" | "lowest">("recent")
  const [filterLoading, setFilterLoading] = useState(false)

  const filters = useMemo(
    () =>
      [
        { label: "Recent", value: "recent" },
        { label: "Highest rated", value: "highest" },
        { label: "Lowest rated", value: "lowest" },
      ] as const,
    []
  )

  const fetchReviews = async (filterValue: "recent" | "highest" | "lowest") => {
    setFilterLoading(true)
    try {
      const url = `/api/reviews?productId=${encodeURIComponent(productId)}&filter=${filterValue}`
      const res = await fetch(url, { cache: "no-store" })
      const payload = await res.json().catch(() => null)
      if (res.ok && payload?.reviews) {
        setActiveReviews(payload.reviews)
      }
    } catch (error) {
      console.error("Failed to load reviews:", error)
    } finally {
      setFilterLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(filter)
  }, [filter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setIsSubmitting(true)
    setFormError(null)
    setFormMessage(null)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          comment,
          displayName: nameInput,
          tag: tagInput,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (response.status === 401) {
        setFormError("Please sign in to submit a review.")
        return
      }

      if (!response.ok) {
        setFormError(payload?.error || "We couldn't save your review. Please try again.")
        return
      }

      setFormMessage("Thank you! Your review will appear shortly.")
      setRating(0)
      setComment("")
      setNameInput("")
      setTagInput("")
      setShowForm(false)
      fetchReviews(filter)
    } catch (error) {
      console.error("Failed to submit review:", error)
      setFormError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-12 space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-semibold text-foreground">{averageRating.toFixed(1)}</div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, idx) => {
                  const star = idx + 1
                  return (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  )
                })}
              </div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{ratingCount} reviews</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full border border-border bg-background px-6 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Write a review
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {filters.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-full border px-4 py-2 transition ${
                filter === option.value
                  ? "border-primary text-primary"
                  : "border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
          {filterLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium">Your Rating</label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Your name (displayed)
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="How should we call you?"
                className="input w-full"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Scent / style tag
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. Floral, Modern"
                className="input w-full"
              />
            </label>
          </div>
          <div>
            <label htmlFor="comment" className="block text-sm font-medium">
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setRating(0)
                setComment("")
                setNameInput("")
                setTagInput("")
              }}
              className="rounded-full border border-border bg-background px-6 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
          {formError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
              {formError.toLowerCase().includes("sign in") && (
                <span className="ml-2 text-sm font-semibold text-foreground underline">
                  <Link href={`/auth/signin?callbackUrl=/product/${productId}`}>Sign in to continue</Link>
                </span>
              )}
            </div>
          )}
          {formMessage && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {formMessage}
            </div>
          )}
        </form>
      )}

      <div className="space-y-4">
        {activeReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          activeReviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {(review.displayName || review.user.name || "A")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.displayName || review.user.name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {review.tag && (
                    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      {review.tag}
                    </p>
                  )}
                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
