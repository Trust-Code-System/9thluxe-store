// lib/audit/filters.ts
// Pure helpers for the audit-log viewer. No server-only imports, so this is safe to unit-test and
// to reuse from the admin page and the existing api/v1/admin/audit route.

export const AUDIT_PAGE_SIZE = 50

export interface AuditFilterInput {
  actorId?: string | null
  action?: string | null
  targetType?: string | null
  targetId?: string | null
}

/**
 * Build a Prisma `where` for AuditLog from raw filter strings. Empty / whitespace values are
 * dropped so they never narrow the query. `action` is matched case-insensitively (contains); the
 * other fields match exactly, matching the existing api/v1/admin/audit contract.
 */
export function buildAuditWhere(input: AuditFilterInput): Record<string, unknown> {
  const where: Record<string, unknown> = {}
  const actorId = clean(input.actorId)
  const targetType = clean(input.targetType)
  const targetId = clean(input.targetId)
  const action = clean(input.action)
  if (actorId) where.actorId = actorId
  if (targetType) where.targetType = targetType
  if (targetId) where.targetId = targetId
  if (action) where.action = { contains: action, mode: "insensitive" }
  return where
}

/** Parse a 1-based page number from an untrusted query value. Defaults to 1, clamped sane. */
export function parsePage(raw: string | null | undefined): number {
  const n = Number.parseInt(String(raw ?? ""), 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, 100000)
}

/** How many rows to skip for a given 1-based page. */
export function pageSkip(page: number, pageSize: number = AUDIT_PAGE_SIZE): number {
  return (Math.max(1, page) - 1) * pageSize
}

/** Total number of pages for a row count (at least 1). */
export function pageCount(total: number, pageSize: number = AUDIT_PAGE_SIZE): number {
  if (total <= 0) return 1
  return Math.ceil(total / pageSize)
}

function clean(v?: string | null): string | undefined {
  const t = (v ?? "").trim()
  return t.length ? t : undefined
}
