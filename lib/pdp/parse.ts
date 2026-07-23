// lib/pdp/parse.ts
// PURE, side-effect-free helpers for the PDP. No Prisma, no fetch, safe to unit-test in isolation.
// These convert loose backend strings (comma-separated notes/accords, size labels) into typed,
// display-ready structures WITHOUT inventing any information.

import type {
  PdpNote,
  PdpAccord,
  PdpTimelineStage,
  Provenance,
} from "./types"

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  BRAND: "Brand-provided",
  EDITORIAL: "Fádé editorial",
  CUSTOMER_AGGREGATE: "Verified customers",
}

/** Turn "amber, Vanilla ,, oud" into a de-duped, trimmed list. Empty in => []. */
export function splitList(raw: string | null | undefined): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(",")) {
    const v = part.trim()
    if (!v) continue
    const key = v.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(v)
  }
  return out
}

/** URL-safe slug for note/accord exploration links. */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function toNotes(raw: string | null | undefined): PdpNote[] {
  return splitList(raw).map((name) => ({ name, slug: toSlug(name) }))
}

/**
 * Rank accords by their listed order (backend lists strongest-first) and derive a *proportional*
 * strength for the bar widths. This is a visual ranking, NOT a fabricated lab percentage, the
 * strongest accord is full width and each subsequent one steps down evenly.
 */
export function toAccords(raw: string | null | undefined): PdpAccord[] {
  const names = splitList(raw)
  const n = names.length
  if (n === 0) return []
  return names.map((name, i) => {
    const rank = i + 1
    // strongest = 1.0, weakest floored at 0.35 so bars stay legible; even steps between.
    const strength = n === 1 ? 1 : 1 - (i / (n - 1)) * 0.65
    return { name, slug: toSlug(name), rank, strength: Math.round(strength * 100) / 100 }
  })
}

/** Parse the ml count out of a size label like "100ml" / "100 mL" / "2ml sample". null when absent. */
export function parseMl(size: string | null | undefined): number | null {
  if (!size) return null
  const m = size.match(/(\d+(?:\.\d+)?)\s*ml/i)
  if (!m) return null
  const ml = Number(m[1])
  return Number.isFinite(ml) && ml > 0 ? ml : null
}

/** Whole-naira price per ml (rounded), or null when size isn't parseable. */
export function pricePerMl(priceNGN: number, size: string | null | undefined): number | null {
  const ml = parseMl(size)
  if (!ml) return null
  return Math.round(priceNGN / ml)
}

/**
 * Derive the discrete stock state used across the purchase panel and cards. `lowThreshold`
 * controls the "only N left" band. Preorder/waitlist take precedence over raw counts.
 */
export function stockState(
  stock: number,
  opts: { isPreorder?: boolean; isWaitlist?: boolean; lowThreshold?: number } = {},
): "in_stock" | "low_stock" | "out_of_stock" | "preorder" | "waitlist" {
  const { isPreorder, isWaitlist, lowThreshold = 5 } = opts
  if (stock <= 0) {
    if (isPreorder) return "preorder"
    if (isWaitlist) return "waitlist"
    return "out_of_stock"
  }
  if (stock <= lowThreshold) return "low_stock"
  return "in_stock"
}

/** Percentage off, or null when there is no genuine higher compare-at price. Never fabricated. */
export function discountPct(priceNGN: number, compareAtNGN: number | null | undefined): number | null {
  if (!compareAtNGN || compareAtNGN <= priceNGN) return null
  return Math.round(((compareAtNGN - priceNGN) / compareAtNGN) * 100)
}

/**
 * Build the "How it wears" timeline from real note structure. This is clearly editorial guidance
 * (labelled as such in the UI). It reuses only the product's actual notes; it never invents notes.
 * Returns [] when there is not enough note data to say anything meaningful.
 */
export function buildTimeline(
  top: string[],
  heart: string[],
  base: string[],
): PdpTimelineStage[] {
  const anyNotes = top.length || heart.length || base.length
  if (!anyNotes) return []
  const stages: PdpTimelineStage[] = [
    {
      key: "open",
      label: "First spray",
      window: "0–15 min",
      notes: top.length ? top : heart,
      impression: top.length
        ? "The opening: brightest and most volatile notes lead."
        : "The opening as the heart lifts first.",
      intensity: 1,
    },
    {
      key: "early",
      label: "Settling",
      window: "15 min – 2 hrs",
      notes: heart.length ? heart : [...top, ...base].slice(0, 3),
      impression: "Top notes fade and the heart takes over, the character you'll wear most.",
      intensity: 0.8,
    },
    {
      key: "mid",
      label: "Heart of wear",
      window: "2 – 6 hrs",
      notes: base.length ? [...heart, ...base].slice(0, 3) : heart,
      impression: "The heart melts into the base; the scent sits closer to the skin.",
      intensity: 0.55,
    },
    {
      key: "dry",
      label: "Dry-down",
      window: "6 hrs +",
      notes: base.length ? base : heart,
      impression: "The lasting base: the signature that lingers on skin and fabric.",
      intensity: 0.35,
    },
  ]
  // Drop stages that ended up with no notes at all.
  return stages.filter((s) => s.notes.length > 0)
}

/**
 * Compose a cautious, plain-language scent story from ONLY approved fields. Any field that is absent
 * yields `null` for that line (the UI hides null lines). Nothing is invented.
 */
export function buildScentStory(input: {
  olfactoryDesc: string | null
  family: string | null
  top: string[]
  heart: string[]
  base: string[]
  moods: string[]
}): {
  summary: string | null
  opening: string | null
  heart: string | null
  dryDown: string | null
  mood: string | null
} {
  const list = (xs: string[]) => xs.slice(0, 4).join(", ")
  return {
    summary: input.olfactoryDesc?.trim() || null,
    opening: input.top.length ? `Opens with ${list(input.top)}.` : null,
    heart: input.heart.length ? `The heart turns to ${list(input.heart)}.` : null,
    dryDown: input.base.length ? `Dries down to ${list(input.base)}.` : null,
    mood: input.moods.length ? input.moods.join(" · ") : null,
  }
}
