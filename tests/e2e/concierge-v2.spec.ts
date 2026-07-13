import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test("concierge empty state describes broad perfume intelligence", async ({ page }) => {
  await page.goto("/concierge")
  await expect(page.getByRole("heading", { name: "Ask anything about perfume." })).toBeVisible()
  await expect(page.getByText("only recommend fragrances we genuinely stock")).toHaveCount(0)
  await expect(page.getByPlaceholder("Ask about a note, perfume, climate, occasion, or Fádé product")).toBeVisible()
})

test("concierge remains usable at 320px without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto("/concierge")
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible()
})

test("concierge has no automatic serious accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One axe pass is sufficient")
  await page.goto("/concierge")
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
  expect(result.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([])
})

test("concierge renders without overflow in dark and light themes", async ({ page }) => {
  await page.goto("/concierge")
  for (const theme of ["dark", "light"] as const) {
    await page.evaluate((value) => localStorage.setItem("fade-theme", value), theme)
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(page.locator("html")).toHaveClass(new RegExp(theme))
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
  }
})
