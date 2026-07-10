import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function personalize(content: string, name?: string | null) {
  const sanitized = content.replace(/{{\s*name\s*}}/gi, name?.trim() || 'Friend')
  return sanitized
}

export async function POST(request: Request) {
  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!resendKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is required to send newsletters' },
      { status: 400 }
    )
  }

  try {
    await requireAdmin()

    const { subject, html, text } = await request.json()

    if (!subject || !html) {
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      )
    }

    const fromAddress = process.env.NEWSLETTER_FROM_EMAIL?.trim() || 'Fàdè Essence <onboarding@resend.dev>'
    const plaintextFallback = text?.trim() || stripHtml(html)
    const resend = new Resend(resendKey)

    const subscribers = await prisma.user.findMany({
      where: { marketingEmails: true },
      select: { id: true, email: true, name: true },
    })

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found' },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      subscribers.map((user) =>
        resend.emails
          .send({
            from: fromAddress,
            to: user.email,
            subject,
            html: personalize(html, user.name),
            text: personalize(plaintextFallback, user.name),
          })
          .then(() => ({ success: true }))
          .catch((error) => ({ error: error instanceof Error ? error.message : String(error), email: user.email }))
      )
    )

    const successCount = results.filter((r) => !('error' in r)).length
    const failureCount = results.filter((r) => 'error' in r).length
    const failures = results
      .filter((r) => 'error' in r)
      .map((r) => `${(r as { email: string }).email || 'unknown'}: ${(r as { error: string }).error}`)
      .slice(0, 5)

    await prisma.newsletterCampaign.create({
      data: {
        subject,
        html,
        text: text ?? '',
        status: 'SENT',
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      total: subscribers.length,
      sent: successCount,
      failed: failureCount,
      failures,
    })
  } catch (error) {
    console.error('Newsletter send error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send newsletter',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
