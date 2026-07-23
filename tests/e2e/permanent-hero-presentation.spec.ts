import { expect, test } from "@playwright/test"

const MOBILE_WIDTHS = [320, 360, 390, 430]

test.describe("permanent perfume presentation", () => {
  for (const width of MOBILE_WIDTHS) {
    test(`keeps ingredient ownership separate at ${width}px`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.setViewportSize({ width, height: 900 })
      await page.goto("/")
      await page.locator(".permanent-drop-scene").waitFor()

      const measurements = await page.evaluate(() => {
        const leftZone = document.querySelector<HTMLElement>(
          '[data-perfume-zone="aventus"]',
        )!
        const rightZone = document.querySelector<HTMLElement>(
          '[data-perfume-zone="oud-wood"]',
        )!
        const ingredientRects = (zone: HTMLElement) =>
          Array.from(zone.querySelectorAll<HTMLElement>(".drop-ingredient")).map((item) =>
            item.getBoundingClientRect(),
          )
        const leftIngredients = ingredientRects(leftZone)
        const rightIngredients = ingredientRects(rightZone)

        return {
          leftZoneRight: leftZone.getBoundingClientRect().right,
          rightZoneLeft: rightZone.getBoundingClientRect().left,
          ingredientGap:
            Math.min(...rightIngredients.map((rect) => rect.left)) -
            Math.max(...leftIngredients.map((rect) => rect.right)),
          overflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })

      expect(measurements.rightZoneLeft - measurements.leftZoneRight).toBeGreaterThan(8)
      expect(measurements.ingredientGap).toBeGreaterThan(8)
      expect(measurements.overflow).toBeLessThanOrEqual(1)
      await expect(page.getByAltText("Creed Aventus perfume bottle")).toBeVisible()
      await expect(page.getByAltText("Tom Ford Oud Wood perfume bottle")).toBeVisible()
      await expect(page.getByText("Creed · Aventus", { exact: true })).toBeVisible()
      await expect(page.getByText("Tom Ford · Oud Wood", { exact: true })).toBeVisible()
    })
  }

  test("preserves a static, separated composition for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 900 })
    await page.goto("/")

    for (const selector of [".drop-bottle", ".drop-ingredient", ".drop-caption"]) {
      const animationNames = await page
        .locator(selector)
        .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName))
      expect(animationNames.every((name) => name === "none")).toBe(true)
    }
  })
})
