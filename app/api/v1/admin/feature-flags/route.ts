// app/api/v1/admin/feature-flags/route.ts
// GET -> effective feature flags (env-driven) + any persisted FeatureFlag rows. Read-only: flags are
// controlled via the FEATURE_FLAGS env var so behaviour is reproducible across deploys (see
// lib/config/feature-flags.ts). Owner/admin-only.
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { prisma } from '@/lib/prisma'
import { allFlags } from '@/lib/config/feature-flags'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'settings:manage')) raise('FORBIDDEN')
  const persisted = await prisma.featureFlag.findMany({ select: { key: true, enabled: true, description: true } }).catch(() => [])
  return { data: { effective: allFlags(), persisted, source: 'FEATURE_FLAGS env var' } }
})
