import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { auditRestore, getRevision } from "@/lib/revisions/service"
import { updateStory } from "@/lib/stories/service"
import { updatePage } from "@/lib/pages/service"

function date(value: unknown) { return typeof value === "string" ? value : null }

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const revision = await getRevision((await params).id)
  if (!revision) return NextResponse.json({ error: "Revision not found" }, { status: 404 })
  const snapshot = revision.snapshot as Record<string, any>
  const actor = { actorId: authz.user.id, actorRole: authz.user.role }
  try {
    if (revision.entityType === "Story") {
      await updateStory(revision.entityId, { ...snapshot, title: String(snapshot.title ?? ""), scheduledFor: date(snapshot.scheduledFor), unpublishAt: date(snapshot.unpublishAt), blocks: (snapshot.blocks ?? []).map((block: any) => ({ type: block.type, position: block.position, data: block.data })), relatedProductIds: (snapshot.relatedProducts ?? []).map((item: any) => item.productId) }, actor)
    } else if (revision.entityType === "Page") {
      await updatePage(revision.entityId, { ...snapshot, title: String(snapshot.title ?? ""), scheduledFor: date(snapshot.scheduledFor), unpublishAt: date(snapshot.unpublishAt), blocks: (snapshot.blocks ?? []).map((block: any) => ({ type: block.type, position: block.position, data: block.data })) }, actor)
    } else return NextResponse.json({ error: "Unsupported revision" }, { status: 400 })
    await auditRestore(revision.id, revision.entityType, revision.entityId, actor)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Restore failed" }, { status: 400 })
  }
}
