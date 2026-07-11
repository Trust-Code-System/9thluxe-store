// lib/loyalty/points.ts
// PURE loyalty points logic. Earning is deterministic; REDEMPTION (spending points for money) is a
// financial action and stays disabled behind the `loyalty_rewards` feature flag until the business
// approves the rules. This module never mutates state; routes/services persist LoyaltyLedger rows.

/** Policy: points earned per whole Naira spent. 1 point per ₦1,000. */
export const POINTS_PER_NGN = 1 / 1000

export function pointsForOrder(orderTotalNGN: number): number {
  if (!Number.isFinite(orderTotalNGN) || orderTotalNGN <= 0) return 0
  return Math.floor(orderTotalNGN * POINTS_PER_NGN)
}

export interface LedgerEntry {
  delta: number
}

/** Current balance from a ledger (earn = +, redeem = -). Never negative. */
export function computeBalance(entries: LedgerEntry[]): number {
  return Math.max(0, entries.reduce((s, e) => s + e.delta, 0))
}

/**
 * Validate a redemption request. Returns the redeemable points (capped at balance) and whether it is
 * allowed. `enabled` reflects the feature flag; when false, redemption is refused regardless.
 */
export function validateRedemption(
  balance: number,
  requestedPoints: number,
  enabled: boolean,
): { ok: boolean; reason?: string; points: number } {
  if (!enabled) return { ok: false, reason: 'rewards_disabled', points: 0 }
  if (!Number.isInteger(requestedPoints) || requestedPoints <= 0) return { ok: false, reason: 'invalid_amount', points: 0 }
  if (requestedPoints > balance) return { ok: false, reason: 'insufficient_balance', points: 0 }
  return { ok: true, points: requestedPoints }
}
