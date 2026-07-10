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

    const defaultFrom = 'Fádé Essence <onboarding@resend.dev>'
    const fromAddress = process.env.NEWSLETTER_FROM_EMAIL?.trim() || defaultFrom
    const usingDefaultSender = fromAddress === defaultFrom || fromAddress.includes('onboarding@resend.dev')
    const plaintextFallback = text?.trim() || stripHtml(html)
    const resend = new Resend(resendKey)

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { unsubscribedAt: null },
      select: { email: true },
    })

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: 'No subscribers found. Subscriptions are stored in NewsletterSubscriber.' },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      subscribers.map((sub) =>
        resend.emails
          .send({
            from: fromAddress,
            to: sub.email,
            subject,
            html: personalize(html, null),
            text: personalize(plaintextFallback, null),
          })
          .then(() => ({ success: true }))
          .catch((error) => ({ error: error instanceof Error ? error.message : String(error), email: sub.email }))
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
      ...(usingDefaultSender && {
        hint: 'Using Resend default sender. Verify a domain in Resend and set NEWSLETTER_FROM_EMAIL so all subscribers receive emails.',
      }),
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
