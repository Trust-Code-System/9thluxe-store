// lib/audit.ts
// Append-only audit logging for administrative + sensitive actions. Best-effort: auditing must not
// break the primary action, but failures are logged.
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/observability/logger'

export interface AuditEntry {
  actorId?: string | null
  actorRole?: string | null
  action: string
  targetType: string
  targetId?: string | null
  metadata?: Record<string, unknown>
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        metadata: (entry.metadata ?? undefined) as object | undefined,
      },
    })
  } catch (e) {
    logger.error('audit_write_failed', { action: entry.action, internal: String(e) })
  }
}
