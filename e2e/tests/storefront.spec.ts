import { expect, test, type Page } from "@playwright/test"

const publicRoutes = [
  "/",
  "/shop",
  "/category/perfumes",
  "/collections",
  "/concierge",
  "/drops",
  "/journal",
  "/about",
  "/cart",
  "/compare",
]

async function expectHealthyPage(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" })
  expect(response, `${route} should return a document response`).not.toBeNull()
  expect(response!.status(), `${route} should not return a server error`).toBeLessThan(500)
  await expect(page.locator("body")).toBeVisible()
}

test.describe("public storefront routes", () => {
  for (const route of publicRoutes) {
    test(`${route} loads without a server failure`, async ({ page }) => {
      await expectHealthyPage(page, route)
    })
  }

  test("visible storefront copy does not contain em dashes", async ({ page }) => {
    for (const route of publicRoutes) {
      await expectHealthyPage(page, route)
      const visibleText = await page.locator("body").innerText()
      expect(visibleText, `${route} contains a visible em dash`).not.toContain("—")
    }
  })
})

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "Mobile menu behaviour is mobile-specific")

  test("opens, exposes one close control, and closes after navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })

    const trigger = page.getByRole("button", { name: "Open menu" })
    await expect(trigger).toBeVisible()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await trigger.click()
    await expect(trigger).toHaveAttribute("aria-expanded", "true")

    const dialog = page.getByRole("dialog", { name: "Navigation menu" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Close menu" })).toHaveCount(1)

    await dialog.getByRole("link", { name: "About", exact: true }).click()
    await expect(page).toHaveURL(/\/about(?:\?.*)?$/)
    await expect(dialog).toBeHidden()
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false")
  })

  test("has no horizontal page overflow at iPhone 12 width", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" })
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
  })
})

test.describe("custom dropdowns", () => {
  test("shop filters use an accessible portalled combobox instead of a native select", async ({ page }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" })

    await expect(page.locator("select")).toHaveCount(0)
    const comboboxes = page.getByRole("combobox")
    await expect(comboboxes.first()).toBeVisible()
    await comboboxes.first().click()

    const listbox = page.getByRole("listbox")
    await expect(listbox).toBeVisible()
    await expect(listbox.getByRole("option", { name: "Perfumes", exact: true })).toBeVisible()

    const stacking = await listbox.evaluate((element) => {
      const style = window.getComputedStyle(element)
      return {
        position: style.position,
        zIndex: Number.parseInt(style.zIndex || "0", 10),
        parent: element.parentElement?.tagName ?? "",
      }
    })
    expect(stacking.parent).toBe("BODY")
    expect(stacking.zIndex).toBeGreaterThanOrEqual(50)
  })
})

test.describe("motion preference", () => {
  test.use({ reducedMotion: "reduce" })

  test("mobile sheet suppresses transition animation when reduced motion is requested", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile sheet is hidden at desktop width")
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await page.getByRole("button", { name: "Open menu" }).click()

    const dialog = page.getByRole("dialog", { name: "Navigation menu" })
    await expect(dialog).toBeVisible()
    const transitionDuration = await dialog.evaluate((element) => window.getComputedStyle(element).transitionDuration)
    expect(["0s", "0ms"]).toContain(transitionDuration)
  })
})
