import { z } from "zod"
import { route, raise } from "@/lib/http/handler"
import { prisma } from "@/lib/prisma"
import { resolveConciergeIdentity } from "@/lib/concierge/conversation"

const Body = z.object({ rating: z.enum(["HELPFUL", "NOT_HELPFUL", "REPORTED"]), reason: z.string().trim().max(500).optional() })
export const POST = route(async ({ req }) => {
  const messageId = req.nextUrl.pathname.split("/").at(-2)!
  const { identity } = await resolveConciergeIdentity(req)
  const message = await prisma.conciergeMessage.findFirst({ where: { id: messageId, role: "assistant", conversation: identity.userId ? { userId: identity.userId } : { guestKeyHash: identity.guestKeyHash! } }, select: { id: true } })
  if (!message) raise("NOT_FOUND")
  const body = Body.parse(await req.json())
  const feedback = await prisma.conciergeFeedback.upsert({ where: { messageId }, create: { messageId, userId: identity.userId, guestKeyHash: identity.guestKeyHash, rating: body.rating, reportReason: body.reason }, update: { rating: body.rating, reportReason: body.reason } })
  return { data: { feedback: { id: feedback.id, rating: feedback.rating } } }
})
