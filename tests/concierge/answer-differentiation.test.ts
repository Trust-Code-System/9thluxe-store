// Behavioral regression for the V1 "every question is a catalogue recommendation" bug.
// Drives the REAL orchestrator (only the DB + auth boundaries are stubbed) through the dev mock
// provider, and proves the acceptance criteria that matter most:
//   1. Semantically different questions produce meaningfully different answers.
//   2. The fixed V1 string "Here are catalogue matches for your request." never appears.
//   3. General-knowledge questions do NOT force product cards.
//   4. A catalogue question still surfaces grounded product cards.
//   5. Output carries no visible em dashes (sanitizer policy).
import { beforeEach, describe, expect, it, vi } from "vitest"

// --- Stub the persistence + auth boundaries so the orchestrator runs without a database. ---
const txStub = {
  conciergeGuestAllowance: {
    upsert: vi.fn(async () => ({})),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  conciergeConversation: {
    create: vi.fn(async () => ({})),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  conciergeMessage: { create: vi.fn(async () => ({ id: "msg_test" })) },
}

const fadeProduct = {
  id: "prod_test_1",
  slug: "aurelius-oud",
  name: "Aurelius Oud",
  brand: "Fádé",
  images: ["/products/aurelius-oud.webp"],
  priceNGN: 85_000,
  stock: 7,
  isPreorder: false,
  isWaitlist: false,
  notesTop: "bergamot, saffron",
  notesHeart: "rose, oud",
  notesBase: "sandalwood, amber",
  mainAccords: "woody, amber, oud",
  fragranceFamily: "woody",
  olfactoryDesc: "A warm resinous oud rounded by creamy sandalwood.",
  climate: "humid",
  occasion: "evening",
  variants: [{ size: "2ml", priceNGN: 4_000, isSample: true, stock: 20 }],
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    // Catalogue reads: return a product so a catalogue question can produce a card.
    product: {
      findMany: vi.fn(async () => [fadeProduct]),
      findFirst: vi.fn(async () => null), // scent-atlas lookup -> no approved atlas row
    },
    // Approved knowledge table is empty during rollout.
    perfumeKnowledgeEntry: { findMany: vi.fn(async () => []) },
    review: { findMany: vi.fn(async () => []) },
    scentProfile: { findUnique: vi.fn(async () => null) },
    conciergeConversation: { findFirst: vi.fn(async () => null) },
    // persistSuccessfulTurn runs inside a $transaction callback.
    $transaction: vi.fn(async (cb: (tx: typeof txStub) => unknown) => cb(txStub)),
  },
}))

vi.mock("@/lib/auth", () => ({ auth: async () => null }))

import { orchestrateConciergeTurn } from "@/lib/concierge/orchestrator"
import type { ConciergeIdentity } from "@/lib/concierge/types"

const guest: ConciergeIdentity = { guestKeyHash: "test-guest-hash", isAuthenticated: false }
const V1_FIXED = "Here are catalogue matches for your request."

async function ask(message: string) {
  return orchestrateConciergeTurn({ requestId: `req_${Math.random()}`, identity: guest, message })
}

describe("Concierge V2 answer differentiation (repeated-answer regression)", () => {
  beforeEach(() => vi.clearAllMocks())

  const knowledgeQuestions = [
    "What is an accord?",
    "What happens when grape and wood are combined?",
    "How should perfume be stored?",
    "What is the difference between EDP and EDT?",
    "Can perfume cure stress?",
  ]

  it("returns a meaningfully different answer for each semantically different question", async () => {
    const answers = await Promise.all(knowledgeQuestions.map((q) => ask(q).then((r) => r.answer)))
    for (const answer of answers) {
      expect(answer.trim().length).toBeGreaterThan(20)
      expect(answer).not.toContain(V1_FIXED)
    }
    // The core of the old bug: every question collapsed to one canned answer. Require full distinctness.
    expect(new Set(answers).size).toBe(knowledgeQuestions.length)
  })

  it("does not force product cards onto a general-knowledge question", async () => {
    const result = await ask("What is an accord?")
    expect(result.products).toHaveLength(0)
    expect(result.intent.requiresCatalogue).toBe(false)
  })

  it("still surfaces grounded catalogue cards for a commerce question", async () => {
    const result = await ask("Show me something under ₦100,000")
    expect(result.intent.requiresCatalogue).toBe(true)
    expect(result.products.length).toBeGreaterThan(0)
    expect(result.products[0]!.provenance).toBe("Fádé catalogue")
  })

  it("never emits a visible em dash or the V1 fixed string across a broad question set", async () => {
    const answers = await Promise.all(
      [...knowledgeQuestions, "Show me something under ₦100,000", "Can I layer vanilla and oud?"].map((q) =>
        ask(q).then((r) => r.answer),
      ),
    )
    for (const answer of answers) {
      expect(answer).not.toMatch(/[—–]/)
      expect(answer).not.toContain(V1_FIXED)
    }
  })
})
