import { NextRequest, NextResponse } from "next/server"
import { runScheduledPublishing } from "@/lib/publishing/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    return NextResponse.json({ ok: true, result: await runScheduledPublishing() })
  } catch (error) {
    console.error("Scheduled publishing failed:", error)
    return NextResponse.json({ error: "Scheduled publishing failed" }, { status: 500 })
  }
}
