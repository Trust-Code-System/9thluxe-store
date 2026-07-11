import { z } from "zod"
import { route } from "@/lib/http/handler"
import { resolveConciergeIdentity, loadOwnedConversation, renameOwnedConversation, archiveOwnedConversation } from "@/lib/concierge/conversation"

export const runtime = "nodejs"
const Body = z.object({ title: z.string().trim().min(1).max(100) })

export const GET = route(async ({ req }) => {
  const id = req.nextUrl.pathname.split("/").at(-1)!
  const { identity } = await resolveConciergeIdentity(req)
  return { data: { conversation: await loadOwnedConversation(id, identity) } }
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
