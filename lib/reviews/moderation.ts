// lib/reviews/moderation.ts
// Pure helpers for the reviews moderation admin. No server-only imports, so it is safe to unit-test
// and to reuse from the admin page. The moderation write path lives in
// app/api/v1/admin/reviews/[id]/route.ts.

import type { ModerationStatus } from "@prisma/client"

export const MODERATION_STATUSES: ModerationStatus[] = ["PENDING", "APPROVED", "REJECTED"]

export const MODERATION_TABS: { label: string; value: ModerationStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
]

/** Coerce an untrusted status query value to a valid ModerationStatus, defaulting to PENDING. */
export function normaliseStatus(raw: string | null | undefined): ModerationStatus {
  const upper = (raw ?? "PENDING").toUpperCase()
  return (MODERATION_STATUSES as string[]).includes(upper)
    ? (upper as ModerationStatus)
    : "PENDING"
}

/** Which moderation actions apply to a review in a given state (never a no-op button). */
export function availableDecisions(status: ModerationStatus): ("approve" | "reject")[] {
  const decisions: ("approve" | "reject")[] = []
  if (status !== "APPROVED") decisions.push("approve")
  if (status !== "REJECTED") decisions.push("reject")
  return decisions
}
