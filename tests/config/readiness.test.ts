import { describe, expect, it } from "vitest"

import { classifyJobReadiness } from "@/lib/readiness"

describe("job readiness classification", () => {
  it("is up only when every durable workload is clear", () => {
    expect(
      classifyJobReadiness({
        failedOutbox: 0,
        staleRunningOutbox: 0,
        overdueReservations: 0,
        overduePayments: 0,
        refundsNeedingAttention: 0,
      }),
    ).toBe("up")
  })

  it("is degraded when any workload needs operational attention", () => {
    expect(
      classifyJobReadiness({
        failedOutbox: 0,
        staleRunningOutbox: 0,
        overdueReservations: 1,
        overduePayments: 0,
        refundsNeedingAttention: 0,
      }),
    ).toBe("degraded")
  })
})
