import { describe, expect, it } from "vitest"

import { buildHeroData, type HeroProductInput } from "@/lib/hero/select"

function baseProduct(overrides: Partial<HeroProductInput> = {}): HeroProductInput {
  return {
    id: "p1",
    name: "Nocturne",
    slug: "nocturne-eau-de-parfum",
    brand: "Fádé",
    images: ["/products/nocturne.jpg"],
    notesTop: "Bergamot, Pink Pepper",
    notesHeart: "Rose, Jasmine",
    notesBase: "Oud, Incense",
    concentration: "EDP",
    publishStatus: "PUBLISHED",
    deletedAt: null,
    isFeatured: true,
    stock: 12,
    isPreorder: false,
    isWaitlist: false,
    dropDate: null,
    ...overrides,
  }
}

describe("buildHeroData eligibility", () => {
  it("returns null for a missing product", () => {
    expect(buildHeroData(null)).toBeNull()
  })

  it("returns null for a soft-deleted product", () => {
    expect(buildHeroData(baseProduct({ deletedAt: new Date() }))).toBeNull()
  })

  it("returns null when not published", () => {
    expect(buildHeroData(baseProduct({ publishStatus: "DRAFT" }))).toBeNull()
  })

  it("returns null when not featured", () => {
    expect(buildHeroData(baseProduct({ isFeatured: false }))).toBeNull()
  })

  it("returns null when there is no merchant-owned image", () => {
    expect(buildHeroData(baseProduct({ images: [] }))).toBeNull()
    expect(buildHeroData(baseProduct({ images: null }))).toBeNull()
  })
})

describe("buildHeroData mapping", () => {
  it("resolves an eligible product into hero data", () => {
    const hero = buildHeroData(baseProduct())
    expect(hero).not.toBeNull()
    expect(hero!.product.slug).toBe("nocturne-eau-de-parfum")
    expect(hero!.product.image).toBe("/products/nocturne.jpg")
    expect(hero!.product.alt).toContain("Nocturne")
    expect(hero!.product.availability).toBe("available")
    expect(hero!.status).toBe("approved")
  })

  it("maps approved notes to falling ingredient assets grouped by tier", () => {
    const hero = buildHeroData(baseProduct())!
    expect(hero.arrangement.top.map((a) => a.id)).toContain("bergamot")
    expect(hero.arrangement.heart.map((a) => a.id)).toEqual(
      expect.arrayContaining(["rose", "jasmine"]),
    )
    expect(hero.arrangement.base.map((a) => a.id)).toEqual(
      expect.arrayContaining(["oud", "incense"]),
    )
    // Every asset carries an in-house SVG data URI, never an external image.
    for (const asset of hero.ingredients) {
      expect(asset.artDesktop.startsWith("data:image/svg+xml")).toBe(true)
    }
  })

  it("drops notes that do not resolve to an approved library ingredient", () => {
    const hero = buildHeroData(
      baseProduct({ notesTop: "Green Mango, Bergamot", notesHeart: "", notesBase: "" }),
    )!
    const ids = hero.ingredients.map((a) => a.id)
    expect(ids).toContain("bergamot")
    expect(ids).not.toContain("green mango")
    expect(ids).not.toContain("green-mango")
  })

  it("never emits a formulation percentage, only a qualitative prominence label", () => {
    const hero = buildHeroData(baseProduct())!
    const labels = new Set(hero.ingredients.map((a) => a.perceivedProminence))
    for (const label of labels) {
      expect(["very_prominent", "prominent", "moderate", "soft", "trace"]).toContain(label)
    }
  })

  it("flags coming soon from real commerce state", () => {
    expect(buildHeroData(baseProduct({ stock: 0 }))!.product.availability).toBe("coming_soon")
    expect(buildHeroData(baseProduct({ isWaitlist: true }))!.product.availability).toBe(
      "coming_soon",
    )
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000)
    expect(buildHeroData(baseProduct({ dropDate: future }))!.product.availability).toBe(
      "coming_soon",
    )
  })

  it("reports missing_ingredient_assets when no note resolves", () => {
    const hero = buildHeroData(
      baseProduct({ notesTop: "Green Mango", notesHeart: "Lotus", notesBase: "Sycamore Wood" }),
    )!
    expect(hero.ingredients).toHaveLength(0)
    expect(hero.status).toBe("missing_ingredient_assets")
  })
})
