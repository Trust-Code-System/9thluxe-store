import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { getHomepageLayout, saveHomepageLayout, HomepageError } from "@/lib/homepage/service"
import { HOMEPAGE_SECTIONS } from "@/lib/homepage/registry"

export const runtime = "nodejs"

// GET - current merged layout + the section field registry
export async function GET() {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    const sections = await getHomepageLayout()
    return NextResponse.json({ sections, catalogue: HOMEPAGE_SECTIONS })
  } catch (error) {
    console.error("Get homepage layout error:", error)
    return NextResponse.json({ error: "Failed to load homepage layout" }, { status: 500 })
  }
}

// PUT - replace the whole layout
export async function PUT(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  try {
    const body = await request.json()
    const sections = Array.isArray(body?.sections) ? body.sections : []
    const saved = await saveHomepageLayout(sections, { actorId: admin.id, actorRole: admin.role })
    return NextResponse.json({ sections: saved })
  } catch (error) {
    if (error instanceof HomepageError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Save homepage layout error:", error)
    return NextResponse.json({ error: "Failed to save homepage layout" }, { status: 500 })
  }
}
