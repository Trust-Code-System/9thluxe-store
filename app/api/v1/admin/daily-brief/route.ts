// app/api/v1/admin/daily-brief/route.ts
// GET /api/v1/admin/daily-brief -> Owner Copilot daily brief. ADMIN only. Read-only aggregation with
// every metric traceable to its source query, plus a best-effort AI summary + suggested actions.
// The AI summary must derive only from the metrics JSON; it never executes any action.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { getAi } from '@/integrations/registry'
import { buildDailyBrief } from '@/lib/copilot/daily-brief'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')

  const brief = await buildDailyBrief()

  // Best-effort AI narrative; never blocks the metrics.
  let summary: { summary: string; actions: string[] } | null = null
  try {
    summary = await getAi().ownerBrief({ metricsJson: JSON.stringify(brief) })
  } catch {
    summary = null
  }

  return {
    data: {
      brief,
      ai: summary, // null if AI unavailable, metrics still returned
      note: 'Every metric is traceable via brief.sources. AI actions are suggestions and execute nothing.',
    },
  }
})
