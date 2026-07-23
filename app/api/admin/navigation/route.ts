import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { getNavigationForAdmin, replaceMenu, NavigationError } from "@/lib/navigation/service"
import { NAV_LOCATIONS, isNavLocation } from "@/lib/navigation/defaults"

export const runtime = "nodejs"

// GET - all navigation items grouped by location + the location registry
export async function GET() {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    const menus = await getNavigationForAdmin()
    return NextResponse.json({ menus, locations: NAV_LOCATIONS })
  } catch (error) {
    console.error("Get navigation error:", error)
    return NextResponse.json({ error: "Failed to load navigation" }, { status: 500 })
  }
}

// PUT - replace all items for a single location
export async function PUT(request: NextRequest) {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  try {
    const body = await request.json()
    const location = body?.location
    if (typeof location !== "string" || !isNavLocation(location)) {
      return NextResponse.json({ error: "Invalid menu location" }, { status: 400 })
    }
    const items = Array.isArray(body?.items) ? body.items : []
    await replaceMenu(location, items, { actorId: admin.id, actorRole: admin.role })
    const menus = await getNavigationForAdmin()
    return NextResponse.json({ menus })
  } catch (error) {
    if (error instanceof NavigationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update navigation error:", error)
    return NextResponse.json({ error: "Failed to update navigation" }, { status: 500 })
  }
}
