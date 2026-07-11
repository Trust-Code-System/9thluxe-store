import { z } from "zod"
import { route } from "@/lib/http/handler"
import { resolveConciergeIdentity, listOwnedConversations, createOwnedConversation } from "@/lib/concierge/conversation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = route(async ({ req }) => {
  const { identity } = await resolveConciergeIdentity(req)
  const conversations = await listOwnedConversations(identity, req.nextUrl.searchParams.get("q") ?? undefined)
  return { data: { conversations } }
})

const Body = z.object({ title: z.string().trim().min(1).max(100).optional() })
export const POST = route(async ({ req }) => {
  const { identity } = await resolveConciergeIdentity(req)
  const body = Body.parse(await req.json())
  const conversation = await createOwnedConversation(identity, body.title)
  return { data: { conversation }, status: 201 }
})
