// lib/ops/reprocess.ts
// Reprocessing for failed background jobs and unprocessed/failed integration (webhook) events.
// Reprocessing only re-queues work; it never bypasses idempotency (WebhookReceipt still guards
// duplicate side-effects).
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/http/errors'
import { writeAudit } from '@/lib/audit'

/** Re-queue a failed job: reset to PENDING and schedule immediately. Only FAILED jobs are eligible. */
export async function reprocessJob(id: string, actorId: string) {
  const job = await prisma.jobRun.findUnique({ where: { id }, select: { status: true } })
  if (!job) throw new AppError('NOT_FOUND')
  if (job.status !== 'FAILED') throw new AppError('VALIDATION_ERROR', { message: `Only FAILED jobs can be reprocessed (status ${job.status}).` })

  const updated = await prisma.jobRun.update({
    where: { id },
    data: { status: 'PENDING', lastError: null, scheduledAt: new Date(), finishedAt: null },
  })
  await writeAudit({ actorId, actorRole: 'ADMIN', action: 'job.reprocess', targetType: 'JobRun', targetId: id })
  return updated
}

/** Re-queue an integration event: clear processed/error and enqueue a reprocess JobRun. */
export async function reprocessIntegrationEvent(id: string, actorId: string) {
  const evt = await prisma.integrationEvent.findUnique({ where: { id }, select: { provider: true, topic: true } })
  if (!evt) throw new AppError('NOT_FOUND')

  const [updated, job] = await prisma.$transaction([
    prisma.integrationEvent.update({ where: { id }, data: { processed: false, error: null } }),
    prisma.jobRun.create({
      data: { name: `integration_reprocess:${evt.provider}:${evt.topic}`, status: 'PENDING', scheduledAt: new Date() },
    }),
  ])
  await writeAudit({ actorId, actorRole: 'ADMIN', action: 'integration_event.reprocess', targetType: 'IntegrationEvent', targetId: id, metadata: { jobId: job.id } })
  return { event: updated, job }
}
