// lib/samples/credits.ts
// PURE sample-credit application. Given a customer's credits and an amount to cover, compute how
// much credit applies, respecting expiry and available remaining balance, oldest-expiring first.
// Duplicate redemption is prevented at the DB layer (unique [creditId, orderId]); this module never
// applies more than a credit's remaining balance.

export interface CreditRecord {
  id: string
  remainingNGN: number
  expiresAt: string | null // ISO
}

export interface CreditApplication {
  totalAppliedNGN: number
  remainingDueNGN: number
  breakdown: Array<{ creditId: string; appliedNGN: number }>
}

/**
 * Apply usable credits to `amountNGN`. Expired or empty credits are skipped. Oldest-expiring
 * credits are consumed first (use-it-or-lose-it). Never applies more than remaining or the amount.
 */
export function applyCredits(credits: CreditRecord[], amountNGN: number, now: Date = new Date()): CreditApplication {
  const usable = credits
    .filter((c) => c.remainingNGN > 0)
    .filter((c) => c.expiresAt == null || new Date(c.expiresAt).getTime() > now.getTime())
    .sort((a, b) => {
      // Expiring-soonest first; non-expiring last.
      const ax = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity
      const bx = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity
      return ax - bx
    })

  let due = Math.max(0, Math.floor(amountNGN))
  const breakdown: CreditApplication['breakdown'] = []
  for (const c of usable) {
    if (due <= 0) break
    const applied = Math.min(c.remainingNGN, due)
    if (applied > 0) {
      breakdown.push({ creditId: c.id, appliedNGN: applied })
      due -= applied
    }
  }
  const totalAppliedNGN = breakdown.reduce((s, b) => s + b.appliedNGN, 0)
  return { totalAppliedNGN, remainingDueNGN: due, breakdown }
}

/** Total spendable balance across unexpired credits. */
export function usableBalance(credits: CreditRecord[], now: Date = new Date()): number {
  return credits
    .filter((c) => c.remainingNGN > 0 && (c.expiresAt == null || new Date(c.expiresAt).getTime() > now.getTime()))
    .reduce((s, c) => s + c.remainingNGN, 0)
}
