import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { restorePage } from "@/lib/pages/service"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    return NextResponse.json({ page: await restorePage((await params).id, { actorId: authz.user.id, actorRole: authz.user.role }) })
  } catch {
    return NextResponse.json({ error: "Failed to restore page" }, { status: 500 })
  }
}
