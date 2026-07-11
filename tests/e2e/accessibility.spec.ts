import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/shop",
  "/collections",
  "/find-your-fragrance",
  "/product/nocturne-eau-de-parfum",
  "/cart",
  "/auth/signin",
  "/help/contact",
] as const;

test("@a11y major routes have no automatic WCAG A/AA violations", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chromium",
    "Desktop accessibility audit",
  );
  test.setTimeout(180_000);
  const findings: Array<{ route: string; violations: unknown[] }> = [];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_000);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    if (result.violations.length > 0) {
      findings.push({
        route,
        violations: result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          targets: violation.nodes.map((node) => node.target),
        })),
      });
    }
  }

  expect(findings).toEqual([]);
});
