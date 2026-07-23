import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { getPageForAdmin, PageServiceError, trashPage, updatePage } from "@/lib/pages/service"

function status(error: PageServiceError) {
  if (error.code === "NOT_FOUND") return 404
  if (error.code === "CONFLICT" || error.code === "SLUG_TAKEN") return 409
  return 400
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    return NextResponse.json({ page: await getPageForAdmin((await params).id) })
  } catch (error) {
    if (error instanceof PageServiceError) return NextResponse.json({ error: error.message }, { status: status(error) })
    return NextResponse.json({ error: "Failed to load page" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    const body = await request.json()
    const page = await updatePage((await params).id, body, { actorId: authz.user.id, actorRole: authz.user.role }, body.expectedUpdatedAt)
    return NextResponse.json({ page })
  } catch (error) {
    if (error instanceof PageServiceError) return NextResponse.json({ error: error.message }, { status: status(error) })
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    return NextResponse.json({ page: await trashPage((await params).id, { actorId: authz.user.id, actorRole: authz.user.role }) })
  } catch (error) {
    if (error instanceof PageServiceError) return NextResponse.json({ error: error.message }, { status: status(error) })
    return NextResponse.json({ error: "Failed to archive page" }, { status: 500 })
  }
}
