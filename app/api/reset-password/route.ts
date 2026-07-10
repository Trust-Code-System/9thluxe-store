import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'Fádé Essence <onboarding@resend.dev>'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists for this email, a reset link has been sent.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Store token in database (resetToken and resetTokenExpiry exist in User model)
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { resetToken, resetTokenExpiry },
    })

    const base = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
    const resetUrl = `${base}/auth/reset/${resetToken}`

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: FROM_EMAIL,
        to: normalizedEmail,
        subject: 'Reset your Fádé Essence password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #2f3e33; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-family: serif;">Fádé Essence</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
              <h2 style="color: #2f3e33; margin-top: 0;">Password Reset Request</h2>
              <p>Hello${user.name ? ` ${user.name}` : ''},</p>
              <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #2f3e33; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666; font-size: 13px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                Or copy this link into your browser:<br>
                <span style="color: #2f3e33; word-break: break-all;">${resetUrl}</span>
              </p>
            </div>
          </div>
        `,
      })
    } else {
      // Development: log the link instead of sending email
      console.log('[PASSWORD RESET] Reset link (no RESEND_API_KEY):', resetUrl)
    }

    return NextResponse.json({
      message: 'If an account exists for this email, a reset link has been sent.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to process reset request' },
      { status: 500 }
    )
  }
}
