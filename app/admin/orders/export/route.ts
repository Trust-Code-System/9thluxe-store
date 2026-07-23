// app/admin/orders/export/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthorizedUser } from '@/lib/authz'
import { OrderStatus } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const authz = await getAuthorizedUser('orders:view')
  if (!authz.ok) {
    return new Response(authz.status === 403 ? 'Forbidden' : 'Unauthorized', { status: authz.status })
  }
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const status = (url.searchParams.get('status') || '') as OrderStatus | ''

  const where: any = {
    AND: [
      status ? { status } : {},
      q
        ? {
            OR: [
              { reference: { contains: q } },
              { user: { email: { contains: q } } },
              { items: { some: { product: { name: { contains: q } } } } },
            ],
          }
        : {},
    ],
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      reference: true,
      status: true,
      totalNGN: true,
      createdAt: true,
      user: { select: { email: true } },
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
  })

  const header = ['reference', 'status', 'totalNGN', 'createdAt', 'email', 'items'].join(',')
  const lines = rows.map((o) => {
    const items = o.items.map((it) => `${it.quantity}x ${it.product.name}`).join('; ')
    return [
      JSON.stringify(o.reference || ''),
      JSON.stringify(o.status),
      String(o.totalNGN),
      JSON.stringify(o.createdAt.toISOString()),
      JSON.stringify(o.user?.email || ''),
      JSON.stringify(items),
    ].join(',')
  })
  const csv = [header, ...lines].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="orders.csv"',
    },
  })
}
