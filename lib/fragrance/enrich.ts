// lib/fragrance/enrich.ts
// The deterministic enrichment pipeline. Given a product's REAL submitted fragrance data it produces
// a complete, reviewable ScentComposition: matched ingredients, perceived (never chemical) prominence,
// a scent-development timeline, a recommended visual template, cautious plain-language copy, and
// inferred climate/occasion tags with honest provenance. It NEVER invents notes and NEVER attributes
// an inferred value to the manufacturer. An optional AI provider can enrich copy later, but the
// system ships fully functional without any external credential (see docs/SCENT_INTELLIGENCE.md).

import { matchIngredients } from "./normalize"
import { getIngredient } from "./ingredients"
import type {
  ScentComposition,
  CompositionNote,
  AccordProminence,
  ProminenceLabel,
  TimelineStage,
  TemplateId,
  NoteTier,
  EnrichmentIssue,
  ConfidenceLevel,
  IngredientFamily,
  SourcedField,
} from "./types"

/** Everything the pipeline needs. All strings are the raw, submitted values (never pre-cleaned). */
export interface EnrichmentInput {
  top: string[]
  heart: string[]
  base: string[]
  accords: string[]
  family: string | null
  olfactoryDesc: string | null
  moods: string[]
  season: string | null
  climate: string | null
  timeOfDay: string | null
  occasion: string | null
  /** Whether the source declares the brand supplied the note list (affects provenance labels). */
  brandProvidedNotes?: boolean
}

const METHOD = "rule-based:v1"

/** Map an ordinal position within a same-tier list to a perceived-prominence band. */
function labelFromOrder(order: number, count: number): ProminenceLabel {
  if (count <= 1) return "prominent"
  const pos = order / (count - 1)
  if (pos === 0) return "very_prominent"
  if (pos <= 0.34) return "prominent"
  if (pos <= 0.67) return "moderate"
  if (pos < 1) return "soft"
  return count >= 5 ? "trace" : "soft"
}

/** Default family colour when an accord does not resolve to a known ingredient. */
const FAMILY_COLOR: Record<IngredientFamily, string> = {
  citrus: "#c7b24a",
  floral: "#c06079",
  woody: "#9c7b4f",
  amber: "#c8862b",
  spicy: "#c96a2b",
  gourmand: "#a9743e",
  green: "#5f6b3f",
  fruity: "#e6a06a",
  aromatic: "#8a86c0",
  animalic: "#6a4a35",
  resinous: "#8f8577",
  aquatic: "#4f8fa0",
  powdery: "#b7aecb",
  smoky: "#6f665c",
}

function familyKey(family: string | null): IngredientFamily | null {
  if (!family) return null
  const f = family.toLowerCase().trim()
  const map: Record<string, IngredientFamily> = {
    citrus: "citrus",
    fresh: "aquatic",
    floral: "floral",
    woody: "woody",
    oriental: "amber",
    amber: "amber",
    spicy: "spicy",
    gourmand: "gourmand",
    green: "green",
    fruity: "fruity",
    aromatic: "aromatic",
  }
  return map[f] ?? null
}

/** Build composition notes for one tier, with per-tier perceived prominence. */
function buildTierNotes(raws: string[], tier: NoteTier): CompositionNote[] {
  const matches = matchIngredients(raws)
  const count = matches.length
  return matches.map((match, order) => ({
    tier,
    match,
    prominence: labelFromOrder(order, count),
    order,
  }))
}

/**
 * Rank accords and assign a perceived-prominence score (0..100) + band label. The score encodes RANK
 * ORDER, not a laboratory formulation percentage; the UI labels it "Perceived scent prominence" and
 * explains the distinction. Strongest is 100, weakest floored at a legible 45.
 */
function buildAccords(raws: string[]): AccordProminence[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const r of raws) {
    const v = r.trim()
    if (!v) continue
    const key = v.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(v)
  }
  const n = names.length
  if (n === 0) return []
  return names.map((name, i) => {
    const score = n === 1 ? 100 : Math.round(100 - (i / (n - 1)) * 55)
    const label: ProminenceLabel =
      score >= 80 ? "very_prominent" : score >= 60 ? "prominent" : score >= 40 ? "moderate" : score >= 20 ? "soft" : "trace"
    const matched = getIngredient(name.toLowerCase())
    const fam = matched?.family ?? null
    const color = matched?.color ?? (fam ? FAMILY_COLOR[fam] : "#b08d6a")
    return {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      rank: i + 1,
      label,
      score,
      color,
    }
  })
}

/** Display name for a note: the resolved ingredient's name when matched, else the raw input. */
function noteDisplay(note: CompositionNote): string {
  return note.match.ingredient?.displayName ?? note.match.input.trim()
}

/** Five-stage scent-development timeline, built only from the product's real notes. */
function buildTimeline(top: CompositionNote[], heart: CompositionNote[], base: CompositionNote[]): TimelineStage[] {
  const t = top.map(noteDisplay)
  const h = heart.map(noteDisplay)
  const b = base.map(noteDisplay)
  if (!t.length && !h.length && !b.length) return []
  const stages: TimelineStage[] = [
    {
      key: "opening",
      label: "Opening",
      window: "0-15 min",
      notes: t.length ? t : h,
      impression: t.length
        ? "The first spray: the brightest, most volatile notes lead."
        : "The opening, as the heart lifts first.",
      intensity: 1,
    },
    {
      key: "early_heart",
      label: "Early heart",
      window: "15-45 min",
      notes: h.length ? h : [...t, ...b].slice(0, 3),
      impression: "Top notes fade and the heart begins to emerge.",
      intensity: 0.85,
    },
    {
      key: "main_heart",
      label: "Main heart",
      window: "1-3 hrs",
      notes: h.length ? h : b.length ? b : t,
      impression: "The character you wear for most of the day settles in.",
      intensity: 0.65,
    },
    {
      key: "dry_down",
      label: "Dry-down",
      window: "3-6 hrs",
      notes: b.length ? b : h,
      impression: "The heart melts into the base; the scent sits closer to skin.",
      intensity: 0.45,
    },
    {
      key: "late_dry_down",
      label: "Late dry-down",
      window: "6 hrs +",
      notes: b.length ? b.slice(0, 3) : h,
      impression: "The lasting signature that lingers on skin and fabric.",
      intensity: 0.3,
    },
  ]
  return stages.filter((s) => s.notes.length > 0)
}

/** Cautious plain-language explanation from ONLY approved fields. null lines are hidden by the UI. */
function buildExplanation(input: EnrichmentInput, top: CompositionNote[], heart: CompositionNote[], base: CompositionNote[]) {
  const list = (xs: CompositionNote[]) => xs.slice(0, 4).map(noteDisplay).join(", ")
  return {
    summary: input.olfactoryDesc?.trim() || null,
    opening: top.length ? `Opens with ${list(top)}.` : null,
    heart: heart.length ? `The heart turns to ${list(heart)}.` : null,
    dryDown: base.length ? `Dries down to ${list(base)}.` : null,
    mood: input.moods.length ? input.moods.join(" · ") : null,
  }
}

/** Infer climate guidance tags from family, then fold in any brand/editorial-provided values. */
function inferClimate(input: EnrichmentInput): SourcedField<string[]> {
  const fam = familyKey(input.family)
  const byFamily: Record<IngredientFamily, string[]> = {
    citrus: ["Hot and humid", "Daytime"],
    aquatic: ["Hot and humid", "Daytime"],
    green: ["Warm", "Daytime"],
    aromatic: ["Temperate", "Versatile"],
    floral: ["Temperate", "Warm"],
    fruity: ["Warm", "Daytime"],
    woody: ["Cool and dry", "Evening"],
    amber: ["Cool and dry", "Evening"],
    spicy: ["Cool evenings", "Harmattan"],
    gourmand: ["Cool and dry", "Evening"],
    resinous: ["Cool evenings", "Evening"],
    animalic: ["Cool and dry", "Evening"],
    powdery: ["Temperate", "Versatile"],
    smoky: ["Cool evenings", "Evening"],
  }
  const provided = [input.climate, input.season, input.timeOfDay].filter((x): x is string => !!x && !!x.trim()).map((x) => x.trim())
  if (provided.length) {
    return sourced(dedupe(provided), "editorial", "high")
  }
  const inferred = fam ? byFamily[fam] : []
  return sourced(inferred, "inferred", inferred.length ? "medium" : "low")
}

/** Infer occasion guidance tags from family, then fold in any provided occasion value. */
function inferOccasion(input: EnrichmentInput): SourcedField<string[]> {
  const fam = familyKey(input.family)
  const byFamily: Record<IngredientFamily, string[]> = {
    citrus: ["Everyday", "Office"],
    aquatic: ["Everyday", "Sport"],
    green: ["Everyday", "Daytime"],
    aromatic: ["Office", "Everyday"],
    floral: ["Everyday", "Romantic"],
    fruity: ["Everyday", "Casual"],
    woody: ["Evening", "Formal"],
    amber: ["Evening", "Special occasion"],
    spicy: ["Evening", "Formal"],
    gourmand: ["Evening", "Date"],
    resinous: ["Evening", "Special occasion"],
    animalic: ["Evening", "Date"],
    powdery: ["Office", "Romantic"],
    smoky: ["Evening", "Formal"],
  }
  const provided = input.occasion?.trim() ? dedupe(input.occasion.split(/[,/]/).map((s) => s.trim()).filter(Boolean)) : []
  if (provided.length) return sourced(provided, "editorial", "high")
  const inferred = fam ? byFamily[fam] : []
  return sourced(inferred, "inferred", inferred.length ? "medium" : "low")
}

function sourced<T>(value: T, source: SourcedField<T>["source"], confidence: ConfidenceLevel): SourcedField<T> {
  return { value, source, confidence, generatedAt: new Date().toISOString(), method: METHOD, approval: "pending_review" }
}

function dedupe(xs: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const x of xs) {
    const k = x.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(x)
  }
  return out
}

/**
 * Recommend the visual template. The educational grid is the safe default and the mobile /
 * reduced-motion fallback. Dense compositions and woody/amber/gourmand profiles favour the immersive
 * environment; sparse, accord-led profiles favour the spotlight; otherwise the cinematic vertical.
 */
function recommendTemplate(input: EnrichmentInput, noteCount: number, accordCount: number): TemplateId {
  const fam = familyKey(input.family)
  if (noteCount === 0) return "educational_grid"
  if (noteCount > 12) return "educational_grid"
  const immersiveFamilies: (IngredientFamily | null)[] = ["woody", "amber", "gourmand", "resinous", "animalic", "smoky"]
  if (immersiveFamilies.includes(fam) && noteCount >= 4) return "ingredient_environment"
  if (noteCount <= 4 && accordCount >= 3) return "accord_spotlight"
  return "vertical_note"
}

/** Overall confidence: high only when notes resolve cleanly; degrades with unknown/ambiguous notes. */
function overallConfidence(notes: CompositionNote[], hasAccords: boolean): ConfidenceLevel {
  if (notes.length === 0) return "low"
  const unresolved = notes.filter((n) => n.match.status === "unknown" || n.match.status === "ambiguous").length
  const corrected = notes.filter((n) => n.match.status === "corrected").length
  const ratioBad = (unresolved + corrected * 0.5) / notes.length
  if (unresolved === 0 && corrected === 0 && hasAccords) return "high"
  if (ratioBad < 0.25) return "medium"
  return "low"
}

/**
 * Run the complete enrichment. Deterministic and side-effect-free apart from reading `Date.now()` for
 * generation timestamps. Returns a ready-to-review ScentComposition. Nothing here is published; the
 * admin approves the draft separately.
 */
export function enrichComposition(input: EnrichmentInput): ScentComposition {
  const top = buildTierNotes(input.top, "top")
  const heart = buildTierNotes(input.heart, "heart")
  const base = buildTierNotes(input.base, "base")
  const notes = [...top, ...heart, ...base]

  const accords = buildAccords(input.accords)
  const timeline = buildTimeline(top, heart, base)
  const explanation = buildExplanation(input, top, heart, base)
  const climateTags = inferClimate(input)
  const occasionTags = inferOccasion(input)

  // Gallery: distinct ingredients (or distinct raw inputs when unmatched), preserving tier order.
  const galleryKeys = new Set<string>()
  const gallery: CompositionNote[] = []
  for (const note of notes) {
    const key = note.match.ingredient?.canonicalName ?? note.match.input.trim().toLowerCase()
    if (galleryKeys.has(key)) continue
    galleryKeys.add(key)
    gallery.push(note)
  }

  // Issues for the admin review queue. Suggestions are never auto-applied.
  const issues: EnrichmentIssue[] = []
  for (const note of notes) {
    const m = note.match
    if (m.status === "unknown") {
      issues.push({
        kind: "unknown_note",
        message: `"${m.input}" is not in the ingredient library. Add it to the library or correct the spelling.`,
        subject: m.input,
        suggestion: null,
      })
    } else if (m.status === "corrected") {
      issues.push({
        kind: "possible_misspelling",
        message: `"${m.input}" was read as "${m.ingredient?.displayName}". Confirm or correct.`,
        subject: m.input,
        suggestion: m.suggestion,
      })
    } else if (m.status === "ambiguous") {
      issues.push({
        kind: "ambiguous_note",
        message: `"${m.input}" could be ${m.candidates.join(" or ")}. Pick one.`,
        subject: m.input,
        suggestion: m.candidates[0] ?? null,
      })
    }
  }
  if (notes.length > 0 && accords.length === 0) {
    issues.push({
      kind: "missing_accords",
      message: "No main accords were provided. Add accords or generate a suggestion for the character section.",
      subject: null,
      suggestion: null,
    })
  }

  const confidence = overallConfidence(notes, accords.length > 0)
  const lowFields = climateTags.confidence === "low" || occasionTags.confidence === "low"
  const requiresManualReview =
    confidence === "low" || issues.some((i) => i.kind === "unknown_note" || i.kind === "ambiguous_note") || lowFields
  if (requiresManualReview && !issues.some((i) => i.kind === "low_confidence")) {
    issues.push({
      kind: "low_confidence",
      message: "Parts of this scent story are low confidence. Review before publishing.",
      subject: null,
      suggestion: null,
    })
  }

  return {
    notes,
    accords,
    timeline,
    gallery,
    recommendedTemplate: recommendTemplate(input, notes.length, accords.length),
    selectedTemplate: null,
    explanation,
    climateTags,
    occasionTags,
    issues,
    requiresManualReview,
    confidence,
    meta: { generatedAt: new Date().toISOString(), method: METHOD },
  }
}

/** Human-facing label for a prominence band. */
export const PROMINENCE_LABEL: Record<ProminenceLabel, string> = {
  very_prominent: "Very prominent",
  prominent: "Prominent",
  moderate: "Moderate",
  soft: "Soft",
  trace: "Trace",
}

/** The tooltip shown wherever a numeric prominence score appears. */
export const PROMINENCE_DISCLAIMER =
  "This score represents perceived scent character, not the perfume's chemical formulation."
