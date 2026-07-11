import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const routes = ["/", "/shop", "/category/perfumes", "/collections", "/concierge", "/about", "/cart"]

test.describe("WCAG critical and serious violations", () => {
  for (const route of routes) {
    test(`${route} has no critical or serious axe violations`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response).not.toBeNull()
      expect(response!.status()).toBeLessThan(500)

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()

      const blocking = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      )

      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
    })
  }
})
