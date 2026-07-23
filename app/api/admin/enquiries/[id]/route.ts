import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { updateFormSubmission } from "@/lib/forms/submissions"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authz = await getAuthorizedUser("support:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    const submission = await updateFormSubmission((await params).id, await request.json(), { actorId: authz.user.id, actorRole: authz.user.role })
    return NextResponse.json({ submission })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update enquiry"
    return NextResponse.json({ error: message }, { status: message === "Submission not found" ? 404 : 400 })
  }
}
