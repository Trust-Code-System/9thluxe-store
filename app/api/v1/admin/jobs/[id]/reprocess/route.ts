// app/api/v1/admin/jobs/[id]/reprocess/route.ts
// POST /api/v1/admin/jobs/:id/reprocess -> ADMIN-only re-queue of a FAILED job.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { reprocessJob } from '@/lib/ops/reprocess'

export const runtime = 'nodejs'

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const parts = req.nextUrl.pathname.split('/').filter(Boolean)
  // .../jobs/<id>/reprocess -> id is second-to-last
  const id = parts[parts.length - 2]
  if (!id) raise('VALIDATION_ERROR', 'Missing job id.')
  const job = await reprocessJob(id, admin!.id)
  return { data: { job } }
})
