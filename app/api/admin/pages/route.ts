import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { createPage, listPages, PageServiceError } from "@/lib/pages/service"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    return NextResponse.json({ pages: await listPages(request.nextUrl.searchParams.get("includeDeleted") === "1") })
  } catch {
    return NextResponse.json({ error: "Failed to load pages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    const page = await createPage(await request.json(), { actorId: authz.user.id, actorRole: authz.user.role })
    return NextResponse.json({ page }, { status: 201 })
  } catch (error) {
    if (error instanceof PageServiceError) return NextResponse.json({ error: error.message }, { status: error.code === "SLUG_TAKEN" ? 409 : 400 })
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
  }
}
