// lib/http/handler.ts
// Wraps App Router route handlers so that:
//  - every response carries a requestId and the standard envelope
//  - thrown AppErrors, ZodErrors, and unknown errors become SAFE responses (no stack/secret)
//  - request-size limits are enforced
//  - every failure is logged with structured context
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, isAppError, type ErrorCode } from './errors'
import { ok, fail, type Envelope } from './envelope'
import { logger } from '@/lib/observability/logger'

export function newRequestId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}

export interface Ctx {
  requestId: string
  req: NextRequest
}

type Handler<T> = (ctx: Ctx) => Promise<{ data: T; meta?: Record<string, unknown>; status?: number }>

const MAX_BODY_BYTES = 1_000_000 // 1 MB default cap for JSON APIs

export function jsonResponse<T>(env: Envelope<T>, status: number): NextResponse {
  return NextResponse.json(env, {
    status,
    headers: {
      'x-request-id': env.requestId,
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-store',
    },
  })
}

function mapZodError(err: ZodError): AppError {
  const fieldErrors = err.errors.map((e) => ({
    field: e.path.join('.') || '(root)',
    message: e.message,
  }))
  return new AppError('VALIDATION_ERROR', { fieldErrors })
}

/** Enforce a maximum body size using the Content-Length header when present. */
export function assertBodySize(req: NextRequest, maxBytes = MAX_BODY_BYTES) {
  const len = req.headers.get('content-length')
  if (len && Number(len) > maxBytes) {
    throw new AppError('REQUEST_TOO_LARGE')
  }
}

/**
 * Compose a safe route handler. Usage:
 *   export const POST = route(async ({ req, requestId }) => ({ data: ... }))
 */
export function route<T>(handler: Handler<T>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = newRequestId()
    const routePath = new URL(req.url).pathname
    try {
      assertBodySize(req)
      const { data, meta, status } = await handler({ requestId, req })
      return jsonResponse(ok(data, meta ?? {}, requestId), status ?? 200)
    } catch (err) {
      const appErr = isAppError(err)
        ? err
        : err instanceof ZodError
          ? mapZodError(err)
          : new AppError('INTERNAL_ERROR', { internal: err })

      // Log with full internal context; NEVER returned to the client.
      const logCtx = {
        requestId,
        route: routePath,
        code: appErr.code,
        status: appErr.status,
        internal:
          appErr.internal instanceof Error
            ? { name: appErr.internal.name, message: appErr.internal.message, stack: appErr.internal.stack }
            : appErr.internal,
      }
      if (appErr.status >= 500) logger.error('request_failed', logCtx)
      else logger.warn('request_rejected', logCtx)

      return jsonResponse(
        fail(
          { code: appErr.code, message: appErr.safeMessage, fieldErrors: appErr.fieldErrors },
          requestId,
        ),
        appErr.status,
      )
    }
  }
}

/** Convenience to throw a catalogue error inline. */
export function raise(code: ErrorCode, message?: string): never {
  throw new AppError(code, message ? { message } : undefined)
}
