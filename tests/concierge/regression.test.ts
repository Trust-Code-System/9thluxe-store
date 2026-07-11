import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("Concierge V2 repeated-answer regression", () => {
  it("does not contain the V1 fixed catalogue opening in the V2 orchestrator or client", () => {
    const implementation = ["lib/concierge/orchestrator.ts", "components/concierge/concierge-client.tsx"].map((path) => readFileSync(path, "utf8")).join("\n")
    expect(implementation).not.toContain("Here are catalogue matches for your request.")
  })
})
