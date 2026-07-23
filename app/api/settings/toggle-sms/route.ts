import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import crypto from "node:crypto"
import { consumeRateLimit } from "@/lib/middleware/limiter"
import { hasTrustedOrigin } from "@/lib/security/origin"

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const session = await auth()
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const identity = crypto.createHash("sha256").update(email).digest("hex")
    const limit = await consumeRateLimit(
      `account:sms-setting:${identity}`,
      30,
      60 * 60 * 1000,
    )
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many changes" }, { status: 429 })
    }

    const { enabled } = await request.json()
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "Invalid preference" }, { status: 400 })
    }

    await prisma.user.update({
      where: { email },
      data: { smsNotifications: enabled },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update SMS preference:", error)
    return NextResponse.json({ error: "Failed to update preference" }, { status: 500 })
  }
}


