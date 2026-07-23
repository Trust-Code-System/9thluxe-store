import { NextRequest, NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { exportFormSubmissions, isFormStatus } from "@/lib/forms/submissions"

export async function GET(request: NextRequest) {
  const authz = await getAuthorizedUser("support:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  const rawStatus = request.nextUrl.searchParams.get("status")
  const csv = await exportFormSubmissions({ query: request.nextUrl.searchParams.get("q") ?? undefined, status: isFormStatus(rawStatus) ? rawStatus : undefined })
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"` } })
}
