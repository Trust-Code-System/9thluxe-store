// app/api/v1/admin/status/route.ts
// GET /api/v1/admin/status -> ADMIN-only integration + provider + feature-flag status. Read-only.
// Never exposes secret values (only whether each integration is configured).
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { integrationStatus } from '@/lib/env'
import { providerStatus } from '@/integrations/registry'
import { allFlags } from '@/lib/config/feature-flags'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  return {
    data: {
      integrations: integrationStatus(),
      providers: providerStatus(),
      featureFlags: allFlags(),
    },
  }
})
