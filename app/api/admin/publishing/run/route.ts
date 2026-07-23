import { NextResponse } from "next/server"
import { getAuthorizedUser } from "@/lib/authz"
import { runScheduledPublishing } from "@/lib/publishing/service"

export async function POST() {
  const authz = await getAuthorizedUser("settings:manage")
  if (!authz.ok) return NextResponse.json({ error: authz.status === 403 ? "Forbidden" : "Unauthorized" }, { status: authz.status })
  try {
    return NextResponse.json({ ok: true, result: await runScheduledPublishing(new Date(), authz.user.id) })
  } catch {
    return NextResponse.json({ error: "Scheduled publishing failed" }, { status: 500 })
  }
}
