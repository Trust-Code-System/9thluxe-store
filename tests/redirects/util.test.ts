import { describe, expect, it } from "vitest"
import { normalizeRedirectDestination, normalizeRedirectSource } from "@/lib/redirects/util"
describe("redirect validation", () => {
  it("normalizes safe local sources", () => { expect(normalizeRedirectSource("/old/" )).toBe("/old"); expect(normalizeRedirectSource("https://bad.test")).toBeNull() })
  it("accepts local and http destinations only", () => { expect(normalizeRedirectDestination("/new")).toBe("/new"); expect(normalizeRedirectDestination("https://example.test/new")).toBe("https://example.test/new"); expect(normalizeRedirectDestination("javascript:alert(1)")).toBeNull() })
})
