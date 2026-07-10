import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { rateLimit } from "@/lib/middleware/rate-limit"
import { emailSchema, nameSchema, validateAndSanitize } from "@/lib/middleware/validate-input"
import { z } from "zod"

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message too short").max(5000),
})

function getClientId(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anonymous"
}

const STORE_EMAIL = "fadeessencee@gmail.com"
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || "Fádé Essence <onboarding@resend.dev>"

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(getClientId(req), 5, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 })
    }

    const body = await req.json()
    const validated = validateAndSanitize(contactSchema, body)
    if (!validated.success) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const { name, email, subject, message } = validated.data

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Notify store owner
      await resend.emails.send({
        from: FROM_EMAIL,
        to: STORE_EMAIL,
        replyTo: email,
        subject: `Contact Form: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2f3e33;">New Contact Form Submission</h2>
            <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        `,
      }).catch((err) => console.error("[CONTACT] Failed to send store notification:", err))

      // Auto-reply to sender
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `We received your message — Fádé Essence`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #2f3e33; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-family: serif;">Fádé Essence</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #2f3e33; margin-top: 0;">Thank you for reaching out, ${name}!</h2>
              <p>We've received your message and will get back to you within 24–48 hours.</p>
              <p><strong>Your message:</strong></p>
              <blockquote style="border-left: 3px solid #2f3e33; margin: 0; padding: 10px 20px; background: white; border-radius: 0 4px 4px 0;">
                <p style="white-space: pre-wrap; color: #555;">${message}</p>
              </blockquote>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you need urgent assistance, you can also reach us at ${STORE_EMAIL} or +234 8160591348.
              </p>
            </div>
          </div>
        `,
      }).catch((err) => console.error("[CONTACT] Failed to send auto-reply:", err))
    } else {
      console.log("[CONTACT] No RESEND_API_KEY — skipping email:", { name, email, subject })
    }

    return NextResponse.json(
      { message: "Thank you for contacting us! We'll get back to you soon." },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 })
  }
}
