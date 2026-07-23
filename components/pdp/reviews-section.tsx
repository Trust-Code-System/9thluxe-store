"use client"

import * as React from "react"
import { Loader2, MessageSquare, Sparkles, RefreshCw, Star, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RatingStars } from "@/components/ui/rating-stars"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { trackPdp } from "@/lib/analytics/pdp-events"
import type { PdpReviewSummary, PdpReview } from "@/lib/pdp/types"

type Sort = "recent" | "highest" | "lowest"

interface AiSummary {
  summary: string | null
  reviewsSummarized: number
  isAiSummary: true
  reason: string | null
}

/**
 * Complete review experience. The aggregate summary is server-computed (passed as a prop, no
 * refetch). The list, AI summary and submission load lazily. The AI summary is explicitly labelled,
 * states how many reviews it covers, and never replaces access to the original reviews. No
 * AI-generated reviews are ever created.
 */
export function ReviewsSection({
  productId,
  summary,
}: {
  productId: string
  summary: PdpReviewSummary | null
}) {
  const [reviews, setReviews] = React.useState<PdpReview[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  // AI summary
  const [ai, setAi] = React.useState<AiSummary | null>(null)
  const [aiLoading, setAiLoading] = React.useState(false)

  // controls
  const [sort, setSort] = React.useState<Sort>("recent")
  const [minRating, setMinRating] = React.useState(0)
  const [verifiedOnly, setVerifiedOnly] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const loadReviews = React.useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/v1/reviews?productId=${encodeURIComponent(productId)}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setReviews((json.data?.reviews ?? []) as PdpReview[])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [productId])

  React.useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const loadAi = React.useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch(`/api/v1/reviews/summary?productId=${encodeURIComponent(productId)}`)
      const json = await res.json()
      setAi(json.data as AiSummary)
    } catch {
      setAi(null)
    } finally {
      setAiLoading(false)
    }
  }, [productId])

  const visible = React.useMemo(() => {
    let list = reviews.slice()
    if (minRating > 0) list = list.filter((r) => r.rating >= minRating)
    if (verifiedOnly) list = list.filter((r) => r.verifiedPurchase)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (r) => r.comment?.toLowerCase().includes(q) || r.displayName?.toLowerCase().includes(q),
      )
    }
    if (sort === "recent") list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    if (sort === "highest") list.sort((a, b) => b.rating - a.rating)
    if (sort === "lowest") list.sort((a, b) => a.rating - b.rating)
    return list
  }, [reviews, minRating, verifiedOnly, query, sort])

  if (!summary && !loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-8 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground opacity-40" />
        <p className="mt-3 font-medium">No reviews yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified buyers can share how this fragrance wears. Yours could be the first.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      {/* Summary rail */}
      {summary && (
        <aside className="space-y-5">
          <div>
            <div className="flex items-end gap-2">
              <span className="font-serif text-4xl">{summary.ratingAvg.toFixed(1)}</span>
              <RatingStars rating={summary.ratingAvg} showCount={false} size="sm" className="mb-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              {summary.ratingCount} review{summary.ratingCount === 1 ? "" : "s"}
              {summary.verifiedPct != null && ` · ${summary.verifiedPct}% verified purchase`}
            </p>
          </div>

          <ul className="space-y-1.5" aria-label="Rating distribution">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = summary.distribution[star as 1 | 2 | 3 | 4 | 5]
              const pct = summary.ratingCount ? Math.round((n / summary.ratingCount) * 100) : 0
              return (
                <li key={star}>
                  <button
                    type="button"
                    onClick={() => {
                      setMinRating(minRating === star ? 0 : star)
                      trackPdp("review_filter_used", { productId, filter: "rating", value: star })
                    }}
                    className="flex w-full items-center gap-2 text-xs"
                  >
                    <span className="flex w-8 items-center gap-0.5 text-muted-foreground">
                      {star} <Star className="h-3 w-3" />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-6 text-right text-muted-foreground">{n}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <SubScores summary={summary} />
          <Histogram title="Worn in" data={summary.climateHistogram} />
          <Histogram title="Occasions" data={summary.occasionHistogram} />
        </aside>
      )}

      {/* Main */}
      <div className="space-y-6">
        {/* AI summary */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-accent" /> AI review summary
            </span>
            <Button size="sm" variant="ghost" onClick={loadAi} disabled={aiLoading} className="h-8">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : ai ? <RefreshCw className="h-4 w-4" /> : "Summarise"}
            </Button>
          </div>
          {ai && (
            <div className="mt-2">
              {ai.summary ? (
                <>
                  <p className="text-sm leading-relaxed text-foreground/90">{ai.summary}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    AI-generated from {ai.reviewsSummarized} real review{ai.reviewsSummarized === 1 ? "" : "s"}. Original
                    reviews remain below. Read them for the full picture.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not enough written reviews yet to summarise{ai.reason === "too_few_reviews" ? " (need at least 3)" : ""}.
                </p>
              )}
            </div>
          )}
          {!ai && !aiLoading && (
            <p className="mt-1 text-xs text-muted-foreground">
              Generate a labelled AI summary of the real customer reviews below.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="review-search">
            Search reviews
          </label>
          <input
            id="review-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
            }}
            placeholder="Search reviews"
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger id="review-sort" aria-label="Sort reviews" className="h-9 w-[150px] rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="highest">Highest rated</SelectItem>
              <SelectItem value="lowest">Lowest rated</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => {
              setVerifiedOnly((v) => !v)
              trackPdp("review_filter_used", { productId, filter: "verified" })
            }}
            aria-pressed={verifiedOnly}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
              verifiedOnly ? "border-accent bg-accent/5 text-accent" : "border-input hover:border-muted-foreground",
            )}
          >
            <BadgeCheck className="h-4 w-4" /> Verified only
          </button>
          {(minRating > 0 || verifiedOnly || query) && (
            <button
              type="button"
              onClick={() => {
                setMinRating(0)
                setVerifiedOnly(false)
                setQuery("")
              }}
              className="text-xs text-muted-foreground underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Reviews couldn&apos;t be loaded right now.{" "}
            <button type="button" onClick={loadReviews} className="text-accent underline">
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">No reviews match these filters.</p>
        ) : (
          <ul className="space-y-4">
            {visible.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {r.displayName || "Fádé customer"}
                      {r.verifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] text-moss">
                          <BadgeCheck className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <RatingStars rating={r.rating} showCount={false} size="sm" />
                </div>
                {r.comment && <p className="text-sm leading-relaxed text-foreground/90">{r.comment}</p>}
                <SubBadges review={r} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SubScores({ summary }: { summary: PdpReviewSummary }) {
  const rows = [summary.longevity, summary.sillage, summary.value].filter((m) => m.score != null)
  if (rows.length === 0) return null
  return (
    <div className="space-y-2 border-t border-border pt-4">
      {rows.map((m) => (
        <div key={m.key} className="text-xs">
          <div className="mb-0.5 flex justify-between">
            <span className="text-muted-foreground">{m.label}</span>
            <span className="font-medium">{m.score?.toFixed(1)}/5</span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-secondary">
            <span className="block h-full rounded-full bg-moss" style={{ width: `${((m.score as number) / 5) * 100}%` }} />
          </span>
        </div>
      ))}
    </div>
  )
}

function Histogram({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (entries.length === 0) return null
  const max = Math.max(...entries.map(([, n]) => n))
  return (
    <div className="space-y-1.5 border-t border-border pt-4">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {entries.map(([label, n]) => (
        <div key={label} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 truncate capitalize" title={label}>
            {label}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <span className="block h-full rounded-full bg-accent/70" style={{ width: `${(n / max) * 100}%` }} />
          </span>
          <span className="w-5 text-right text-muted-foreground">{n}</span>
        </div>
      ))}
    </div>
  )
}

function SubBadges({ review }: { review: PdpReview }) {
  const badges: string[] = []
  if (review.longevityRating) badges.push(`Longevity ${review.longevityRating}/5`)
  if (review.sillageRating) badges.push(`Sillage ${review.sillageRating}/5`)
  if (review.valueRating) badges.push(`Value ${review.valueRating}/5`)
  if (review.climate) badges.push(review.climate)
  if (review.occasion) badges.push(review.occasion)
  if (badges.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span key={b} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
          {b}
        </span>
      ))}
    </div>
  )
}
