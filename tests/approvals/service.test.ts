import { describe, it, expect } from 'vitest'
import { canDecide, canExecute, hasAutomatedExecutor } from '@/lib/approvals/service'

describe('Approval Centre — state machine (two-step, no auto-execute)', () => {
  it('only PENDING approvals can be decided', () => {
    expect(canDecide('PENDING')).toBe(true)
    expect(canDecide('APPROVED')).toBe(false)
    expect(canDecide('REJECTED')).toBe(false)
    expect(canDecide('EXECUTED')).toBe(false)
  })

  it('only APPROVED approvals can be executed (execution is a separate step)', () => {
    expect(canExecute('APPROVED')).toBe(true)
    expect(canExecute('PENDING')).toBe(false) // cannot execute without an explicit prior approval
    expect(canExecute('EXECUTED')).toBe(false)
  })

  it('knows which actions have an automated executor (others are executed manually + recorded)', () => {
    expect(hasAutomatedExecutor('publish')).toBe(true)
    expect(hasAutomatedExecutor('stock_adjust')).toBe(true)
    expect(hasAutomatedExecutor('price_change')).toBe(true)
    expect(hasAutomatedExecutor('refund')).toBe(false) // refund goes through the provider manually
    expect(hasAutomatedExecutor('campaign')).toBe(false)
  })
})
