import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { handlers } from "@/lib/auth"
import { clientIp, consumeRateLimit } from "@/lib/middleware/limiter"

export const GET = handlers.GET

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname.endsWith("/callback/credentials")) {
    let emailHash = "unknown"
    try {
      const form = await req.clone().formData()
      const email = String(form.get("email") ?? "").trim().toLowerCase()
      if (email) {
        emailHash = crypto.createHash("sha256").update(email).digest("hex")
      }
    } catch {
      // NextAuth will reject malformed callback bodies.
    }
    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit(`signin:ip:${clientIp(req)}`, 20, 15 * 60 * 1000),
      consumeRateLimit(`signin:email:${emailHash}`, 10, 15 * 60 * 1000),
    ])
    if (!ipLimit.ok || !emailLimit.ok) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait and try again." },
        { status: 429 },
      )
    }
  }
  return handlers.POST(req)
}
