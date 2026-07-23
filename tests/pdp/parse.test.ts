import { describe, it, expect } from "vitest"
import {
  splitList,
  toSlug,
  toNotes,
  toAccords,
  parseMl,
  pricePerMl,
  stockState,
  discountPct,
  buildTimeline,
  buildScentStory,
  PROVENANCE_LABEL,
} from "@/lib/pdp/parse"

describe("splitList", () => {
  it("trims, dedupes case-insensitively, drops empties", () => {
    expect(splitList("amber, Vanilla ,, oud, amber")).toEqual(["amber", "Vanilla", "oud"])
  })
  it("returns [] for null/empty", () => {
    expect(splitList(null)).toEqual([])
    expect(splitList("")).toEqual([])
    expect(splitList("  , ,")).toEqual([])
  })
})

describe("toSlug", () => {
  it("makes url-safe slugs", () => {
    expect(toSlug("Pink Pepper")).toBe("pink-pepper")
    expect(toSlug("  Oud & Amber!! ")).toBe("oud-amber")
  })
})

describe("toNotes", () => {
  it("maps names to {name,slug}", () => {
    expect(toNotes("bergamot, pink pepper")).toEqual([
      { name: "bergamot", slug: "bergamot" },
      { name: "pink pepper", slug: "pink-pepper" },
    ])
  })
})

describe("toAccords", () => {
  it("ranks by order with proportional, non-fabricated strength", () => {
    const a = toAccords("woody, amber, spicy")
    expect(a.map((x) => x.rank)).toEqual([1, 2, 3])
    expect(a[0].strength).toBe(1) // strongest full width
    expect(a[2].strength).toBeCloseTo(0.35, 2) // weakest floored, legible
    expect(a[1].strength).toBeLessThan(a[0].strength)
    expect(a[1].strength).toBeGreaterThan(a[2].strength)
  })
  it("single accord is full strength", () => {
    expect(toAccords("oud")).toEqual([{ name: "oud", slug: "oud", rank: 1, strength: 1 }])
  })
  it("empty in => []", () => {
    expect(toAccords(null)).toEqual([])
  })
})

describe("parseMl / pricePerMl", () => {
  it("parses ml from size labels", () => {
    expect(parseMl("100ml")).toBe(100)
    expect(parseMl("2 mL sample")).toBe(2)
    expect(parseMl("travel")).toBeNull()
    expect(parseMl(null)).toBeNull()
  })
  it("computes whole-naira price per ml, null when unparseable", () => {
    expect(pricePerMl(95000, "100ml")).toBe(950)
    expect(pricePerMl(95000, "travel")).toBeNull()
  })
})

describe("stockState", () => {
  it("classifies stock bands and preorder/waitlist precedence", () => {
    expect(stockState(50)).toBe("in_stock")
    expect(stockState(3)).toBe("low_stock")
    expect(stockState(0)).toBe("out_of_stock")
    expect(stockState(0, { isPreorder: true })).toBe("preorder")
    expect(stockState(0, { isWaitlist: true })).toBe("waitlist")
    expect(stockState(2, { lowThreshold: 1 })).toBe("in_stock")
  })
})

describe("discountPct", () => {
  it("only reports a genuine markdown", () => {
    expect(discountPct(80, 100)).toBe(20)
    expect(discountPct(100, 100)).toBeNull()
    expect(discountPct(100, 80)).toBeNull()
    expect(discountPct(100, null)).toBeNull()
  })
})

describe("buildTimeline", () => {
  it("returns [] with no notes", () => {
    expect(buildTimeline([], [], [])).toEqual([])
  })
  it("builds ordered stages using only real notes", () => {
    const t = buildTimeline(["bergamot"], ["oud"], ["amber", "vanilla"])
    expect(t.map((s) => s.key)).toEqual(["open", "early", "mid", "dry"])
    expect(t[0].notes).toContain("bergamot")
    expect(t[3].notes).toEqual(["amber", "vanilla"])
    // intensities decay
    expect(t[0].intensity).toBeGreaterThan(t[3].intensity)
  })
})

describe("buildScentStory", () => {
  it("nulls out lines with no data, never invents", () => {
    const s = buildScentStory({
      olfactoryDesc: null,
      family: "WOODY",
      top: [],
      heart: ["oud"],
      base: [],
      moods: [],
    })
    expect(s.summary).toBeNull()
    expect(s.opening).toBeNull()
    expect(s.heart).toBe("The heart turns to oud.")
    expect(s.dryDown).toBeNull()
    expect(s.mood).toBeNull()
  })
})

describe("PROVENANCE_LABEL", () => {
  it("maps every provenance to a human label", () => {
    expect(PROVENANCE_LABEL.BRAND).toBe("Brand-provided")
    expect(PROVENANCE_LABEL.EDITORIAL).toBe("Fádé editorial")
    expect(PROVENANCE_LABEL.CUSTOMER_AGGREGATE).toBe("Verified customers")
  })
})
