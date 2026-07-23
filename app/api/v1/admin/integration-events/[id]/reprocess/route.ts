// app/api/v1/admin/integration-events/[id]/reprocess/route.ts
// POST /api/v1/admin/integration-events/:id/reprocess -> ADMIN-only re-queue of an integration event.
// Idempotency (WebhookReceipt) still guards duplicate side-effects.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { reprocessIntegrationEvent } from '@/lib/ops/reprocess'

export const runtime = 'nodejs'

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'settings:manage')) raise('FORBIDDEN')
  const parts = req.nextUrl.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 2] // .../integration-events/<id>/reprocess
  if (!id) raise('VALIDATION_ERROR', 'Missing integration event id.')
  const result = await reprocessIntegrationEvent(id, admin!.id)
  return { data: result }
})
