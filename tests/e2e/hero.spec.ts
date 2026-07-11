import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

// Stage 1 hero acceptance checks. The homepage renders either a real merchant-approved featured
// fragrance (product hero) or an honest neutral placeholder, so tests tolerate both states and only
// assert product-specific behaviour when a product hero is actually present.

const MOBILE_WIDTHS = [320, 360, 390, 430]

async function heroSection(page: Page) {
  return page.locator('section[data-surface="night"]').first()
}

async function hasProductHero(page: Page): Promise<boolean> {
  return (await page.getByRole("link", { name: /explore the scent/i }).count()) > 0
}

test.describe("homepage hero", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("route is healthy and the headline renders", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/remembered/i)
    await expect(await heroSection(page)).toBeVisible()
  })

  test("uses the curated-retailer positioning, not the old maison line", async ({ page }) => {
    const hero = await heroSection(page)
    await expect(hero).toContainText(/Curated Perfumery/i)
    await expect(hero).not.toContainText(/Maison de Parfum/i)
    await expect(hero).not.toContainText(/Fádé Essence/i)
  })

  test("no fictional Fádé flacon remains in the hero", async ({ page }) => {
    await expect(page.getByRole("img", { name: /Fádé perfume flacon/i })).toHaveCount(0)
  })

  test("no visible em dashes in the hero", async ({ page }) => {
    const text = (await (await heroSection(page)).innerText()) || ""
    expect(text).not.toContain("—")
  })

  test("no native HTML select in the hero", async ({ page }) => {
    const hero = await heroSection(page)
    expect(await hero.locator("select").count()).toBe(0)
  })

  test("no unrelated product categories leak into the hero", async ({ page }) => {
    const text = ((await (await heroSection(page)).innerText()) || "").toLowerCase()
    for (const banned of ["watch", "eyeglass", "sunglass", "handbag"]) {
      expect(text).not.toContain(banned)
    }
  })

  test("primary CTA opens the correct real product (product hero only)", async ({ page }) => {
    test.skip(!(await hasProductHero(page)), "neutral placeholder is active")
    const cta = page.getByRole("link", { name: /explore the scent/i }).first()
    const href = await cta.getAttribute("href")
    expect(href).toMatch(/^\/product\/[a-z0-9-]+$/i)
    await cta.click()
    // Generous timeout: the target route may compile on demand under the dev server.
    await page.waitForURL(new RegExp(`${href}$`), { timeout: 45_000 })
    // A real published product page, not a 404.
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("body")).not.toContainText(/404|not found/i)
  })

  test("placeholder CTA points at the shop (placeholder only)", async ({ page }) => {
    test.skip(await hasProductHero(page), "a product hero is active")
    const cta = page.getByRole("link", { name: /shop the collection/i }).first()
    await expect(cta).toHaveAttribute("href", "/shop")
  })

  test("featured product image has a meaningful alt (product hero only)", async ({ page }) => {
    test.skip(!(await hasProductHero(page)), "neutral placeholder is active")
    const hero = await heroSection(page)
    const img = hero.locator("img[alt]").first()
    const alt = await img.getAttribute("alt")
    expect((alt || "").trim().length).toBeGreaterThan(3)
  })

  test("keyboard focus can reach a hero call to action", async ({ page }) => {
    const firstCta = (await heroSection(page)).getByRole("link").first()
    await firstCta.focus()
    await expect(firstCta).toBeFocused()
  })

  for (const width of MOBILE_WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 })
      await page.goto("/")
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }

  test("hero has no serious/critical accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('section[data-surface="night"]')
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    )
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
  })
})

test.describe("homepage hero under reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
  })

  test("shows a complete static composition with no falling scene", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toContainText(/remembered/i)
    // The decorative animation layer must not be mounted under reduced motion.
    await expect(page.locator("[data-hero-scene]")).toHaveCount(0)
    // Content and calls to action remain reachable.
    await expect((await heroSection(page)).getByRole("link").first()).toBeVisible()
  })

  test("note arrangement (if present) is readable without motion", async ({ page }) => {
    await page.goto("/")
    if (await hasProductHero(page)) {
      const hero = await heroSection(page)
      await expect(hero.locator("dl")).toBeVisible()
    }
  })
})

test.describe("hero animation lifecycle", () => {
  test("cleans up without console errors across navigation", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(String(e)))
    await page.goto("/")
    await page.waitForTimeout(500)
    await page.goto("/shop")
    await page.goto("/")
    await page.waitForTimeout(300)
    expect(errors, errors.join("\n")).toEqual([])
  })
})
