import Link from "next/link"
import type { ModerationStatus } from "@prisma/client"
import { Star, ShieldAlert } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions"
import { MODERATION_TABS as TABS, normaliseStatus } from "@/lib/reviews/moderation"

export const dynamic = "force-dynamic"

interface AdminReviewsPageProps {
  searchParams?: Promise<{ status?: string }>
}

function formatWhen(value: Date): string {
  const iso = value.toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`
}

function Stars({ rating }: { rating: number }) {
  const safe = Math.max(0, Math.min(5, rating))
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${safe} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < safe ? "fill-warning text-warning" : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  )
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const params = (await searchParams) ?? {}
  const status = normaliseStatus(params.status)

  let reviews: Array<{
    id: string
    rating: number
    comment: string | null
    verifiedPurchase: boolean
    reportedCount: number
    createdAt: Date
    moderationStatus: ModerationStatus
    displayName: string | null
    product: { name: string; slug: string } | null
    user: { name: string | null; email: string } | null
  }> = []
  let counts: Record<ModerationStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 }
  let loadError = false

  try {
    const [rows, grouped] = await Promise.all([
      prisma.review.findMany({
        where: { moderationStatus: status },
        orderBy: [{ reportedCount: "desc" }, { createdAt: "desc" }],
        take: 100,
        select: {
          id: true,
          rating: true,
          comment: true,
          verifiedPurchase: true,
          reportedCount: true,
          createdAt: true,
          moderationStatus: true,
          displayName: true,
          product: { select: { name: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.review.groupBy({ by: ["moderationStatus"], _count: { _all: true } }),
    ])
    reviews = rows
    for (const g of grouped) {
      counts[g.moderationStatus] = g._count._all
    }
  } catch {
    loadError = true
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">
          Moderate customer reviews. Approved reviews appear on the product page; rejected reviews
          stay hidden. Every decision is recorded in the audit log.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.value === status
          return (
            <Link
              key={tab.value}
              href={`/admin/reviews?status=${tab.value}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {counts[tab.value]}
              </span>
            </Link>
          )
        })}
      </div>

      {loadError ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Reviews could not be loaded. The reviews table may not exist in this environment yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Review</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead className="whitespace-nowrap">Submitted</TableHead>
                  <TableHead className="text-right">Moderate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No {status.toLowerCase()} reviews.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="max-w-md align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <Stars rating={review.rating} />
                          {review.verifiedPurchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                          {review.reportedCount > 0 && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-destructive/40 text-xs text-destructive"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              {review.reportedCount} reported
                            </Badge>
                          )}
                        </div>
                        {review.comment ? (
                          <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="mt-1.5 text-sm italic text-muted-foreground">
                            (no written comment)
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        {review.product ? (
                          <Link
                            href={`/product/${review.product.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {review.product.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">unknown</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        <span className="block">
                          {review.displayName || review.user?.name || "Anonymous"}
                        </span>
                        {review.user?.email && (
                          <span className="block font-mono text-xs text-muted-foreground">
                            {review.user.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top font-mono text-xs text-muted-foreground">
                        {formatWhen(review.createdAt)}
                      </TableCell>
                      <TableCell className="align-top">
                        <ReviewModerationActions
                          reviewId={review.id}
                          status={review.moderationStatus}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
