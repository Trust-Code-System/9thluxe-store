import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { toSafeAuthErrorMessage } from '@/lib/prisma-error'
import { generateReferralCode } from '@/lib/referrals/code'
import { attributeReferral } from '@/lib/referrals/service'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, referredBy } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    const hash = await bcrypt.hash(password, 10)

    // Generate unique referral code for the new user
    let referralCode = generateReferralCode()
    let attempts = 0
    while (attempts < 5) {
      const existing = await prisma.user.findUnique({ where: { referralCode } })
      if (!existing) break
      referralCode = generateReferralCode()
      attempts++
    }

    const user = await prisma.user.create({ data: { email, name, passwordHash: hash, referralCode } })

    // Attribute the referral (creates a Referral row + fraud guards). Best-effort: never blocks signup.
    if (referredBy) {
      await attributeReferral(user.id, String(referredBy)).catch(() => null)
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json({ error: toSafeAuthErrorMessage(error) }, { status: 500 })
  }
}
