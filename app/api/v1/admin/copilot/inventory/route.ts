// app/api/v1/admin/copilot/inventory/route.ts
// GET -> Owner Copilot inventory assistant: reorder recommendations + stockout predictions (with
// confidence + assumptions), dead stock and back-in-stock demand. Read-only; executes nothing.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { buildInventoryAssistantReport } from '@/lib/copilot/inventory-assistant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'products:manage')) raise('FORBIDDEN')
  const report = await buildInventoryAssistantReport()
  return { data: { report } }
})
