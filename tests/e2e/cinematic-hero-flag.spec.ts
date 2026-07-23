import { expect, test } from "@playwright/test"

test.describe("feature-flagged cinematic hero", () => {
  test("contains one landing bottle, four sprays and the complete brand mark", async ({ page }) => {
    await page.goto("/")
    test.skip((await page.locator("[data-cinematic-hero]").count()) === 0, "flag is disabled")

    await expect(page.locator("[data-cinematic-bottle]")).toHaveCount(1)
    await expect(page.locator("[data-spray-burst]")).toHaveCount(4)
    await expect(page.locator("[data-cinematic-brand]")).toHaveAttribute(
      "data-cinematic-brand",
      "FÁDÉ",
    )
  })

  test("uses the permanent ingredient scene as its reduced-motion fallback", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    test.skip((await page.locator("[data-cinematic-hero]").count()) === 0, "flag is disabled")

    await expect(page.locator("[data-cinematic-hero]")).toBeHidden()
    await expect(page.locator(".cinematic-reduced-brand")).toHaveText("FÁDÉ")
    await expect(page.locator(".cinematic-reduced-brand")).toBeVisible()
    await expect(page.locator('[data-perfume-zone="aventus"]')).toBeVisible()
    await expect(page.locator('[data-perfume-zone="oud-wood"]')).toBeVisible()
  })
})
