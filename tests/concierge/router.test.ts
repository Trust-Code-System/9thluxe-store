import { describe, expect, it } from "vitest"
import { routeConciergeIntent } from "@/lib/concierge/router"
import { CONCIERGE_EVALUATION_CASES } from "@/lib/concierge/evaluation"

describe("Concierge V2 intent router", () => {
  for (const testCase of CONCIERGE_EVALUATION_CASES) {
    it(`routes: ${testCase.question}`, () => {
      const result = routeConciergeIntent(testCase.question)
      expect(result.primaryIntent).toBe(testCase.expectedIntent)
      if (testCase.requiresCatalogue) expect(result.requiresCatalogue).toBe(true)
      if (testCase.requiresWeb) expect(result.requiresWebResearch).toBe(true)
    })
  }

  it("extracts notes and an NGN budget", () => {
    const result = routeConciergeIntent("Show me oud and vanilla under ₦100,000")
    expect(result.entities.notes).toEqual(expect.arrayContaining(["oud", "vanilla"]))
    expect(result.entities.budgetMaxNGN).toBe(100000)
  })

  it("does not route a general accord question to the catalogue", () => {
    const result = routeConciergeIntent("What is an accord?")
    expect(result.requiresCatalogue).toBe(false)
    expect(result.requiresLiveStock).toBe(false)
  })
})
