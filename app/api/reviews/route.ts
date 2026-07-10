import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ reviews: [] })
  }

  const filter = request.nextUrl.searchParams.get('filter') || 'recent'
  const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
    filter === 'highest'
      ? [{ rating: 'desc' }, { createdAt: 'desc' }]
      : filter === 'lowest'
      ? [{ rating: 'asc' }, { createdAt: 'desc' }]
      : [{ createdAt: 'desc' }]

  const reviews = await prisma.review.findMany({
    where: { productId, approved: true },
    orderBy,
    take: 25,
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json({ reviews })
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ success: false, error: 'You must sign in to submit a review.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 })
    }

    const payload = await request.json()
    const productId = String(payload.productId || '').trim()
    const rating = Math.floor(Number(payload.rating) || 0)
    const comment = typeof payload.comment === 'string' ? payload.comment.trim() : ''
    const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : user.name
    const tag = typeof payload.tag === 'string' ? payload.tag.trim() : null

    if (!productId || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Product ID and rating (1-5) are required.' }, { status: 400 })
    }

    await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        comment: comment || null,
        approved: true,
        displayName: displayName || undefined,
        tag: tag || undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create review error', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to store review',
      },
      { status: 500 }
    )
  }
}
