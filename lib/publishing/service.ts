import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"

export interface PublishingResult {
  publishedStories: number
  publishedPages: number
  unpublishedStories: number
  unpublishedPages: number
}

export async function runScheduledPublishing(now = new Date(), actorId?: string): Promise<PublishingResult> {
  const job = await prisma.jobRun.create({ data: { name: "scheduled-publishing", status: "RUNNING", attempts: 1, scheduledAt: now, startedAt: new Date() } })
  try {
    const [publishedStories, publishedPages, unpublishedStories, unpublishedPages] = await prisma.$transaction([
      prisma.story.updateMany({ where: { status: "DRAFT", deletedAt: null, scheduledFor: { lte: now } }, data: { status: "PUBLISHED", publishedAt: now } }),
      prisma.page.updateMany({ where: { status: "DRAFT", deletedAt: null, scheduledFor: { lte: now } }, data: { status: "PUBLISHED", publishedAt: now } }),
      prisma.story.updateMany({ where: { status: "PUBLISHED", deletedAt: null, unpublishAt: { lte: now } }, data: { status: "ARCHIVED" } }),
      prisma.page.updateMany({ where: { status: "PUBLISHED", deletedAt: null, unpublishAt: { lte: now } }, data: { status: "ARCHIVED" } }),
    ])
    const result = {
      publishedStories: publishedStories.count,
      publishedPages: publishedPages.count,
      unpublishedStories: unpublishedStories.count,
      unpublishedPages: unpublishedPages.count,
    }
    await prisma.jobRun.update({ where: { id: job.id }, data: { status: "SUCCEEDED", finishedAt: new Date() } })
    await writeAudit({ actorId: actorId ?? null, actorRole: actorId ? "ADMIN" : "SYSTEM", action: "publishing.run", targetType: "ScheduledPublishing", targetId: job.id, metadata: result })
    return result
  } catch (error) {
    await prisma.jobRun.update({ where: { id: job.id }, data: { status: "FAILED", finishedAt: new Date(), lastError: String(error).slice(0, 1000) } }).catch(() => undefined)
    throw error
  }
}
