// app/api/v1/admin/status/route.ts
// GET /api/v1/admin/status -> ADMIN-only integration + provider + feature-flag status. Read-only.
// Never exposes secret values (only whether each integration is configured).
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { integrationStatus } from '@/lib/env'
import { providerStatus } from '@/integrations/registry'
import { allFlags } from '@/lib/config/feature-flags'
import {
  checkJobReadiness,
  checkRedisReadiness,
} from '@/lib/readiness'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'dashboard:view')) raise('FORBIDDEN')
  const [redis, jobs] = await Promise.all([
    checkRedisReadiness(),
    checkJobReadiness(),
  ])
  return {
    data: {
      integrations: integrationStatus(),
      providers: providerStatus(),
      featureFlags: allFlags(),
      readiness: { redis, jobs },
    },
  }
})
