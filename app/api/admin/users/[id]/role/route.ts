import { NextRequest, NextResponse } from "next/server"
import type { AdminRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import { getAuthorizedUser } from "@/lib/authz"

export const runtime = "nodejs"

const VALID_ROLES: AdminRole[] = [
  "SUPER_ADMIN",
  "CONTENT_MANAGER",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "MARKETING_MANAGER",
  "ANALYST",
]

// PATCH - set a user's admin access. Body: { role: "none" | AdminRole }
// "none" revokes admin access (role=USER, adminRole=null); any AdminRole grants ADMIN + that role.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await getAuthorizedUser("users:manage")
  if (!authz.ok) {
    return NextResponse.json(
      { error: authz.status === 403 ? "Forbidden" : "Unauthorized" },
      { status: authz.status }
    )
  }
  const actor = authz.user
  const { id } = await params

  if (id === actor.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const requested = body?.role

  let data: { role: "USER" | "ADMIN"; adminRole: AdminRole | null }
  if (requested === "none") {
    data = { role: "USER", adminRole: null }
  } else if (typeof requested === "string" && VALID_ROLES.includes(requested as AdminRole)) {
    data = { role: "ADMIN", adminRole: requested as AdminRole }
  } else {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, adminRole: true },
  })

  await writeAudit({
    actorId: actor.id,
    actorRole: actor.role,
    action: "user.role_change",
    targetType: "User",
    targetId: id,
    metadata: { email: target.email, role: data.role, adminRole: data.adminRole },
  })

  return NextResponse.json({ user: updated })
}
