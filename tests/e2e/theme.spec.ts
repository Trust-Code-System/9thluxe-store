import { mkdir } from "node:fs/promises";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const themes = ["dark", "light"] as const;
const viewports = [
  { name: "320x568", width: 320, height: 568 },
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
] as const;

const screenshotRoot = path.resolve(".gstack/qa-reports/theme-screenshots");
const themedCustomerRoutes = [
  "/",
  "/shop",
  "/collections",
  "/collections/featured",
  "/collections/fade",
  "/collections/aurelius",
  "/collections/vesper",
  "/category/perfumes",
  "/find-your-fragrance",
  "/discovery",
  "/drops",
  "/journal",
  "/journal/best-oud-fragrances-lagos",
  "/concierge",
  "/about",
  "/faq",
  "/help",
  "/help/shipping",
  "/help/returns",
  "/help/faq",
  "/help/contact",
  "/privacy",
  "/terms",
  "/cart",
  "/checkout",
  "/checkout/success",
  "/compare",
  "/product/nocturne-eau-de-parfum",
  "/auth/signin",
  "/auth/signup",
  "/auth/reset",
  "/account",
  "/account/wishlist",
  "/this-route-does-not-exist",
] as const;

async function setTheme(page: Page, theme: (typeof themes)[number]) {
  await page.evaluate(
    (nextTheme) => localStorage.setItem("fade-theme", nextTheme),
    theme,
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(
    new RegExp(`(^|\\s)${theme}(\\s|$)`),
  );
}

async function settle(page: Page) {
  await expect(page.locator("main")).toBeVisible();
  await page.waitForTimeout(500);
}

async function capture(page: Page, viewport: string, name: string) {
  const directory = path.join(screenshotRoot, viewport);
  await mkdir(directory, { recursive: true });
  await page.screenshot({
    path: path.join(directory, `${name}.png`),
    fullPage: false,
  });
}

test.describe("theme behavior", () => {
  test("all customer routes render in Light without overflow or runtime errors", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "One complete route audit",
    );
    test.setTimeout(480_000);
    const findings: Array<{ theme: string; route: string; error: string }> = [];
    let currentTheme = "dark";
    let currentRoute = "/";
    page.on("pageerror", (error) =>
      findings.push({
        theme: currentTheme,
        route: currentRoute,
        error: error.message,
      }),
    );
    page.on("console", (message) => {
      if (
        currentRoute === "/this-route-does-not-exist" &&
        /status of 404 \(Not Found\)/i.test(message.text())
      ) {
        return;
      }
      if (
        message.type() === "error" ||
        /hydration|did not match/i.test(message.text())
      ) {
        findings.push({
          theme: currentTheme,
          route: currentRoute,
          error: message.text(),
        });
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const theme of ["light"] as const) {
      currentTheme = theme;
      await setTheme(page, theme);
      for (const route of themedCustomerRoutes) {
        currentRoute = route;
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        await expect(page.locator("body")).toBeVisible();
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(
          overflow,
          `${theme} ${route} horizontal overflow`,
        ).toBeLessThanOrEqual(1);
      }
    }

    expect(findings).toEqual([]);
  });

  test("Dark is the default and switching is persisted without navigation", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (/hydration|did not match/i.test(message.text()))
        errors.push(message.text());
    });

    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(/dark/);

    const toggle = page.locator("[data-theme-control]");
    await expect(toggle).toHaveAttribute("data-current-theme", "dark");
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveClass(/light/);
    await expect(toggle).toHaveAttribute("data-current-theme", "light");
    await expect(page).toHaveURL(/\/shop$/);

    await page.goto("/collections", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(/light/);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(/light/);
    expect(errors).toEqual([]);
  });

  test("theme switching preserves filters and does not reload the page", async ({
    page,
  }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });
    const family = page.locator("#filter-family");
    await expect(family).toBeEnabled();
    await family.press("Enter");
    await page.getByRole("option", { name: "Woody" }).click();
    await expect(family).toContainText("Woody");

    const navigationCount = await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    );
    await page.locator("[data-theme-control]").click();
    await expect(family).toContainText("Woody");
    expect(
      await page.evaluate(
        () => performance.getEntriesByType("navigation").length,
      ),
    ).toBe(navigationCount);
  });

  test("theme switching preserves the active cart", async ({ page }) => {
    await page.goto("/product/nocturne-eau-de-parfum", {
      waitUntil: "domcontentloaded",
    });
    const addToCart = page.getByRole("button", { name: "Add to cart" });
    await expect(addToCart).toBeVisible();
    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/cart/add") && response.ok(),
      ),
      addToCart.click(),
    ]);

    const before = await page.evaluate(async () => {
      const response = await fetch("/api/cart/summary");
      return response.json();
    });
    await page.locator("[data-theme-control]").click();
    const after = await page.evaluate(async () => {
      const response = await fetch("/api/cart/summary");
      return response.json();
    });

    expect(before.items.length).toBeGreaterThan(0);
    expect(after.items).toEqual(before.items);
  });

  test("semantic section hierarchy reverses and product media is never inverted", async ({
    page,
  }) => {
    await page.goto("/shop", { waitUntil: "domcontentloaded" });

    for (const theme of themes) {
      await setTheme(page, theme);
      const colors = await page.locator("main").evaluate((main) => {
        const standard = main.querySelector<HTMLElement>(
          '[data-surface="night"]',
        );
        const inverse = main.querySelector<HTMLElement>('[data-surface="day"]');
        const image = main.querySelector<HTMLImageElement>("img");
        return {
          standard: standard ? getComputedStyle(standard).backgroundColor : "",
          inverse: inverse ? getComputedStyle(inverse).backgroundColor : "",
          imageFilter: image ? getComputedStyle(image).filter : "missing",
        };
      });
      expect(colors.standard).not.toBe(colors.inverse);
      expect(colors.imageFilter).toBe("none");
    }
    const nativeSelectsAreRadixBridges = await page
      .locator("select")
      .evaluateAll((selects) =>
        selects.every((select) => {
          return (
            select.tabIndex === -1 &&
            select.getAttribute("aria-hidden") === "true"
          );
        }),
      );
    expect(nativeSelectsAreRadixBridges).toBe(true);
  });

  test("both themes have no serious automatic accessibility violations", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const routes = [
      "/",
      "/shop",
      "/collections",
      "/product/nocturne-eau-de-parfum",
      "/cart",
    ];
    const findings: unknown[] = [];

    for (const theme of themes) {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await setTheme(page, theme);
      for (const route of routes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(350);
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        if (result.violations.length) {
          findings.push({
            theme,
            route,
            violations: result.violations.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              targets: violation.nodes.map((node) => node.target),
            })),
          });
        }
      }
    }

    expect(findings).toEqual([]);
  });
});

test("theme visual-regression capture matrix", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "One deterministic capture browser",
  );
  test.setTimeout(600_000);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const theme of themes) {
      await setTheme(page, theme);
      await settle(page);
      await capture(page, viewport.name, `home-${theme}`);
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/product/nocturne-eau-de-parfum", {
    waitUntil: "domcontentloaded",
  });
  const addToCart = page.getByRole("button", { name: "Add to cart" });
  await expect(addToCart).toBeVisible();
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes("/api/cart/add") && response.ok(),
    ),
    addToCart.click(),
  ]);
  await page.goto("/cart", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Your bag is empty")).toHaveCount(0);
  const routes = [
    { route: "/shop", name: "shop" },
    { route: "/collections", name: "collections" },
    { route: "/product/nocturne-eau-de-parfum", name: "product" },
    { route: "/cart", name: "cart" },
    { route: "/checkout", name: "checkout" },
  ] as const;

  for (const { route, name } of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    for (const theme of themes) {
      await setTheme(page, theme);
      await settle(page);
      await capture(page, "1440x900", `${name}-${theme}`);
    }
  }
});

test("theme overlay visual-regression captures", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "One deterministic capture browser",
  );
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  for (const theme of themes) {
    await setTheme(page, theme);
    await settle(page);
    const family = page.locator("#filter-family");
    await expect(family).toBeEnabled();
    await family.press("Enter");
    await expect(page.getByRole("option", { name: "Woody" })).toBeVisible();
    await capture(page, "1440x900", `dropdown-${theme}`);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await capture(page, "1440x900", `search-dialog-${theme}`);
    await page.keyboard.press("Escape");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  for (const theme of themes) {
    await setTheme(page, theme);
    await settle(page);
    const menuButton = page.getByRole("button", { name: "Open menu" });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.waitForTimeout(350);
    await capture(page, "390x844", `mobile-menu-${theme}`);
    await page.keyboard.press("Escape");
  }
});
