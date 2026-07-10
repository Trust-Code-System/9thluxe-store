// app/api/v1/admin/audit/route.ts
// GET /api/v1/admin/audit?targetType=&targetId=&action= -> ADMIN-only audit-log search.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')

  const sp = req.nextUrl.searchParams
  const where: Record<string, unknown> = {}
  const targetType = sp.get('targetType')
  const targetId = sp.get('targetId')
  const action = sp.get('action')
  if (targetType) where.targetType = targetType
  if (targetId) where.targetId = targetId
  if (action) where.action = { contains: action, mode: 'insensitive' }

  const entries = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return { data: { entries }, meta: { count: entries.length } }
})
