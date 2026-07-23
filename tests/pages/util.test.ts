import { describe, expect, it } from "vitest"
import { isPageVisible, normalizePageSlug, sanitizePageBlocks } from "@/lib/pages/util"

describe("page CMS helpers", () => {
  it("normalizes nested routes without allowing route punctuation", () => {
    expect(normalizePageSlug(" /Help/Shipping Info/ ")).toBe("help/shipping-info")
  })

  it("sanitizes supported blocks and rejects product blocks", () => {
    const blocks = sanitizePageBlocks([
      { type: "paragraph", position: 9, data: { text: "<b>Hello</b> world" } },
      { type: "product", position: 10, data: { productSlug: "secret" } },
      { type: "button", position: 11, data: { label: "Bad", href: "javascript:alert(1)" } },
    ])
    expect(blocks).toEqual([{ type: "paragraph", position: 0, data: { text: "Hello world" } }])
  })

  it("enforces status, deletion, and publish windows", () => {
    const now = new Date("2026-07-20T12:00:00Z")
    const base = { status: "PUBLISHED" as const, publishedAt: new Date("2026-07-20T10:00:00Z"), scheduledFor: null, unpublishAt: null, deletedAt: null }
    expect(isPageVisible(base, now)).toBe(true)
    expect(isPageVisible({ ...base, status: "DRAFT" }, now)).toBe(false)
    expect(isPageVisible({ ...base, publishedAt: new Date("2026-07-21T10:00:00Z") }, now)).toBe(false)
    expect(isPageVisible({ ...base, unpublishAt: now }, now)).toBe(false)
    expect(isPageVisible({ ...base, deletedAt: now }, now)).toBe(false)
  })
})
