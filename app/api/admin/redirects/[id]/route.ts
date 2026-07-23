import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: "Forbidden" }, { status: authz.status })
  const id = (await params).id
  await prisma.redirect.delete({ where: { id } })
  await writeAudit({ actorId: authz.user.id, actorRole: authz.user.role, action: "redirect.delete", targetType: "Redirect", targetId: id })
  return NextResponse.json({ ok: true })
}
