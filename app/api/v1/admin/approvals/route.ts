// app/api/v1/admin/approvals/route.ts
// GET  /api/v1/admin/approvals?status=PENDING -> list approval requests
// POST /api/v1/admin/approvals                -> create an approval request (never auto-executes)
import { z } from 'zod'
import { route, raise } from '@/lib/http/handler'
import { getAdminUser } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { createApproval } from '@/lib/approvals/service'
import type { ApprovalStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID: ApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'EXECUTED']

export const GET = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const statusParam = (req.nextUrl.searchParams.get('status') || 'PENDING').toUpperCase()
  const status = (VALID as string[]).includes(statusParam) ? (statusParam as ApprovalStatus) : 'PENDING'
  const approvals = await prisma.approvalRequest.findMany({ where: { status }, orderBy: { createdAt: 'desc' }, take: 100 })
  return { data: { approvals, status }, meta: { count: approvals.length } }
})

const createSchema = z.object({
  action: z.enum(['refund', 'discount', 'price_change', 'publish', 'reorder', 'compensation', 'campaign', 'stock_adjust', 'ai_content']),
  reason: z.string().min(1).max(500),
  dataSource: z.string().max(200).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  requiredApprover: z.string().max(120).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export const POST = route(async ({ req }) => {
  const admin = await getAdminUser()
  if (!admin) raise('FORBIDDEN')
  const body = createSchema.parse(await req.json())
  const approval = await createApproval({ ...body, createdBy: admin!.id })
  return { data: { approval }, status: 201 }
})
