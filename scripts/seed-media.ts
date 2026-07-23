/**
 * scripts/seed-media.ts
 * Optional: backfill the media library from existing media URLs already referenced across the app
 * (product images, product media, story covers, and image settings) so the library isn't empty.
 *
 * Idempotent: upserts by URL, marks source = "url".
 *
 * SAFETY: connects to whatever DATABASE_URL points at. Run against a dev database first.
 *
 *   npx tsx scripts/seed-media.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function looksLikeImage(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url) || url.startsWith("/")
}

async function main() {
  const urls = new Map<string, "image" | "video">()

  const products = await prisma.product.findMany({ where: { deletedAt: null }, select: { images: true } })
  for (const p of products) {
    const imgs = Array.isArray(p.images) ? (p.images as unknown[]) : []
    for (const img of imgs) if (typeof img === "string" && img) urls.set(img, "image")
  }

  const media = await prisma.productMedia.findMany({ select: { url: true, kind: true } })
  for (const m of media) if (m.url) urls.set(m.url, m.kind === "video" ? "video" : "image")

  const stories = await prisma.story.findMany({
    select: { coverImageUrl: true, mobileCoverUrl: true, socialImageUrl: true },
  })
  for (const s of stories) {
    for (const u of [s.coverImageUrl, s.mobileCoverUrl, s.socialImageUrl]) {
      if (u) urls.set(u, "image")
    }
  }

  const settings = await prisma.siteSetting.findMany()
  for (const s of settings) {
    const v = s.value
    if (typeof v === "string" && looksLikeImage(v)) urls.set(v, "image")
  }

  let count = 0
  for (const [url, kind] of urls) {
    if (url.includes("placeholder")) continue
    await prisma.mediaAsset.upsert({
      where: { url },
      create: { url, kind, source: "url", filename: url.split("/").pop() || null },
      update: {},
    })
    count++
  }
  console.log(`Media seed complete: ${count} assets ensured.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
