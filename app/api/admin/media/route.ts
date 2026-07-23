import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { listMedia, registerUrl, MediaError } from "@/lib/media/service"

export const runtime = "nodejs"

// GET - list media (optional ?kind= & ?search=)
export async function GET(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const kind = request.nextUrl.searchParams.get("kind") ?? undefined
  const search = request.nextUrl.searchParams.get("search") ?? undefined
  try {
    const assets = await listMedia({ kind, search })
    return NextResponse.json({ assets })
  } catch (error) {
    console.error("List media error:", error)
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 })
  }
}

// POST - register an existing media URL
export async function POST(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  try {
    const body = await request.json()
    const asset = await registerUrl(body, { actorId: admin.id, actorRole: admin.role })
    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    if (error instanceof MediaError) {
      const status = error.code === "DUPLICATE" ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error("Register media error:", error)
    return NextResponse.json({ error: "Failed to register media" }, { status: 500 })
  }
}
