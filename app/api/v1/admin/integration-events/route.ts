// app/api/v1/admin/integration-events/route.ts
// GET /api/v1/admin/integration-events?processed=false&provider= -> ADMIN-only webhook/event log.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'settings:manage')) raise('FORBIDDEN')
  const sp = req.nextUrl.searchParams
  const where: Record<string, unknown> = {}
  const processed = sp.get('processed')
  if (processed === 'true' || processed === 'false') where.processed = processed === 'true'
  const provider = sp.get('provider')
  if (provider) where.provider = provider

  const events = await prisma.integrationEvent.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 })
  return { data: { events }, meta: { count: events.length } }
})
