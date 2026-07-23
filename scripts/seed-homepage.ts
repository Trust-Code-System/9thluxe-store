/**
 * scripts/seed-homepage.ts
 * Optional: materialise the default homepage layout (order + visible, no copy overrides) so the
 * admin starts from the current arrangement. The homepage already falls back to the catalogue
 * defaults when a section row is absent, so this is a convenience, not a requirement.
 *
 * Idempotent: upserts one row per known section type.
 *
 * SAFETY: connects to whatever DATABASE_URL points at. Run against a dev database first.
 *
 *   npx tsx scripts/seed-homepage.ts
 */
import { PrismaClient } from "@prisma/client"
import { HOMEPAGE_SECTIONS } from "../lib/homepage/registry"

const prisma = new PrismaClient()

async function main() {
  for (const section of HOMEPAGE_SECTIONS) {
    await prisma.homepageSection.upsert({
      where: { type: section.type },
      create: {
        type: section.type,
        position: section.defaultPosition,
        visible: true,
        config: {},
      },
      update: {}, // don't clobber existing admin edits
    })
  }
  console.log(`Homepage seed complete: ${HOMEPAGE_SECTIONS.length} sections ensured.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
