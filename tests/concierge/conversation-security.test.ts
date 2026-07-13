import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(), transaction: vi.fn(), messageCreate: vi.fn(), allowanceUpsert: vi.fn(), allowanceClaim: vi.fn(), conversationCreate: vi.fn(), conversationUpdate: vi.fn(),
}))
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }))
vi.mock("@/lib/env", () => ({ env: { AUTH_SECRET: "test-secret", NEXTAUTH_SECRET: undefined, NODE_ENV: "test", CONCIERGE_GUEST_QUESTIONS: 1 } }))
vi.mock("@/lib/prisma", () => ({ prisma: {
  conciergeConversation: { findFirst: mocks.findFirst },
  $transaction: mocks.transaction,
} }))

import { guestCookieHeader, loadOwnedConversation, persistSuccessfulTurn } from "@/lib/concierge/conversation"
import { EMPTY_CONVERSATION_STATE } from "@/lib/concierge/types"

describe("Concierge conversation ownership and guest entitlement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findFirst.mockResolvedValue(null)
    mocks.transaction.mockImplementation(async (callback) => callback({
      conciergeGuestAllowance: { upsert: mocks.allowanceUpsert, updateMany: mocks.allowanceClaim },
      conciergeConversation: { create: mocks.conversationCreate, updateMany: mocks.conversationUpdate },
      conciergeMessage: { create: mocks.messageCreate },
    }))
  })

  it("always scopes a conversation lookup to the authenticated owner", async () => {
    await expect(loadOwnedConversation("conversation-id", { userId: "user-a", isAuthenticated: true })).rejects.toMatchObject({ code: "NOT_FOUND" })
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "conversation-id", userId: "user-a" }) }))
  })

  it("returns a durable HTTP-only cookie for newly created guest identities", () => {
    expect(guestCookieHeader("guest token")).toBe("fade_concierge_guest=guest%20token; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax")
  })

  it("does not write messages when the atomic guest success claim loses a race", async () => {
    mocks.allowanceUpsert.mockResolvedValue({})
    mocks.allowanceClaim.mockResolvedValue({ count: 0 })
    await expect(persistSuccessfulTurn({
      conversationId: "conversation-id", existingConversation: false,
      identity: { guestKeyHash: "guest", isAuthenticated: false },
      userMessage: "Question", assistantMessage: "Answer", intent: "GENERAL_PERFUME_KNOWLEDGE",
      state: EMPTY_CONVERSATION_STATE, sources: [], productIds: [],
    })).rejects.toMatchObject({ code: "GUEST_ALLOWANCE_EXHAUSTED" })
    expect(mocks.messageCreate).not.toHaveBeenCalled()
  })
})
