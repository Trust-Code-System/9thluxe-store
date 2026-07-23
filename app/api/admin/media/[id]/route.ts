import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { updateMedia, deleteMedia, findUsage, MediaError } from "@/lib/media/service"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function statusFor(code: MediaError["code"]): number {
  switch (code) {
    case "NOT_FOUND":
      return 404
    case "IN_USE":
      return 409
    default:
      return 400
  }
}

// GET - usage of a single asset
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const { id } = await params
  const asset = await prisma.mediaAsset.findUnique({ where: { id } })
  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 })
  const usage = await findUsage(asset.url)
  return NextResponse.json({ usage })
}

// PATCH - update alt/caption
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  const { id } = await params
  try {
    const body = await request.json()
    const asset = await updateMedia(id, body, { actorId: admin.id, actorRole: admin.role })
    return NextResponse.json({ asset })
  } catch (error) {
    if (error instanceof MediaError) {
      return NextResponse.json({ error: error.message }, { status: statusFor(error.code) })
    }
    console.error("Update media error:", error)
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 })
  }
}

// DELETE - soft-delete (blocked if referenced unless ?force=1)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  const { id } = await params
  const force = request.nextUrl.searchParams.get("force") === "1"
  try {
    await deleteMedia(id, { actorId: admin.id, actorRole: admin.role }, force)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof MediaError) {
      if (error.code === "IN_USE") {
        return NextResponse.json({ error: error.message, code: "IN_USE" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: statusFor(error.code) })
    }
    console.error("Delete media error:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}
