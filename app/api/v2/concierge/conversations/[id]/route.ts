import { z } from "zod"
import { route } from "@/lib/http/handler"
import { resolveConciergeIdentity, loadOwnedConversation, renameOwnedConversation, archiveOwnedConversation } from "@/lib/concierge/conversation"
import { getFadeProductsBatch } from "@/lib/concierge/tools/catalogue"

export const runtime = "nodejs"
const Body = z.object({ title: z.string().trim().min(1).max(100) })

export const GET = route<{ conversation: unknown | null }>(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!
  const { identity } = await resolveConciergeIdentity(req)
  const conversation = await loadOwnedConversation(id, identity)
  if (!conversation) return { data: { conversation: null } }
  const ids = [...new Set(conversation.messages.flatMap((message) => Array.isArray(message.productRefs) ? message.productRefs.filter((value): value is string => typeof value === "string") : []))].slice(0, 20)
  const catalogue = ids.length ? await getFadeProductsBatch(ids) : { products: [] }
  const byId = new Map(catalogue.products.map((product) => [product.id, product]))
  return { data: { conversation: { ...conversation, messages: conversation.messages.map((message) => ({
    ...message,
    products: Array.isArray(message.productRefs) ? message.productRefs.flatMap((value) => typeof value === "string" && byId.has(value) ? [byId.get(value)!] : []) : [],
  })) } } }
})
export const PATCH = route(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!
  const { identity } = await resolveConciergeIdentity(req)
  const { title } = Body.parse(await req.json())
  await renameOwnedConversation(id, identity, title)
  return { data: { id, title } }
})
export const DELETE = route(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!
  const { identity } = await resolveConciergeIdentity(req)
  await archiveOwnedConversation(id, identity)
  return { data: { id, archived: true } }
})
