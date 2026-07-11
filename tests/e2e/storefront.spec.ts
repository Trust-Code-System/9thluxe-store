import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Locator, type Page } from "@playwright/test";

const customerRoutes = [
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
  "/product/aurelius-noir-eau-de-toilette",
  "/product/vesper-velvet-eau-de-parfum",
  "/auth/signin",
  "/auth/signup",
  "/auth/reset",
  "/account",
  "/account/wishlist",
] as const;

const majorRoutes = [
  "/",
  "/shop",
  "/collections",
  "/find-your-fragrance",
  "/discovery",
  "/journal",
  "/concierge",
  "/about",
  "/cart",
  "/product/nocturne-eau-de-parfum",
  "/checkout/success",
] as const;

function slug(route: string) {
  return route === "/" ? "home" : route.slice(1).replace(/[^a-z0-9]+/gi, "-");
}

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (
      message.type() === "error" ||
      /hydration|did not match|sync-dynamic-apis/i.test(text)
    ) {
      errors.push(text);
    }
  });
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
}

async function expectMotionSettled(locator: Locator) {
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        let current: Element | null = element;
        while (current && current !== document.body) {
          if (Number.parseFloat(getComputedStyle(current).opacity) < 0.99)
            return false;
          current = current.parentElement;
        }
        return true;
      }),
    )
    .toBe(true);
}

test.describe("mobile customer routes", () => {
  for (const route of customerRoutes) {
    test(`${route} renders without overflow or runtime errors`, async ({
      page,
    }, testInfo) => {
      test.skip(
        !testInfo.project.name.startsWith("mobile-"),
        "Mobile route sweep",
      );
      test.setTimeout(90_000);
      const runtimeErrors = collectRuntimeErrors(page);
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(
        response?.ok(),
        `${route} returned ${response?.status()}`,
      ).toBeTruthy();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.waitForTimeout(300);
      expect(runtimeErrors).toEqual([]);
    });
  }
});

test("major-route screenshots across desktop, tablet and mobile", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const screenshotDir = path.join(
    process.cwd(),
    ".gstack",
    "qa-reports",
    "screenshots",
    testInfo.project.name,
  );
  await mkdir(screenshotDir, { recursive: true });

  for (const route of majorRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: path.join(screenshotDir, `${slug(route)}.png`),
    });
  }
});

test("mobile menu is fixed, layered and usable on short screens", async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith("mobile-"),
    "Mobile navigation check",
  );
  await page.setViewportSize({ width: 390, height: 520 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open menu" }).click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  const state = await dialog.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      position: style.position,
      overflowY: style.overflowY,
      zIndex: Number.parseInt(style.zIndex, 10),
      headerZ: Number.parseInt(
        getComputedStyle(document.querySelector("header")!).zIndex,
        10,
      ),
    };
  });
  expect(state.position).toBe("fixed");
  expect(["auto", "scroll"]).toContain(state.overflowY);
  expect(state.zIndex).toBeGreaterThan(state.headerZ);

  const account = dialog.getByRole("link", { name: "Account" });
  await account.scrollIntoViewIfNeeded();
  await expect(account).toBeVisible();
});

test("portal select is not clipped and layers over page chrome", async ({
  page,
}) => {
  await page.goto("/shop", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Family").click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const state = await listbox.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      zIndex: Number.parseInt(getComputedStyle(element).zIndex, 10),
      headerZ: Number.parseInt(
        getComputedStyle(document.querySelector("header")!).zIndex,
        10,
      ),
      insideViewport: rect.top >= 0 && rect.bottom <= window.innerHeight,
    };
  });
  expect(state.zIndex).toBeGreaterThan(state.headerZ);
  expect(state.insideViewport).toBe(true);
});

test("motion settles and reduced motion never hides content", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const heroHeading = page.getByRole("heading", {
    name: "Worn close, remembered long.",
  });
  await expect(heroHeading).toBeVisible();
  await expectMotionSettled(heroHeading);
  const editHeading = page.getByRole("heading", { name: "Currently coveted" });
  await editHeading.scrollIntoViewIfNeeded();
  await expect(editHeading).toBeVisible();
  await expectMotionSettled(editHeading);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Worn close, remembered long." }),
  ).toBeVisible();
  await expectMotionSettled(page.locator("h1"));
  expect(runtimeErrors).toEqual([]);
});
