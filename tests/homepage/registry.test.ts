import { describe, it, expect } from "vitest"
import {
  HOMEPAGE_SECTIONS,
  SECTION_BY_TYPE,
  isSectionType,
  validateSectionConfig,
} from "@/lib/homepage/registry"

describe("homepage registry", () => {
  it("has a stable, unique section catalogue", () => {
    const types = HOMEPAGE_SECTIONS.map((s) => s.type)
    expect(new Set(types).size).toBe(types.length)
    expect(types).toContain("hero")
    expect(types).toContain("featured_products")
  })

  it("recognises known section types only", () => {
    expect(isSectionType("brand_story")).toBe(true)
    expect(isSectionType("bogus")).toBe(false)
  })

  it("drops unknown config keys and empty values", () => {
    const r = validateSectionConfig("featured_products", {
      title: "New title",
      subtitle: "   ",
      bogus: "x",
    })
    expect(r).toEqual({ config: { title: "New title" } })
  })

  it("sanitises tags out of text", () => {
    const r = validateSectionConfig("featured_products", { title: "Hi <script>x</script> there" })
    expect(r).toEqual({ config: { title: "Hi x there" } })
  })

  it("rejects unsafe cta links", () => {
    const bad = validateSectionConfig("featured_products", { viewAllHref: "javascript:alert(1)" })
    expect("error" in bad).toBe(true)
    const ok = validateSectionConfig("featured_products", { viewAllHref: "/shop" })
    expect(ok).toEqual({ config: { viewAllHref: "/shop" } })
  })

  it("rejects unknown section types", () => {
    const bad = validateSectionConfig("nope", { title: "x" })
    expect("error" in bad).toBe(true)
  })

  it("every field has a placeholder for the admin form", () => {
    for (const section of HOMEPAGE_SECTIONS) {
      for (const field of section.fields) {
        expect(field.placeholder.length).toBeGreaterThan(0)
      }
    }
    expect(SECTION_BY_TYPE.hero.fields.length).toBe(0)
  })
})
