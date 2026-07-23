import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { prisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/audit"
import { normalizeRedirectDestination, normalizeRedirectSource } from "@/lib/redirects/util"

export async function GET() {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: "Forbidden" }, { status: authz.status })
  return NextResponse.json({ redirects: await prisma.redirect.findMany({ orderBy: { source: "asc" } }) })
}

export async function POST(request: NextRequest) {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: "Forbidden" }, { status: authz.status })
  const body = await request.json()
  const source = normalizeRedirectSource(body.source)
  const destination = normalizeRedirectDestination(body.destination)
  if (!source || !destination || source === destination) return NextResponse.json({ error: "Enter distinct, safe source and destination paths" }, { status: 400 })
  try {
    const item = await prisma.redirect.upsert({ where: { source }, create: { source, destination, permanent: body.permanent !== false, active: body.active !== false, createdBy: authz.user.id }, update: { destination, permanent: body.permanent !== false, active: body.active !== false } })
    await writeAudit({ actorId: authz.user.id, actorRole: authz.user.role, action: "redirect.upsert", targetType: "Redirect", targetId: item.id, metadata: { source, destination } })
    return NextResponse.json({ redirect: item })
  } catch { return NextResponse.json({ error: "Failed to save redirect" }, { status: 500 }) }
}
