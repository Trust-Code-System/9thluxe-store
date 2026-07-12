import { createHmac, randomUUID } from "node:crypto"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { AppError } from "@/lib/http/errors"
import { parseConversationState } from "./context"
import type { ConciergeIdentity, ConciergeConversationState, ConciergeSource } from "./types"

export const GUEST_COOKIE = "fade_concierge_guest"

function digestGuest(value: string) {
  const secret = env.AUTH_SECRET || env.NEXTAUTH_SECRET || "development-only-concierge-salt"
  return createHmac("sha256", secret).update(value).digest("hex")
}

export async function resolveConciergeIdentity(req: NextRequest): Promise<{ identity: ConciergeIdentity; newGuestToken?: string }> {
  const session = await auth()
  const email = session?.user?.email
  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (user) return { identity: { userId: user.id, isAuthenticated: true } }
  }
  const existing = req.cookies.get(GUEST_COOKIE)?.value
  const token = existing && existing.length >= 24 ? existing : randomUUID()
  return { identity: { guestKeyHash: digestGuest(token), isAuthenticated: false }, ...(existing ? {} : { newGuestToken: token }) }
}

function ownerWhere(identity: ConciergeIdentity) {
  return identity.userId ? { userId: identity.userId } : { guestKeyHash: identity.guestKeyHash! }
}

export async function loadOwnedConversation(id: string | undefined, identity: ConciergeIdentity) {
  if (!id) return null
  const conversation = await prisma.conciergeConversation.findFirst({
    where: { id, ...ownerWhere(identity), archivedAt: null },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  })
  if (!conversation) throw new AppError("NOT_FOUND", { message: "That conversation could not be found." })
  return { ...conversation, state: parseConversationState(conversation.state) }
}

export async function listOwnedConversations(identity: ConciergeIdentity, query?: string) {
  return prisma.conciergeConversation.findMany({
    where: { ...ownerWhere(identity), archivedAt: null, ...(query ? { title: { contains: query, mode: "insensitive" } } : {}) },
    orderBy: { updatedAt: "desc" }, take: 50,
    select: { id: true, title: true, summary: true, updatedAt: true, _count: { select: { messages: true } } },
  })
}

export async function createOwnedConversation(identity: ConciergeIdentity, title = "New perfume conversation") {
  return prisma.conciergeConversation.create({ data: { ...ownerWhere(identity), title: title.slice(0, 100), state: { activeProductIds: [], externalPerfumes: [], preferredNotes: [], excludedNotes: [], preferredFamilies: [] } }, select: { id: true, title: true, createdAt: true } })
}

export interface PersistTurnInput {
  conversationId: string
  existingConversation: boolean
  identity: ConciergeIdentity
  userMessage: string
  assistantMessage: string
  intent: string
  state: ConciergeConversationState
  sources: ConciergeSource[]
  productIds: string[]
}

export async function persistSuccessfulTurn(input: PersistTurnInput) {
  return prisma.$transaction(async (tx) => {
    if (!input.identity.isAuthenticated) {
      await tx.conciergeGuestAllowance.upsert({ where: { guestKeyHash: input.identity.guestKeyHash! }, create: { guestKeyHash: input.identity.guestKeyHash! }, update: {} })
      const claimed = await tx.conciergeGuestAllowance.updateMany({ where: { guestKeyHash: input.identity.guestKeyHash!, successCount: { lt: env.CONCIERGE_GUEST_QUESTIONS } }, data: { successCount: { increment: 1 }, lastSuccessAt: new Date() } })
      if (claimed.count !== 1) throw new AppError("GUEST_ALLOWANCE_EXHAUSTED")
    }
    if (!input.existingConversation) {
      await tx.conciergeConversation.create({ data: { id: input.conversationId, ...ownerWhere(input.identity), title: input.userMessage.slice(0, 80), state: input.state as never } })
    } else {
      const updated = await tx.conciergeConversation.updateMany({ where: { id: input.conversationId, ...ownerWhere(input.identity) }, data: { state: input.state as never } })
      if (updated.count !== 1) throw new AppError("NOT_FOUND")
    }
    await tx.conciergeMessage.create({ data: { conversationId: input.conversationId, role: "user", content: input.userMessage, intent: input.intent } })
    return tx.conciergeMessage.create({ data: { conversationId: input.conversationId, role: "assistant", content: input.assistantMessage, intent: input.intent, sources: input.sources as never, productRefs: input.productIds as never } })
  })
}

export async function archiveOwnedConversation(id: string, identity: ConciergeIdentity) {
  const result = await prisma.conciergeConversation.updateMany({ where: { id, ...ownerWhere(identity) }, data: { archivedAt: new Date() } })
  if (!result.count) throw new AppError("NOT_FOUND")
}

export async function renameOwnedConversation(id: string, identity: ConciergeIdentity, title: string) {
  const result = await prisma.conciergeConversation.updateMany({ where: { id, ...ownerWhere(identity) }, data: { title: title.slice(0, 100) } })
  if (!result.count) throw new AppError("NOT_FOUND")
}
