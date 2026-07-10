// app/api/v1/admin/copilot/margin/route.ts
// GET ?days=30 -> Owner Copilot margin assistant. Returns null margin (with reason) when cost data
// is absent rather than fabricating numbers. Owner-only.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { buildMarginReport } from '@/lib/copilot/margin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const daysRaw = Number(req.nextUrl.searchParams.get('days') ?? 30)
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 30
  const report = await buildMarginReport(days)
  return { data: { report } }
})
