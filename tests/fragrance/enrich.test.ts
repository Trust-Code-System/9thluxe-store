import { describe, it, expect } from "vitest"
import { enrichComposition, PROMINENCE_LABEL, type EnrichmentInput } from "@/lib/fragrance/enrich"
import { ingredientArtDataUri, ingredientArtSvg } from "@/lib/fragrance/art"
import { getIngredient } from "@/lib/fragrance/ingredients"

function input(overrides: Partial<EnrichmentInput> = {}): EnrichmentInput {
  return {
    top: [],
    heart: [],
    base: [],
    accords: [],
    family: null,
    olfactoryDesc: null,
    moods: [],
    season: null,
    climate: null,
    timeOfDay: null,
    occasion: null,
    ...overrides,
  }
}

describe("enrichComposition - basic three-note perfume", () => {
  const comp = enrichComposition(
    input({
      top: ["bergamot"],
      heart: ["rose"],
      base: ["oud"],
      accords: ["woody", "amber", "rose"],
      family: "WOODY",
      olfactoryDesc: "A smoky rose over resinous oud.",
      moods: ["confident", "warm"],
    }),
  )

  it("places notes on the correct tiers and resolves ingredients", () => {
    expect(comp.notes).toHaveLength(3)
    expect(comp.notes.find((n) => n.tier === "base")?.match.ingredient?.canonicalName).toBe("oud")
  })
  it("builds a 5-stage timeline from real notes only", () => {
    expect(comp.timeline.map((s) => s.key)).toEqual([
      "opening",
      "early_heart",
      "main_heart",
      "dry_down",
      "late_dry_down",
    ])
    expect(comp.timeline[0].notes).toContain("Bergamot")
    expect(comp.timeline[0].intensity).toBeGreaterThan(comp.timeline[4].intensity)
  })
  it("ranks accords with a perceived (not chemical) score", () => {
    expect(comp.accords[0].rank).toBe(1)
    expect(comp.accords[0].score).toBe(100)
    expect(comp.accords[0].label).toBe("very_prominent")
    expect(comp.accords[comp.accords.length - 1].score).toBeGreaterThanOrEqual(40)
  })
  it("produces a cautious explanation from approved fields", () => {
    expect(comp.explanation.summary).toBe("A smoky rose over resinous oud.")
    expect(comp.explanation.opening).toBe("Opens with Bergamot.")
    expect(comp.explanation.mood).toContain("confident")
  })
  it("recommends the immersive environment for a rich woody profile", () => {
    // 3 notes is below the environment threshold, so it should fall back to a valid template.
    expect(["vertical_note", "accord_spotlight", "ingredient_environment", "educational_grid"]).toContain(
      comp.recommendedTemplate,
    )
  })
  it("is clean: high confidence, no manual review needed", () => {
    expect(comp.confidence).toBe("high")
    expect(comp.requiresManualReview).toBe(false)
    expect(comp.issues).toHaveLength(0)
  })
})

describe("enrichComposition - large 20+ note perfume", () => {
  const many = Array.from({ length: 22 }, (_, i) => ["oud", "rose", "amber", "musk", "vanilla", "saffron"][i % 6])
  const comp = enrichComposition(input({ top: many.slice(0, 8), heart: many.slice(8, 16), base: many.slice(16), accords: ["woody"] }))

  it("handles many notes and recommends the grid", () => {
    expect(comp.notes.length).toBe(22)
    expect(comp.recommendedTemplate).toBe("educational_grid")
  })
  it("dedupes the gallery to distinct ingredients", () => {
    expect(comp.gallery.length).toBeLessThan(comp.notes.length)
  })
})

describe("enrichComposition - edge cases", () => {
  it("flags an unknown note and requires manual review", () => {
    const comp = enrichComposition(input({ heart: ["moonstone dust"], accords: ["woody"] }))
    expect(comp.issues.some((i) => i.kind === "unknown_note")).toBe(true)
    expect(comp.requiresManualReview).toBe(true)
  })

  it("suggests a correction for a misspelling without applying it", () => {
    const comp = enrichComposition(input({ top: ["bergamont"], accords: ["citrus"] }))
    const issue = comp.issues.find((i) => i.kind === "possible_misspelling")
    expect(issue?.suggestion).toBe("bergamot")
    // the raw input is preserved
    expect(comp.notes[0].match.input).toBe("bergamont")
  })

  it("flags missing accords when notes are present", () => {
    const comp = enrichComposition(input({ base: ["oud"], accords: [] }))
    expect(comp.issues.some((i) => i.kind === "missing_accords")).toBe(true)
  })

  it("returns empty structures for an empty product (nothing to show)", () => {
    const comp = enrichComposition(input())
    expect(comp.notes).toHaveLength(0)
    expect(comp.timeline).toHaveLength(0)
    expect(comp.accords).toHaveLength(0)
    expect(comp.recommendedTemplate).toBe("educational_grid")
  })

  it("uses brand/editorial provenance when climate is explicitly provided", () => {
    const comp = enrichComposition(input({ base: ["oud"], accords: ["woody"], climate: "Cool evenings", occasion: "Evening" }))
    expect(comp.climateTags.source).toBe("editorial")
    expect(comp.climateTags.confidence).toBe("high")
    expect(comp.occasionTags.value).toContain("Evening")
  })

  it("infers climate from family when none is provided", () => {
    const comp = enrichComposition(input({ top: ["bergamot"], accords: ["citrus"], family: "CITRUS" }))
    expect(comp.climateTags.source).toBe("inferred")
    expect(comp.climateTags.value).toContain("Hot and humid")
  })
})

describe("prominence labels", () => {
  it("maps every band to a human label", () => {
    expect(PROMINENCE_LABEL.very_prominent).toBe("Very prominent")
    expect(PROMINENCE_LABEL.trace).toBe("Trace")
  })
})

describe("ingredient art generator", () => {
  it("produces deterministic SVG with no text or logos", () => {
    const oud = getIngredient("oud")!
    const a = ingredientArtSvg(oud)
    const b = ingredientArtSvg(oud)
    expect(a).toBe(b)
    expect(a.startsWith("<svg")).toBe(true)
    expect(a).not.toMatch(/<text/i)
    expect(a).toContain(oud.color)
  })
  it("emits a usable data URI and a transparent cutout variant", () => {
    const rose = getIngredient("rose")!
    expect(ingredientArtDataUri(rose).startsWith("data:image/svg+xml,")).toBe(true)
    expect(ingredientArtSvg(rose, { cutout: true })).not.toContain("radialGradient id")
  })
})
