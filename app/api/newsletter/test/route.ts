import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

/** Admin-only: send a test newsletter email. Recipient from body or env NEWSLETTER_TEST_EMAIL. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { role: true } })
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not set', success: false }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const to = (body.to as string) || process.env.NEWSLETTER_TEST_EMAIL || email

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to,
      subject: 'Test Newsletter - Fádé',
      html: `
        <h1>🎉 Newsletter Integration Working!</h1>
        <p>This is a test email from your Fádé store.</p>
        <p>Your Resend integration is set up correctly.</p>
        <hr>
        <p><small>If you received this, you're all set to send newsletters!</small></p>
      `
    })
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message || 'Failed to send test email' }, { status: 400 })
    }
    return NextResponse.json({ success: true, message: 'Test email sent.', emailId: data?.id })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
