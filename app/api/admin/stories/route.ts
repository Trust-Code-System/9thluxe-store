import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { listStories, createStory, StoryServiceError } from "@/lib/stories/service"

export const runtime = "nodejs"

// GET - list all stories (admin)
export async function GET(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })

  const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "1"
  try {
    const stories = await listStories({ includeDeleted })
    return NextResponse.json({ stories })
  } catch (error) {
    console.error("List stories error:", error)
    return NextResponse.json({ error: "Failed to load stories" }, { status: 500 })
  }
}

// POST - create story
export async function POST(request: NextRequest) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user

  try {
    const body = await request.json()
    const story = await createStory(body, { actorId: admin.id, actorRole: admin.role })
    return NextResponse.json({ story }, { status: 201 })
  } catch (error) {
    if (error instanceof StoryServiceError) {
      const status = error.code === "VALIDATION" ? 400 : error.code === "SLUG_TAKEN" ? 409 : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error("Create story error:", error)
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 })
  }
}
