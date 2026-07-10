// app/api/v1/admin/products/sync/route.ts
// POST { apply?: boolean } -> synchronize/validate the catalogue from the active commerce provider.
// Dry-run by default (apply=false). Owner/admin-only. Never deletes; publishes only eligible items.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { syncCatalog } from '@/lib/catalogue/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({ apply: z.boolean().optional() }).optional()

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  let apply = false
  try {
    const body = bodySchema.parse(await req.json().catch(() => ({})))
    apply = body?.apply ?? false
  } catch {
    apply = false
  }
  const report = await syncCatalog({ apply })
  return { data: { report } }
})
