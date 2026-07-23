import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { sanitizeText } from "@/lib/stories/util"
import { writeAudit } from "@/lib/audit"
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const authz = await getAuthorizedUser("support:manage"); if (!authz.ok) return NextResponse.json({ error: "Forbidden" }, { status: authz.status }); const body = await request.json(); const id = (await params).id; const customer = await prisma.user.update({ where: { id }, data: { customerTags: sanitizeText(body.tags).slice(0, 500) || null, customerNotes: sanitizeText(body.notes).slice(0, 4000) || null, customerSegment: sanitizeText(body.segment).slice(0, 100) || null } }); await writeAudit({ actorId: authz.user.id, actorRole: authz.user.role, action: "customer.update", targetType: "User", targetId: id, metadata: { tagsChanged: true, notesChanged: true } }); return NextResponse.json({ customer: { id: customer.id } }) }
