// app/api/v1/admin/approvals/[id]/route.ts
// POST /api/v1/admin/approvals/:id  { op: 'approve' | 'reject' | 'execute' }
// Approval and execution are SEPARATE operations: an approval is never executed at decision time.
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { hasCapability, resolveRole } from '@/lib/authz-core'
import { decideApproval, executeApproval } from '@/lib/approvals/service'

export const runtime = 'nodejs'

const bodySchema = z.object({ op: z.enum(['approve', 'reject', 'execute']) })

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  if (!hasCapability(resolveRole(admin), 'orders:manage')) raise('FORBIDDEN')

  const parts = req.nextUrl.pathname.split('/').filter(Boolean)
  const id = parts[parts.length - 1]
  if (!id) raise('VALIDATION_ERROR', 'Missing approval id.')

  const { op } = bodySchema.parse(await req.json())

  if (op === 'execute') {
    const result = await executeApproval(id, admin!.id)
    return { data: result }
  }
  const approval = await decideApproval(id, op, admin!.id)
  return { data: { approval } }
})
