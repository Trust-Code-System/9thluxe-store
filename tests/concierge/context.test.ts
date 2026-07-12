import { describe, expect, it } from "vitest"
import { reduceConversationState } from "@/lib/concierge/context"
import { routeConciergeIntent } from "@/lib/concierge/router"
import { EMPTY_CONVERSATION_STATE } from "@/lib/concierge/types"

describe("Concierge V2 conversation state", () => {
  it("preserves the active product set for availability follow-ups", () => {
    const firstRoute = routeConciergeIntent("Show me Fádé oud perfumes")
    const first = reduceConversationState(EMPTY_CONVERSATION_STATE, firstRoute, "Show me Fádé oud perfumes", ["p1", "p2"])
    const follow = routeConciergeIntent("Which of those is currently in stock?", first)
    expect(follow.requiresConversationContext).toBe(true)
    expect(follow.primaryIntent).toBe("AVAILABILITY_CHECK")
    expect(first.activeProductIds).toEqual(["p1", "p2"])
  })

  it("keeps budget and excluded-note constraints across turns", () => {
    const route = routeConciergeIntent("Something under ₦120,000 without vanilla")
    const state = reduceConversationState(EMPTY_CONVERSATION_STATE, route, "Something under ₦120,000 without vanilla")
    expect(state.budgetMaxNGN).toBe(120000)
    expect(state.excludedNotes).toContain("vanilla")
  })
})
