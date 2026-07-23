import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import {
  getStoryForAdmin,
  updateStory,
  archiveStory,
  StoryServiceError,
} from "@/lib/stories/service"

export const runtime = "nodejs"

function statusFor(code: StoryServiceError["code"]): number {
  switch (code) {
    case "NOT_FOUND":
      return 404
    case "CONFLICT":
      return 409
    case "SLUG_TAKEN":
      return 409
    default:
      return 400
  }
}

// GET - single story (admin, includes drafts)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const { id } = await params
  try {
    const story = await getStoryForAdmin(id)
    return NextResponse.json({ story })
  } catch (error) {
    if (error instanceof StoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: statusFor(error.code) })
    }
    console.error("Get story error:", error)
    return NextResponse.json({ error: "Failed to load story" }, { status: 500 })
  }
}

// PATCH - update story
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
    const story = await updateStory(
      id,
      body,
      { actorId: admin.id, actorRole: admin.role },
      body.expectedUpdatedAt
    )
    return NextResponse.json({ story })
  } catch (error) {
    if (error instanceof StoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: statusFor(error.code) })
    }
    console.error("Update story error:", error)
    return NextResponse.json({ error: "Failed to update story" }, { status: 500 })
  }
}

// DELETE - trash (soft) by default; ?hard=1 permanently deletes
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await getAuthorizedUser("content:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const admin = authz.user
  const { id } = await params
  const hard = request.nextUrl.searchParams.get("hard") === "1"
  try {
    const result = await archiveStory(id, { actorId: admin.id, actorRole: admin.role }, hard)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    if (error instanceof StoryServiceError) {
      return NextResponse.json({ error: error.message }, { status: statusFor(error.code) })
    }
    console.error("Delete story error:", error)
    return NextResponse.json({ error: "Failed to delete story" }, { status: 500 })
  }
}
