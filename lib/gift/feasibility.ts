// lib/gift/feasibility.ts
// PURE delivery-feasibility check for the Gift Concierge. Deliberately separate from AI generation:
// the AI suggests products; feasibility is computed deterministically from dates + fulfilment policy,
// never asserted by the model.

export interface FeasibilityInput {
  /** Desired delivery-by date (ISO). If absent, feasibility is not constrained. */
  deadlineISO?: string | null
  now?: Date
  processingDays?: number
  deliveryDays?: number
}

export interface FeasibilityResult {
  hasDeadline: boolean
  feasible: boolean
  estimatedDeliveryISO: string
  message: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Deterministic feasibility: processing + delivery days added to `now`, compared to the deadline. */
export function checkDeliveryFeasibility(input: FeasibilityInput): FeasibilityResult {
  const now = input.now ?? new Date()
  const processingDays = input.processingDays ?? 2
  const deliveryDays = input.deliveryDays ?? 4
  const estimated = new Date(now.getTime() + (processingDays + deliveryDays) * DAY_MS)
  const estimatedDeliveryISO = estimated.toISOString()

  if (!input.deadlineISO) {
    return {
      hasDeadline: false,
      feasible: true,
      estimatedDeliveryISO,
      message: `Estimated delivery around ${estimatedDeliveryISO.slice(0, 10)}.`,
    }
  }
  const deadline = new Date(input.deadlineISO)
  const feasible = !Number.isNaN(deadline.getTime()) && estimated.getTime() <= deadline.getTime()
  return {
    hasDeadline: true,
    feasible,
    estimatedDeliveryISO,
    message: feasible
      ? `On track: estimated delivery ${estimatedDeliveryISO.slice(0, 10)}, before your ${input.deadlineISO.slice(0, 10)} deadline.`
      : `At risk: estimated delivery ${estimatedDeliveryISO.slice(0, 10)} may miss your ${input.deadlineISO.slice(0, 10)} deadline. Consider express delivery or an e-gift.`,
  }
}
