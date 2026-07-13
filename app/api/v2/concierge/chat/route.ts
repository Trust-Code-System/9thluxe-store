import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { isFeatureEnabled } from "@/lib/config/feature-flags"
import { ERROR_CATALOGUE, AppError, isAppError } from "@/lib/http/errors"
import { GUEST_COOKIE, resolveConciergeIdentity } from "@/lib/concierge/conversation"
import { routeConciergeIntent } from "@/lib/concierge/router"
import { orchestrateConciergeTurn } from "@/lib/concierge/orchestrator"
import { assertConciergeEntitlement, recordConciergeUsage } from "@/lib/concierge/usage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Body = z.object({ message: z.string().trim().min(1).max(2000), conversationId: z.string().uuid().optional(), sampleFirst: z.boolean().optional() })
const encode = (value: unknown) => new TextEncoder().encode(`${JSON.stringify(value)}\n`)

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID()
  if (!isFeatureEnabled("ai_concierge") || !isFeatureEnabled("concierge_v2")) return NextResponse.json({ data: null, error: { code: "FEATURE_DISABLED", message: ERROR_CATALOGUE.FEATURE_DISABLED.message }, meta: {}, requestId }, { status: 403 })
  let body: z.infer<typeof Body>
  let resolved: Awaited<ReturnType<typeof resolveConciergeIdentity>>
  try {
    body = Body.parse(await req.json())
    resolved = await resolveConciergeIdentity(req)
    await assertConciergeEntitlement(req, resolved.identity, routeConciergeIntent(body.message).requiresWebResearch)
  } catch (error) {
    const appError = isAppError(error) ? error : error instanceof z.ZodError ? new AppError("VALIDATION_ERROR") : new AppError("INTERNAL_ERROR", { internal: error })
    return NextResponse.json({ data: null, error: { code: appError.code, message: appError.safeMessage }, meta: {}, requestId }, { status: appError.status })
  }
  const startedAt = Date.now()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const send = (value: unknown) => {
        if (closed || req.signal.aborted) return false
        try { controller.enqueue(encode(value)); return true }
        catch { closed = true; return false }
      }
      try {
        send({ type: "status", requestId, message: "Starting perfume intelligence" })
        const result = await orchestrateConciergeTurn({
          requestId, identity: resolved.identity, ...body, signal: req.signal,
          onStatus: (message) => send({ type: "status", message }),
          onDelta: (delta) => { if (!send({ type: "delta", delta })) throw new AppError("SERVICE_UNAVAILABLE", { message: "Generation was cancelled." }) },
        })
        if (req.signal.aborted || closed) throw new AppError("SERVICE_UNAVAILABLE", { message: "Generation was cancelled." })
        if (result.products.length) send({ type: "products", products: result.products })
        if (result.sources.length) send({ type: "sources", sources: result.sources })
        send({ type: "done", result: { ...result, answer: undefined } })
        await recordConciergeUsage({ requestId, identity: resolved.identity, result, startedAt, completionStatus: "SUCCESS" })
      } catch (error) {
        const appError = isAppError(error) ? error : new AppError("INTERNAL_ERROR", { internal: error })
        send({ type: "error", error: { code: appError.code, message: appError.safeMessage, retryable: appError.status >= 500 } })
        await recordConciergeUsage({ requestId, identity: resolved.identity, startedAt, completionStatus: req.signal.aborted ? "CANCELLED" : "FAILED", errorCode: appError.code })
      } finally { if (!closed) { try { controller.close() } catch { /* Client disconnected. */ } } }
    },
  })
  const response = new NextResponse(stream, { status: 200, headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-request-id": requestId, "x-content-type-options": "nosniff" } })
  if (resolved.newGuestToken) response.cookies.set(GUEST_COOKIE, resolved.newGuestToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 })
  return response
}
