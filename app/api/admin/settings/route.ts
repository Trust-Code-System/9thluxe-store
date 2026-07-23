import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { getSiteSettings, updateSettings, SettingsError } from "@/lib/settings/service"
import { SETTINGS } from "@/lib/settings/schema"

export const runtime = "nodejs"

// GET - current effective settings + field registry (so the admin UI can render the form)
export async function GET() {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    const values = await getSiteSettings()
    return NextResponse.json({ values, fields: SETTINGS })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

// PATCH - update a partial set of settings
export async function PATCH(request: NextRequest) {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  try {
    const body = await request.json()
    const patch = (body && typeof body === "object" && body.values) || body
    const values = await updateSettings(patch, { actorId: admin.id, actorRole: admin.role })
    return NextResponse.json({ values })
  } catch (error) {
    if (error instanceof SettingsError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
