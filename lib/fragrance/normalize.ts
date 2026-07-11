// lib/fragrance/normalize.ts
// PURE ingredient-matching engine. Given a loosely-typed note string from an admin or a legacy
// product row, it resolves the intended library ingredient WITHOUT ever silently rewriting the
// submitted text. Aliases collapse to one canonical entry; misspellings are corrected only as
// suggestions; genuinely unknown notes are flagged, not invented. Fully unit-testable, no I/O.

import { INGREDIENT_LIBRARY } from "./ingredients"
import type { Ingredient, IngredientMatch, ConfidenceLevel } from "./types"

/** Trailing qualifiers that are noise for matching (e.g. "rose absolute" -> "rose"). */
const STRIP_SUFFIXES = [
  "essential oil",
  "absolute",
  "accord",
  "extract",
  "oil",
  "note",
  "notes",
  "co2",
  "resinoid",
]

/**
 * Canonicalise a raw note for comparison: lowercase, strip diacritics and punctuation, collapse
 * whitespace, and drop trailing perfumery qualifiers. Returns "" for empty input. This is used only
 * for MATCHING; the original submitted string is always preserved for display and review.
 */
export function normalizeName(raw: string | null | undefined): string {
  if (!raw) return ""
  let s = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ") // punctuation -> space
    .replace(/\s+/g, " ")
    .trim()
  for (const suf of STRIP_SUFFIXES) {
    if (s.endsWith(" " + suf)) {
      s = s.slice(0, -(suf.length + 1)).trim()
      break
    }
  }
  return s
}

interface IndexEntry {
  ingredient: Ingredient
  /** "canonical" | "alt" | "misspelling" - how this key relates to the ingredient. */
  relation: "canonical" | "alt" | "misspelling"
}

/** Built once at module load. Maps every normalized known key to its ingredient + relation. */
const EXACT_INDEX: Map<string, IndexEntry> = (() => {
  const idx = new Map<string, IndexEntry>()
  const put = (key: string, entry: IndexEntry) => {
    const k = normalizeName(key)
    if (!k) return
    // Canonical wins over alt wins over misspelling if keys collide.
    const existing = idx.get(k)
    if (existing) {
      const rank = { canonical: 3, alt: 2, misspelling: 1 }
      if (rank[existing.relation] >= rank[entry.relation]) return
    }
    idx.set(k, entry)
  }
  for (const ing of INGREDIENT_LIBRARY) {
    put(ing.canonicalName, { ingredient: ing, relation: "canonical" })
    for (const a of ing.altNames) put(a, { ingredient: ing, relation: "alt" })
    for (const m of ing.misspellings) put(m, { ingredient: ing, relation: "misspelling" })
  }
  return idx
})()

/** Classic Levenshtein edit distance. Small strings only; iterative, O(n*m). */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  const curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

/** Fuzzy tolerance scales with word length so short words are not over-corrected. */
function tolerance(len: number): number {
  if (len <= 4) return 1
  if (len <= 8) return 2
  return 3
}

/**
 * Resolve one submitted note to a library ingredient.
 *
 * Order of resolution:
 *  1. exact canonical / alias  -> matched   (high confidence, alias collapses to canonical)
 *  2. exact known misspelling  -> corrected (medium, suggestion carries the canonical name)
 *  3. fuzzy within tolerance   -> corrected (medium/low) or ambiguous when several tie
 *  4. nothing close            -> unknown   (low; never guessed into a match)
 *
 * The `input` field always echoes the raw string verbatim so an admin can see exactly what was typed.
 */
export function matchIngredient(raw: string): IngredientMatch {
  const input = raw
  const norm = normalizeName(raw)
  const base: Omit<IngredientMatch, "status" | "ingredient" | "suggestion" | "candidates" | "confidence"> = {
    input,
  }

  if (!norm) {
    return { ...base, status: "unknown", ingredient: null, suggestion: null, candidates: [], confidence: "low" }
  }

  const exact = EXACT_INDEX.get(norm)
  if (exact) {
    if (exact.relation === "misspelling") {
      return {
        ...base,
        status: "corrected",
        ingredient: exact.ingredient,
        suggestion: exact.ingredient.canonicalName,
        candidates: [],
        confidence: "medium",
      }
    }
    return {
      ...base,
      status: "matched",
      ingredient: exact.ingredient,
      suggestion: null,
      candidates: [],
      confidence: "high",
    }
  }

  // Fuzzy pass across all known keys. Track the best distance per ingredient.
  const tol = tolerance(norm.length)
  let best: { entry: IndexEntry; dist: number } | null = null
  const tied = new Set<string>()
  for (const [key, entry] of EXACT_INDEX) {
    // Skip keys whose length is wildly different, a cheap prune before the O(n*m) distance.
    if (Math.abs(key.length - norm.length) > tol) continue
    const dist = editDistance(norm, key)
    if (dist > tol) continue
    if (!best || dist < best.dist) {
      best = { entry, dist }
      tied.clear()
      tied.add(entry.ingredient.canonicalName)
    } else if (dist === best.dist && entry.ingredient.canonicalName !== best.entry.ingredient.canonicalName) {
      tied.add(entry.ingredient.canonicalName)
    }
  }

  if (best && tied.size > 1) {
    return {
      ...base,
      status: "ambiguous",
      ingredient: null,
      suggestion: null,
      candidates: Array.from(tied).sort(),
      confidence: "low",
    }
  }

  if (best) {
    const confidence: ConfidenceLevel = best.dist === 1 ? "medium" : "low"
    return {
      ...base,
      status: "corrected",
      ingredient: best.entry.ingredient,
      suggestion: best.entry.ingredient.canonicalName,
      candidates: [],
      confidence,
    }
  }

  return { ...base, status: "unknown", ingredient: null, suggestion: null, candidates: [], confidence: "low" }
}

/** Resolve a list of submitted notes. Order is preserved (callers rely on it for prominence). */
export function matchIngredients(raws: string[]): IngredientMatch[] {
  return raws.map(matchIngredient)
}

/**
 * Admin-facing library search. Ranks by name prefix, then substring, then keyword/descriptor hit.
 * Returns approved ingredients only. Empty query returns the whole library (for browse).
 */
export function searchIngredients(query: string, limit = 12): Ingredient[] {
  const q = normalizeName(query)
  if (!q) return INGREDIENT_LIBRARY.slice(0, limit)
  const scored: { ing: Ingredient; score: number }[] = []
  for (const ing of INGREDIENT_LIBRARY) {
    if (ing.approval !== "approved") continue
    const name = normalizeName(ing.displayName)
    let score = 0
    if (name === q) score = 100
    else if (name.startsWith(q)) score = 80
    else if (name.includes(q)) score = 60
    else if (ing.altNames.some((a) => normalizeName(a).includes(q))) score = 50
    else if (ing.searchKeywords.some((k) => normalizeName(k).includes(q))) score = 35
    else if (ing.descriptors.some((d) => normalizeName(d).includes(q))) score = 25
    else if (editDistance(name, q) <= tolerance(q.length)) score = 15
    if (score > 0) scored.push({ ing, score })
  }
  scored.sort((a, b) => b.score - a.score || a.ing.displayName.localeCompare(b.ing.displayName))
  return scored.slice(0, limit).map((s) => s.ing)
}
