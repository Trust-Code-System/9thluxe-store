import { describe, expect, it } from "vitest"

import {
  ORBIT_MAX_INGREDIENTS,
  buildOrbitData,
  buildOrbitSlide,
  buildShowcaseSlide,
  type OrbitProductInput,
} from "@/lib/hero/orbit"
import type { HomepagePerfumeSlide, OrbitSlideDisplay } from "@/lib/hero/orbit-config"

function slideConfig(overrides: Partial<HomepagePerfumeSlide> = {}): HomepagePerfumeSlide {
  return {
    id: "slide_test",
    productSlug: "nocturne-eau-de-parfum",
    displayOrder: 1,
    bottleAsset: "/hero/nocturne-bottle.webp",
    pedestalStyle: "STONE",
    backgroundProfile: "night-adaptive",
    motionProfile: "calm-orbit",
    approvalStatus: "APPROVED",
    enabled: true,
    ...overrides,
  }
}

function product(overrides: Partial<OrbitProductInput> = {}): OrbitProductInput {
  return {
    id: "p1",
    name: "Nocturne Eau de Parfum 100ml",
    slug: "nocturne-eau-de-parfum",
    brand: "Fàdè",
    images: ["/nocturne-eau-de-parfum.jpg"],
    notesTop: "bergamot",
    notesHeart: "oud",
    notesBase: "amber, vanilla",
    concentration: "EDP",
    fragranceFamily: "ORIENTAL",
    publishStatus: "PUBLISHED",
    deletedAt: null,
    isFeatured: false,
    stock: 50,
    isPreorder: false,
    isWaitlist: false,
    dropDate: null,
    ...overrides,
  }
}

describe("buildOrbitSlide eligibility", () => {
  it("returns null for DRAFT or REJECTED slides", () => {
    expect(buildOrbitSlide(slideConfig({ approvalStatus: "DRAFT" }), product())).toBeNull()
    expect(buildOrbitSlide(slideConfig({ approvalStatus: "REJECTED" }), product())).toBeNull()
  })

  it("returns null for disabled slides", () => {
    expect(buildOrbitSlide(slideConfig({ enabled: false }), product())).toBeNull()
  })

  it("returns null when no transparent bottle asset exists", () => {
    expect(buildOrbitSlide(slideConfig({ bottleAsset: null }), product())).toBeNull()
  })

  it("returns null when the product is missing, deleted or unpublished", () => {
    expect(buildOrbitSlide(slideConfig(), null)).toBeNull()
    expect(buildOrbitSlide(slideConfig(), product({ deletedAt: new Date() }))).toBeNull()
    expect(buildOrbitSlide(slideConfig(), product({ publishStatus: "DRAFT" }))).toBeNull()
  })
})

describe("buildOrbitSlide mapping", () => {
  it("resolves real product data with approved ingredients and annotations", () => {
    const slide = buildOrbitSlide(slideConfig(), product())!
    expect(slide).not.toBeNull()
    expect(slide.product.slug).toBe("nocturne-eau-de-parfum")
    expect(slide.product.family).toBe("ORIENTAL")
    expect(slide.product.availability).toBe("available")
    expect(slide.ingredients.map((i) => i.id)).toEqual(["bergamot", "oud", "amber", "vanilla"])
    // Every annotation anchors to a rendered ingredient and uses the public qualitative scale.
    const ids = new Set(slide.ingredients.map((i) => i.id))
    for (const a of slide.annotations) {
      expect(ids.has(a.ingredientId)).toBe(true)
      expect(["Trace", "Subtle", "Noticeable", "Prominent", "Dominant"]).toContain(a.prominence)
      expect(a.text.length).toBeGreaterThan(10)
    }
  })

  it("never emits percentages in public annotation content", () => {
    const slide = buildOrbitSlide(slideConfig(), product())!
    for (const a of slide.annotations) {
      expect(a.text).not.toMatch(/\d+\s*%/)
      expect(a.prominence).not.toMatch(/%/)
    }
  })

  it("caps active-slide ingredient visuals at the desktop budget", () => {
    const slide = buildOrbitSlide(
      slideConfig(),
      product({
        notesTop: "bergamot, pink pepper, lavender",
        notesHeart: "rose, jasmine, iris",
        notesBase: "oud, amber, vanilla",
      }),
    )!
    expect(slide.ingredients.length).toBeLessThanOrEqual(ORBIT_MAX_INGREDIENTS)
  })

  it("marks out-of-stock and future-drop products as coming_soon", () => {
    expect(buildOrbitSlide(slideConfig(), product({ stock: 0 }))!.product.availability).toBe(
      "coming_soon",
    )
    expect(
      buildOrbitSlide(slideConfig(), product({ dropDate: new Date(Date.now() + 86_400_000) }))!
        .product.availability,
    ).toBe("coming_soon")
  })

  it("drops unknown notes instead of inventing ingredient art", () => {
    const slide = buildOrbitSlide(
      slideConfig(),
      product({ notesTop: "lemon, bergamot" }), // "lemon" has no approved art asset
    )!
    expect(slide.ingredients.map((i) => i.id)).not.toContain("lemon")
    expect(slide.ingredients.map((i) => i.id)).toContain("bergamot")
  })
})

describe("buildOrbitData", () => {
  const second = slideConfig({
    id: "slide_two",
    productSlug: "vesper-velvet-eau-de-parfum",
    displayOrder: 2,
    bottleAsset: "/hero/vesper-velvet-bottle.webp",
  })
  const vesper = product({
    id: "p2",
    name: "Vesper Velvet Eau de Parfum 50ml",
    slug: "vesper-velvet-eau-de-parfum",
    brand: "Vesper",
    notesTop: "pink pepper",
    notesHeart: "rose",
    notesBase: "patchouli",
    fragranceFamily: "FLORAL",
  })

  it("returns null when fewer than two slides are usable (no one-bottle carousel)", () => {
    const products = new Map([[vesper.slug, vesper]])
    expect(buildOrbitData([slideConfig(), second], products)).toBeNull()
    expect(buildOrbitData([], new Map())).toBeNull()
  })

  it("assembles usable slides in display order", () => {
    const products = new Map([
      [product().slug, product()],
      [vesper.slug, vesper],
    ])
    const data = buildOrbitData([second, slideConfig()], products)!
    expect(data.slides.map((s) => s.id)).toEqual(["slide_test", "slide_two"])
    expect(data.motion.dwellMs).toBeGreaterThanOrEqual(4_000)
    expect(data.motion.dwellMs).toBeLessThanOrEqual(6_000)
    expect(data.motion.transitionMs).toBeGreaterThanOrEqual(800)
    expect(data.motion.transitionMs).toBeLessThanOrEqual(1_200)
  })

  it("mixes showcase and product slides in display order", () => {
    const showcase = slideConfig({
      id: "slide_showcase",
      productSlug: "tom-ford-oud-wood",
      displayOrder: 3,
      bottleAsset: "/hero/tom-ford-oud-wood-bottle.webp",
      display: {
        brand: "Tom Ford",
        name: "Oud Wood Eau de Parfum",
        fragranceFamily: "WOODY",
        concentration: "EDP",
        notesTop: "cardamom",
        notesHeart: "oud, sandalwood",
        notesBase: "tonka bean, vanilla, amber",
      },
    })
    const products = new Map([
      [product().slug, product()],
      [vesper.slug, vesper],
    ])
    const data = buildOrbitData([slideConfig(), second, showcase], products)!
    expect(data.slides.map((s) => s.id)).toEqual(["slide_test", "slide_two", "slide_showcase"])
    const sc = data.slides.find((s) => s.id === "slide_showcase")!
    expect(sc.purchasable).toBe(false)
    expect(data.slides.find((s) => s.id === "slide_test")!.purchasable).toBe(true)
  })

  it("builds showcase slides from config with no catalogue product needed", () => {
    const display: OrbitSlideDisplay = {
      brand: "Dior",
      name: "Sauvage Elixir",
      fragranceFamily: "SPICY",
      concentration: "Elixir",
      notesTop: "cardamom",
      notesHeart: "lavender",
      notesBase: "sandalwood, amber, patchouli, vetiver",
    }
    const slide = buildShowcaseSlide(slideConfig({ id: "sc", display }))!
    expect(slide).not.toBeNull()
    expect(slide.purchasable).toBe(false)
    expect(slide.product.slug).toBe("") // no product page
    expect(slide.product.brand).toBe("Dior")
    expect(slide.product.family).toBe("SPICY")
    expect(slide.ingredients.length).toBeGreaterThan(0)
    // No percentages ever leak into showcase annotations either.
    for (const a of slide.annotations) expect(a.text).not.toMatch(/\d+\s*%/)
  })

  it("keeps showcase and product builders from crossing over", () => {
    const display: OrbitSlideDisplay = {
      brand: "Creed",
      name: "Aventus",
      fragranceFamily: "FRESH",
      concentration: "EDP",
      notesTop: "bergamot",
      notesHeart: "patchouli, jasmine",
      notesBase: "musk, vanilla",
    }
    // buildOrbitSlide must refuse a showcase config even with a product supplied.
    expect(buildOrbitSlide(slideConfig({ display }), product())).toBeNull()
    // buildShowcaseSlide must refuse a plain product config (no display).
    expect(buildShowcaseSlide(slideConfig())).toBeNull()
  })

  it("excludes blocked slides (e.g. missing asset) without inventing data", () => {
    const blocked = slideConfig({
      id: "slide_blocked",
      productSlug: "aurelius-noir-eau-de-toilette",
      displayOrder: 0,
      bottleAsset: null,
      approvalStatus: "DRAFT",
      enabled: false,
    })
    const products = new Map([
      [product().slug, product()],
      [vesper.slug, vesper],
    ])
    const data = buildOrbitData([blocked, slideConfig(), second], products)!
    expect(data.slides.map((s) => s.id)).toEqual(["slide_test", "slide_two"])
  })
})
