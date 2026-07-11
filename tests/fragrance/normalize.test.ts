import { describe, it, expect } from "vitest"
import {
  normalizeName,
  editDistance,
  matchIngredient,
  matchIngredients,
  searchIngredients,
} from "@/lib/fragrance/normalize"
import { INGREDIENT_LIBRARY, INGREDIENT_COUNT, getIngredient } from "@/lib/fragrance/ingredients"

describe("normalizeName", () => {
  it("lowercases, trims, collapses whitespace and strips punctuation", () => {
    expect(normalizeName("  Pink   Pepper! ")).toBe("pink pepper")
    expect(normalizeName("Ylang-Ylang")).toBe("ylang-ylang")
  })
  it("strips diacritics", () => {
    expect(normalizeName("Café")).toBe("cafe")
    expect(normalizeName("Vanille")).toBe("vanille")
  })
  it("drops trailing perfumery qualifiers", () => {
    expect(normalizeName("Rose Absolute")).toBe("rose")
    expect(normalizeName("Sandalwood essential oil")).toBe("sandalwood")
  })
  it("returns empty string for empty input", () => {
    expect(normalizeName(null)).toBe("")
    expect(normalizeName("   ")).toBe("")
  })
})

describe("editDistance", () => {
  it("computes Levenshtein distance", () => {
    expect(editDistance("oud", "oud")).toBe(0)
    expect(editDistance("bergamont", "bergamot")).toBe(1)
    expect(editDistance("", "rose")).toBe(4)
  })
})

describe("matchIngredient", () => {
  it("matches an exact canonical name with high confidence", () => {
    const m = matchIngredient("oud")
    expect(m.status).toBe("matched")
    expect(m.ingredient?.canonicalName).toBe("oud")
    expect(m.confidence).toBe("high")
    expect(m.input).toBe("oud")
  })

  it("collapses aliases to one canonical ingredient", () => {
    for (const alias of ["oudh", "agarwood", "Oud Wood"]) {
      const m = matchIngredient(alias)
      expect(m.status).toBe("matched")
      expect(m.ingredient?.canonicalName).toBe("oud")
    }
    expect(matchIngredient("tonka").ingredient?.canonicalName).toBe("tonka bean")
    expect(matchIngredient("cedar").ingredient?.canonicalName).toBe("cedarwood")
  })

  it("corrects a known misspelling as a suggestion, not a silent rewrite", () => {
    const m = matchIngredient("bergamont")
    expect(m.status).toBe("corrected")
    expect(m.ingredient?.canonicalName).toBe("bergamot")
    expect(m.suggestion).toBe("bergamot")
    expect(m.input).toBe("bergamont") // original preserved verbatim
  })

  it("corrects a novel misspelling via fuzzy match", () => {
    const m = matchIngredient("vanilaa")
    expect(m.status).toBe("corrected")
    expect(m.ingredient?.canonicalName).toBe("vanilla")
  })

  it("flags a genuinely unknown note instead of guessing", () => {
    const m = matchIngredient("xylophone blossom")
    expect(m.status).toBe("unknown")
    expect(m.ingredient).toBeNull()
    expect(m.confidence).toBe("low")
  })

  it("preserves the raw input for every status", () => {
    expect(matchIngredient("  Rose  ").input).toBe("  Rose  ")
  })
})

describe("matchIngredients", () => {
  it("resolves a list preserving order", () => {
    const ms = matchIngredients(["bergamot", "rose", "oud"])
    expect(ms.map((m) => m.ingredient?.canonicalName)).toEqual(["bergamot", "rose", "oud"])
  })
})

describe("searchIngredients", () => {
  it("ranks exact and prefix matches first", () => {
    const res = searchIngredients("van")
    expect(res[0].canonicalName).toBe("vanilla")
  })
  it("finds by alias and keyword", () => {
    expect(searchIngredients("santal").some((i) => i.canonicalName === "sandalwood")).toBe(true)
    expect(searchIngredients("frankincense").some((i) => i.canonicalName === "incense")).toBe(true)
  })
  it("returns the library for an empty query", () => {
    expect(searchIngredients("").length).toBeGreaterThan(0)
  })
})

describe("library integrity", () => {
  it("has at least the 20 seed ingredients", () => {
    expect(INGREDIENT_COUNT).toBeGreaterThanOrEqual(20)
  })
  it("has unique canonical names and stable ids", () => {
    const names = new Set(INGREDIENT_LIBRARY.map((i) => i.canonicalName))
    expect(names.size).toBe(INGREDIENT_LIBRARY.length)
  })
  it("every entry carries image provenance and a review date", () => {
    for (const i of INGREDIENT_LIBRARY) {
      expect(i.image.provenance).toBeTruthy()
      expect(i.image.licence).toBeTruthy()
      expect(i.lastReviewed).not.toBeNull()
      expect(i.alt.length).toBeGreaterThan(0)
    }
  })
  it("getIngredient resolves canonical names case-insensitively", () => {
    expect(getIngredient("OUD")?.displayName).toBe("Oud")
    expect(getIngredient("nope")).toBeNull()
  })
})
