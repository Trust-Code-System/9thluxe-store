import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"

export async function captureRevision(entityType: "Story" | "Page", entityId: string, snapshot: unknown, createdBy?: string) {
  try {
    const latest = await prisma.contentRevision.findFirst({ where: { entityType, entityId }, orderBy: { version: "desc" }, select: { version: true } })
    return await prisma.contentRevision.create({ data: { entityType, entityId, version: (latest?.version ?? 0) + 1, snapshot: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue, createdBy } })
  } catch (error) {
    if ((error as { code?: string }).code === "P2021") return null
    throw error
  }
}

export function listRevisions(entityType: "Story" | "Page", entityId: string) {
  return prisma.contentRevision.findMany({ where: { entityType, entityId }, orderBy: { version: "desc" }, take: 50 })
}

export async function getRevision(id: string) {
  return prisma.contentRevision.findUnique({ where: { id } })
}

export async function auditRestore(revisionId: string, entityType: string, entityId: string, actor: { actorId: string; actorRole: string }) {
  await writeAudit({ actorId: actor.actorId, actorRole: actor.actorRole, action: "revision.restore", targetType: entityType, targetId: entityId, metadata: { revisionId } })
}
