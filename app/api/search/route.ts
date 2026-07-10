// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// SQLite note: `mode: 'insensitive'` isn't supported here.
// We emulate case-insensitive matching by probing a few common variants.
function buildSearchClauses(q: string) {
  const qTrim = q.trim()
  if (!qTrim) return []

  const lower = qTrim.toLowerCase()
  const upperFirst = qTrim[0].toUpperCase() + qTrim.slice(1)
  const variants = Array.from(new Set([qTrim, lower, upperFirst]))

  return variants.map((v) => ({
    OR: [{ name: { contains: v } }, { brand: { contains: v } }],
  }))
}

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return NextResponse.json({ items: [] })
    }

    // Build a few OR branches to approximate case-insensitive search on SQLite
    const clauses = buildSearchClauses(q)
    if (clauses.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const items = await prisma.product.findMany({
      where: { OR: clauses },
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        priceNGN: true,
        images: true,
        ratingAvg: true,
      },
      orderBy: [{ ratingAvg: 'desc' }, { createdAt: 'desc' }, { name: 'asc' }],
      take: 6,
    })

    return NextResponse.json({ items })
  } catch (err) {
    console.error('Search error', err)
    // Always return valid JSON so the client never chokes on res.json()
    return NextResponse.json({ items: [], error: 'search_failed' }, { status: 500 })
  }
}
