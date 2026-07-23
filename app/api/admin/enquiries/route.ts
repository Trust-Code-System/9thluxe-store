import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { isFormStatus, listFormSubmissions } from "@/lib/forms/submissions"

export async function GET(request: NextRequest) {
  const authz = await getAuthorizedUser("support:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const rawStatus = request.nextUrl.searchParams.get("status")
  try {
    const result = await listFormSubmissions({ query: request.nextUrl.searchParams.get("q") ?? undefined, status: isFormStatus(rawStatus) ? rawStatus : undefined })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Failed to load enquiries" }, { status: 500 })
  }
}
