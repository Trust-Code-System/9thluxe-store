import { describe, expect, it } from "vitest"

import { outboxRetryDelayMs } from "@/lib/jobs/outbox"

describe("outbox retry policy", () => {
  it("uses bounded exponential backoff", () => {
    expect(outboxRetryDelayMs(1)).toBe(30_000)
    expect(outboxRetryDelayMs(2)).toBe(60_000)
    expect(outboxRetryDelayMs(3)).toBe(120_000)
    expect(outboxRetryDelayMs(99)).toBe(60 * 60 * 1000)
  })
})
