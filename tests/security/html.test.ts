import { describe, expect, it } from "vitest"

import { escapeHtml } from "@/lib/security/html"

describe("HTML escaping", () => {
  it("escapes all characters that can introduce markup or attributes", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;",
    )
  })

  it("leaves ordinary customer text unchanged", () => {
    expect(escapeHtml("Amina Okafor")).toBe("Amina Okafor")
  })
})
