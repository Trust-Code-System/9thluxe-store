import { describe, it, expect } from "vitest"
import {
  slugify,
  sanitizeText,
  isSafeUrl,
  isStoryVisible,
  sanitizeBlock,
  sanitizeBlocks,
  canTransition,
} from "@/lib/stories/util"

describe("slugify", () => {
  it("lowercases, strips accents and punctuation, hyphenates", () => {
    expect(slugify("Fádé — The 5 Best Oud Fragrances!")).toBe("fade-the-5-best-oud-fragrances")
  })
  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world")
  })
})

describe("sanitizeText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(sanitizeText("  hello <script>x</script>   world  ")).toBe("hello x world")
  })
  it("returns empty for non-strings", () => {
    expect(sanitizeText(null)).toBe("")
    expect(sanitizeText(42)).toBe("")
  })
})

describe("isSafeUrl", () => {
  it("allows http(s) and site-relative", () => {
    expect(isSafeUrl("https://x.com/a.jpg")).toBe(true)
    expect(isSafeUrl("http://x.com")).toBe(true)
    expect(isSafeUrl("/img/a.png")).toBe(true)
  })
  it("rejects javascript: and data: and empties", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false)
    expect(isSafeUrl("data:text/html;base64,xx")).toBe(false)
    expect(isSafeUrl("")).toBe(false)
  })
})

describe("isStoryVisible", () => {
  const base = { publishedAt: null, scheduledFor: null, unpublishAt: null, deletedAt: null }
  it("hides drafts and archived", () => {
    expect(isStoryVisible({ ...base, status: "DRAFT" })).toBe(false)
    expect(isStoryVisible({ ...base, status: "ARCHIVED" })).toBe(false)
  })
  it("shows published with a past publish time", () => {
    expect(
      isStoryVisible({ ...base, status: "PUBLISHED", publishedAt: new Date(Date.now() - 1000) })
    ).toBe(true)
  })
  it("hides published scheduled in the future", () => {
    expect(
      isStoryVisible({ ...base, status: "PUBLISHED", publishedAt: new Date(Date.now() + 100000) })
    ).toBe(false)
  })
  it("hides once unpublishAt has passed", () => {
    expect(
      isStoryVisible({
        ...base,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 10000),
        unpublishAt: new Date(Date.now() - 1000),
      })
    ).toBe(false)
  })
  it("hides soft-deleted even if published", () => {
    expect(
      isStoryVisible({ ...base, status: "PUBLISHED", publishedAt: new Date(0), deletedAt: new Date() })
    ).toBe(false)
  })
})

describe("sanitizeBlock", () => {
  it("keeps valid paragraph", () => {
    expect(sanitizeBlock({ type: "paragraph", position: 0, data: { text: "hi" } })).toEqual({
      type: "paragraph",
      position: 0,
      data: { text: "hi" },
    })
  })
  it("drops unknown block types", () => {
    expect(sanitizeBlock({ type: "evil" as any, position: 0, data: {} })).toBeNull()
  })
  it("drops images with unsafe urls, keeps safe ones", () => {
    expect(sanitizeBlock({ type: "image", position: 0, data: { url: "javascript:x" } })).toBeNull()
    expect(
      sanitizeBlock({ type: "image", position: 0, data: { url: "/a.jpg", alt: "a" } })
    ).toEqual({ type: "image", position: 0, data: { url: "/a.jpg", alt: "a", caption: "" } })
  })
  it("reindexes positions and filters in sanitizeBlocks", () => {
    const out = sanitizeBlocks([
      { type: "paragraph", position: 5, data: { text: "a" } },
      { type: "evil" as any, position: 6, data: {} },
      { type: "divider", position: 7, data: {} },
    ])
    expect(out.map((b) => b.position)).toEqual([0, 1])
    expect(out.map((b) => b.type)).toEqual(["paragraph", "divider"])
  })
})

describe("canTransition", () => {
  it("allows draft->published and published->archived", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(true)
    expect(canTransition("PUBLISHED", "ARCHIVED")).toBe(true)
    expect(canTransition("ARCHIVED", "PUBLISHED")).toBe(true)
  })
})
