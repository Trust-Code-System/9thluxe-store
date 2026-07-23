import { describe, expect, it } from "vitest"
import { csvCell, isFormStatus } from "@/lib/forms/submissions"

describe("form submission helpers", () => {
  it("accepts only inbox statuses", () => {
    expect(isFormStatus("NEW")).toBe(true)
    expect(isFormStatus("IN_PROGRESS")).toBe(true)
    expect(isFormStatus("RESOLVED")).toBe(true)
    expect(isFormStatus("SPAM")).toBe(true)
    expect(isFormStatus("DELETED")).toBe(false)
    expect(isFormStatus(null)).toBe(false)
  })

  it("escapes quotes and preserves commas safely in CSV", () => {
    expect(csvCell('Hello, "team"')).toBe('"Hello, ""team"""')
    expect(csvCell("=HYPERLINK(\"https://example.test\")")).toBe('"\'=HYPERLINK(""https://example.test"")"')
    expect(csvCell(null)).toBe('""')
  })
})
