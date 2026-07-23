import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { restoreStory, StoryServiceError } from "@/lib/stories/service"

export const runtime = "nodejs"

// POST - restore a trashed story
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  const { id } = await params
  try {
    const story = await restoreStory(id, { actorId: admin.id, actorRole: admin.role })
    return NextResponse.json({ story })
  } catch (error) {
    if (error instanceof StoryServiceError) {
      const status = error.code === "NOT_FOUND" ? 404 : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error("Restore story error:", error)
    return NextResponse.json({ error: "Failed to restore story" }, { status: 500 })
  }
}
