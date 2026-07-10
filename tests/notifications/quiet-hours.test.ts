import { describe, it, expect } from 'vitest'
import { inQuietHours } from '@/integrations/notifications'

describe('notifications — quiet hours', () => {
  const window = { start: 21, end: 8 } // wraps past midnight

  it('is quiet late at night and early morning', () => {
    expect(inQuietHours(22, window)).toBe(true)
    expect(inQuietHours(2, window)).toBe(true)
    expect(inQuietHours(7, window)).toBe(true)
  })
  it('is not quiet during the day', () => {
    expect(inQuietHours(9, window)).toBe(false)
    expect(inQuietHours(15, window)).toBe(false)
    expect(inQuietHours(20, window)).toBe(false)
  })
  it('handles a non-wrapping window', () => {
    expect(inQuietHours(1, { start: 0, end: 6 })).toBe(true)
    expect(inQuietHours(6, { start: 0, end: 6 })).toBe(false)
  })
  it('an equal start/end disables quiet hours', () => {
    expect(inQuietHours(3, { start: 0, end: 0 })).toBe(false)
  })
})
