// app/api/v1/admin/ai-cost/route.ts
// GET -> AI cost + prompt-version report. Per-process usage aggregation (see integrations/ai/cost.ts
// note on durable persistence). Owner-only.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { aiUsageSnapshot, PROMPT_VERSIONS } from '@/integrations/ai/cost'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const snapshot = aiUsageSnapshot()
  return { data: { usage: snapshot.records, totals: snapshot.totals, promptVersions: PROMPT_VERSIONS, scope: 'process' } }
})
