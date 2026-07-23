/**
 * scripts/seed-navigation.ts
 * Optional: materialise the built-in default navigation into editable NavigationItem rows so the
 * admin starts from the current menus instead of empty ones. Navigation already falls back to the
 * defaults when a menu is empty, so this is a convenience, not a requirement.
 *
 * Idempotent per location: clears and re-creates that location's items.
 *
 * SAFETY: connects to whatever DATABASE_URL points at. Run against a dev database first.
 *
 *   npx tsx scripts/seed-navigation.ts
 */
import { PrismaClient, type NavLocation } from "@prisma/client"
import { DEFAULT_NAV } from "../lib/navigation/defaults"

const prisma = new PrismaClient()

async function main() {
  let total = 0
  for (const [location, items] of Object.entries(DEFAULT_NAV)) {
    await prisma.$transaction([
      prisma.navigationItem.deleteMany({ where: { location: location as NavLocation } }),
      prisma.navigationItem.createMany({
        data: items.map((item, position) => ({
          location: location as NavLocation,
          label: item.label,
          href: item.href,
          newTab: item.newTab,
          visible: true,
          position,
        })),
      }),
    ])
    total += items.length
  }
  console.log(`Navigation seed complete: ${total} items across ${Object.keys(DEFAULT_NAV).length} menus.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
