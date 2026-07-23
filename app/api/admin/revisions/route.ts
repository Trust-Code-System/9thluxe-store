import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { listRevisions } from "@/lib/revisions/service"

export async function GET(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const entityType = request.nextUrl.searchParams.get("entityType")
  const entityId = request.nextUrl.searchParams.get("entityId")
  if ((entityType !== "Story" && entityType !== "Page") || !entityId) return NextResponse.json({ error: "Invalid entity" }, { status: 400 })
  return NextResponse.json({ revisions: await listRevisions(entityType, entityId) })
}
