// app/api/v1/admin/copilot/insights/route.ts
// GET -> Owner Copilot customer-insight assistant. Aggregated-only: review themes, support clusters,
// repeat-purchase and top products. Never exposes individual private conversations. Owner-only.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { buildInsightsReport } from '@/lib/copilot/insights'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const report = await buildInsightsReport()
  return { data: { report } }
})
