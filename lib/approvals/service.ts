// lib/approvals/service.ts
// Approval Centre. High-risk / outward-facing / financial actions are proposed, reviewed, and only
// then executed — NEVER auto-executed. Approval and execution are SEPARATE steps for every action.
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/http/errors'
import { writeAudit } from '@/lib/audit'
import type { ApprovalStatus } from '@prisma/client'

export type ApprovalAction =
  | 'refund'
  | 'discount'
  | 'price_change'
  | 'publish'
  | 'reorder'
  | 'compensation'
  | 'campaign'
  | 'stock_adjust'
  | 'ai_content'

export interface CreateApprovalInput {
  action: ApprovalAction
  reason: string
  dataSource?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  createdBy?: string
  requiredApprover?: string
  payload?: Record<string, unknown>
}

// --- Pure state guards (unit-tested without a DB) ---
export function canDecide(status: ApprovalStatus): boolean {
  return status === 'PENDING'
}
export function canExecute(status: ApprovalStatus): boolean {
  return status === 'APPROVED'
}

// Actions with an automated executor. Others are executed manually by the owner and just recorded.
type Executor = (payload: Record<string, unknown>) => Promise<void>

const EXECUTORS: Partial<Record<ApprovalAction, Executor>> = {
  publish: async (payload) => {
    const productId = String(payload.productId ?? '')
    if (!productId) throw new AppError('VALIDATION_ERROR', { message: 'publish requires payload.productId' })
    await prisma.product.update({ where: { id: productId }, data: { publishStatus: 'PUBLISHED' } })
  },
  stock_adjust: async (payload) => {
    const productId = String(payload.productId ?? '')
    const delta = Number(payload.delta ?? 0)
    if (!productId || !Number.isInteger(delta)) throw new AppError('VALIDATION_ERROR', { message: 'stock_adjust requires productId + integer delta' })
    await prisma.product.update({ where: { id: productId }, data: { stock: { increment: delta } } })
  },
  price_change: async (payload) => {
    const productId = String(payload.productId ?? '')
    const priceNGN = Number(payload.priceNGN ?? -1)
    if (!productId || !Number.isInteger(priceNGN) || priceNGN < 0) throw new AppError('VALIDATION_ERROR', { message: 'price_change requires productId + non-negative integer priceNGN' })
    await prisma.product.update({ where: { id: productId }, data: { priceNGN } })
  },
}

export function hasAutomatedExecutor(action: string): boolean {
  return action in EXECUTORS
}

export async function createApproval(input: CreateApprovalInput) {
  const approval = await prisma.approvalRequest.create({
    data: {
      action: input.action,
      reason: input.reason,
      dataSource: input.dataSource ?? null,
      riskLevel: input.riskLevel ?? 'MEDIUM',
      createdBy: input.createdBy ?? null,
      requiredApprover: input.requiredApprover ?? null,
      payload: (input.payload ?? undefined) as object | undefined,
    },
  })
  await writeAudit({ actorId: input.createdBy, actorRole: 'ADMIN', action: `approval.create:${input.action}`, targetType: 'ApprovalRequest', targetId: approval.id })
  return approval
}

export async function decideApproval(id: string, decision: 'approve' | 'reject', approverId: string) {
  const existing = await prisma.approvalRequest.findUnique({ where: { id }, select: { status: true, action: true } })
  if (!existing) throw new AppError('NOT_FOUND')
  if (!canDecide(existing.status)) throw new AppError('VALIDATION_ERROR', { message: `Cannot decide an approval in status ${existing.status}.` })

  const status: ApprovalStatus = decision === 'approve' ? 'APPROVED' : 'REJECTED'
  const updated = await prisma.approvalRequest.update({
    where: { id },
    data: { status, decidedBy: approverId, decidedAt: new Date() },
  })
  await writeAudit({ actorId: approverId, actorRole: 'ADMIN', action: `approval.${decision}:${existing.action}`, targetType: 'ApprovalRequest', targetId: id })
  return updated
}

/** Execute an APPROVED action. Separate step — high-risk actions are never executed at decision time. */
export async function executeApproval(id: string, actorId: string) {
  const existing = await prisma.approvalRequest.findUnique({ where: { id } })
  if (!existing) throw new AppError('NOT_FOUND')
  if (!canExecute(existing.status)) throw new AppError('VALIDATION_ERROR', { message: `Only APPROVED approvals can be executed (status ${existing.status}).` })
  if (existing.executed) throw new AppError('VALIDATION_ERROR', { message: 'Already executed.' })

  const executor = EXECUTORS[existing.action as ApprovalAction]
  let mode = 'manual'
  if (executor) {
    await executor((existing.payload as Record<string, unknown>) ?? {})
    mode = 'automated'
  }

  const updated = await prisma.approvalRequest.update({
    where: { id },
    data: { status: 'EXECUTED', executed: true },
  })
  await writeAudit({
    actorId,
    actorRole: 'ADMIN',
    action: `approval.execute:${existing.action}`,
    targetType: 'ApprovalRequest',
    targetId: id,
    metadata: { mode },
  })
  return { approval: updated, executed: mode }
}
