import bcrypt from "bcryptjs";
import { expect, test } from "@playwright/test";

import { prisma } from "@/lib/prisma";

const adminRoutes = [
  "/admin",
  "/admin/categories",
  "/admin/collections",
  "/admin/customers",
  "/admin/inventory",
  "/admin/newsletter",
  "/admin/orders",
  "/admin/products",
  "/admin/users",
] as const;

test("authenticated admin routes support Dark and Light", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One authenticated admin audit");
  test.setTimeout(240_000);

  const email = `theme-admin-${Date.now()}@example.test`;
  const password = "LocalThemeAudit12!";
  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      name: "Theme Audit Admin",
      role: "ADMIN",
      marketingEmails: false,
      smsNotifications: false,
    },
  });

  const findings: Array<{ theme: string; route: string; error: string }> = [];
  let currentTheme = "dark";
  let currentRoute = "/admin";
  page.on("pageerror", (error) =>
    findings.push({ theme: currentTheme, route: currentRoute, error: error.message }),
  );
  page.on("console", (message) => {
    if (message.type() === "error" || /hydration|did not match/i.test(message.text())) {
      findings.push({ theme: currentTheme, route: currentRoute, error: message.text() });
    }
  });

  try {
    await page.goto("/auth/signin?callbackUrl=/admin", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/admin(?:\/|$)/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    for (const theme of ["dark", "light"] as const) {
      currentTheme = theme;
      await page.evaluate((value) => localStorage.setItem("fade-theme", value), theme);
      await page.reload({ waitUntil: "domcontentloaded" });
      for (const route of adminRoutes) {
        currentRoute = route;
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(new RegExp(`${route}$`));
        await expect(page.locator("html")).toHaveClass(new RegExp(theme));
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${theme} ${route} horizontal overflow`).toBeLessThanOrEqual(1);
      }
    }

    expect(findings).toEqual([]);
  } finally {
    await prisma.user.delete({ where: { id: admin.id } }).catch(() => undefined);
  }
});
