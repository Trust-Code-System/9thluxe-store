import { describe, expect, it } from "vitest"
import { EMAIL_TEMPLATE_CATALOGUE } from "@/lib/email-templates/service"
describe("email template catalogue", () => { it("has unique fixed keys and variable allowlists", () => { const keys = EMAIL_TEMPLATE_CATALOGUE.map((item) => item.key); expect(new Set(keys).size).toBe(keys.length); for (const item of EMAIL_TEMPLATE_CATALOGUE) expect(item.variables.length).toBeGreaterThan(0) }) })
