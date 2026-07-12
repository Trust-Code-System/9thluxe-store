import { describe, expect, it } from "vitest"
import { safetyAnswer, sanitizeConciergeText, validateSources } from "@/lib/concierge/response-policy"

describe("Concierge V2 response policy", () => {
  it("removes script tags and visible em dashes", () => {
    expect(sanitizeConciergeText(`One ${String.fromCharCode(0x2014)} two <script>alert(1)</script>`)).not.toContain(String.fromCharCode(0x2014))
  })
  it("gives a non-diagnostic headache answer", () => {
    const answer = safetyAnswer("MEDICAL_OR_ALLERGY_SENSITIVE", "Why does perfume give me headaches?")!
    expect(answer).toContain("cannot diagnose")
    expect(answer).not.toContain("cure")
  })
  it("rejects local and non-HTTPS citations", () => {
    const values = [{ id: "1", title: "bad", url: "http://localhost/a", domain: "localhost", kind: "official" as const, retrievedAt: new Date().toISOString() }, { id: "2", title: "good", url: "https://example.com/a", domain: "example.com", kind: "editorial" as const, retrievedAt: new Date().toISOString() }]
    expect(validateSources(values).map((x) => x.id)).toEqual(["2"])
  })
})
