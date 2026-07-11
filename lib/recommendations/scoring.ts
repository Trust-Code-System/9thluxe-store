// lib/recommendations/scoring.ts
// Pure, deterministic scoring for the hybrid recommendation engine. Retrieval + hard filtering
// happen upstream (search provider); this only RANKS an already-validated candidate set. It never
// invents products and never overrides hard constraints. Merchandising weight is explicit and
// labelled so it can be disclosed, never disguised as pure personalization.

export interface Candidate {
  id: string
  priceNGN: number
  inStock: boolean
  fragranceFamily: string | null
  notes: string[] // normalized lowercase notes (top+heart+base)
  occasion: string | null
  climate: string | null
  intensity: string | null
  longevity: string | null
  sampleAvailable: boolean
  merchandisingWeight?: number // 0..1, explicit boost; recorded internally
}

export interface Constraints {
  budgetMaxNGN?: number | null
  family?: string | null
  includeNotes?: string[]
  excludeNotes?: string[]
  occasion?: string | null
  climate?: string | null
  intensity?: string | null
  longevity?: string | null
  preferSample?: boolean
  /** Ids the customer already owns/tried; diversify away from these. */
  ownedIds?: string[]
}

export interface ScoreBreakdown {
  id: string
  score: number
  reasons: string[]
  /** True if a hard constraint is violated; such candidates must be excluded, not just ranked low. */
  disqualified: boolean
  merchandisingApplied: boolean
}

const norm = (s: string) => s.trim().toLowerCase()

export function scoreCandidate(c: Candidate, k: Constraints): ScoreBreakdown {
  const reasons: string[] = []
  let score = 0
  let disqualified = false

  // --- Hard constraints (disqualify) ---
  if (!c.inStock && !k.preferSample) {
    disqualified = true
    reasons.push('out_of_stock')
  }
  if (typeof k.budgetMaxNGN === 'number' && c.priceNGN > k.budgetMaxNGN) {
    disqualified = true
    reasons.push('over_budget')
  }
  const candidateNotes = new Set(c.notes.map(norm))
  for (const ex of k.excludeNotes ?? []) {
    if (candidateNotes.has(norm(ex))) {
      disqualified = true
      reasons.push(`excluded_note:${norm(ex)}`)
    }
  }

  // --- Soft scoring ---
  if (k.family && c.fragranceFamily && norm(k.family) === norm(c.fragranceFamily)) {
    score += 30
    reasons.push('family_match')
  }
  let noteHits = 0
  for (const inc of k.includeNotes ?? []) {
    if (candidateNotes.has(norm(inc))) noteHits++
  }
  if (noteHits > 0) {
    score += Math.min(noteHits * 15, 45)
    reasons.push(`note_match:${noteHits}`)
  }
  if (k.occasion && c.occasion && norm(c.occasion).includes(norm(k.occasion))) {
    score += 10
    reasons.push('occasion_match')
  }
  if (k.climate && c.climate && norm(c.climate).includes(norm(k.climate))) {
    score += 10
    reasons.push('climate_match')
  }
  if (k.intensity && c.intensity && norm(k.intensity) === norm(c.intensity)) {
    score += 8
    reasons.push('intensity_match')
  }
  if (k.longevity && c.longevity && norm(k.longevity) === norm(c.longevity)) {
    score += 8
    reasons.push('longevity_match')
  }
  if (typeof k.budgetMaxNGN === 'number' && c.priceNGN <= k.budgetMaxNGN) {
    // reward budget headroom modestly (closer-to-budget is fine, cheaper is a small plus)
    score += 5
    reasons.push('budget_fit')
  }
  if (k.preferSample && c.sampleAvailable) {
    score += 12
    reasons.push('sample_available')
  }
  if ((k.ownedIds ?? []).includes(c.id)) {
    score -= 20
    reasons.push('already_owned_penalty')
  }

  // --- Merchandising (explicit, labelled) ---
  let merchandisingApplied = false
  if (c.merchandisingWeight && c.merchandisingWeight > 0) {
    score += Math.round(c.merchandisingWeight * 10)
    merchandisingApplied = true
    reasons.push('merchandising_weight')
  }

  return { id: c.id, score, reasons, disqualified, merchandisingApplied }
}

/** Rank candidates: drop disqualified, sort by score desc, stable by id. */
export function rankCandidates(candidates: Candidate[], k: Constraints): ScoreBreakdown[] {
  return candidates
    .map((c) => scoreCandidate(c, k))
    .filter((s) => !s.disqualified)
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1))
}
