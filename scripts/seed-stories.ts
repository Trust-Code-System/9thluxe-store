/**
 * scripts/seed-stories.ts
 * One-time backfill: import the legacy hard-coded journal articles
 * (lib/journal-articles.ts) into the managed Story CMS.
 *
 * Idempotent: upserts by slug and re-creates that story's blocks + product links.
 * Existing stories are updated in place; nothing else is touched.
 *
 * SAFETY: this connects to whatever DATABASE_URL points at. Run it against a
 * development database first. Do NOT run against production without approval.
 *
 *   npx tsx scripts/seed-stories.ts
 */
import { PrismaClient } from "@prisma/client"
import { journalArticles, articleContent } from "../lib/journal-articles"

const prisma = new PrismaClient()

async function main() {
  let created = 0
  let updated = 0

  for (const [index, article] of journalArticles.entries()) {
    const paragraphs = articleContent[article.slug] ?? []
    const existing = await prisma.story.findUnique({ where: { slug: article.slug } })

    // Resolve related products by slug (only link ones that exist).
    const relatedSlugs = article.relatedProductSlugs ?? []
    const products = relatedSlugs.length
      ? await prisma.product.findMany({
          where: { slug: { in: relatedSlugs } },
          select: { id: true },
        })
      : []

    const coverImage =
      article.heroImage && !article.heroImage.includes("placeholder")
        ? article.heroImage
        : null

    const publishedAt = new Date(article.date)

    if (existing) {
      await prisma.$transaction([
        prisma.storyBlock.deleteMany({ where: { storyId: existing.id } }),
        prisma.storyProduct.deleteMany({ where: { storyId: existing.id } }),
        prisma.story.update({
          where: { id: existing.id },
          data: {
            title: article.title,
            excerpt: article.excerpt,
            category: article.category,
            readTime: article.readTime,
            coverImageUrl: coverImage,
            status: "PUBLISHED",
            publishedAt,
            position: index,
            blocks: {
              create: paragraphs.map((text, position) => ({
                type: "paragraph",
                position,
                data: { text },
              })),
            },
            relatedProducts: {
              create: products.map((p, position) => ({ productId: p.id, position })),
            },
          },
        }),
      ])
      updated++
    } else {
      await prisma.story.create({
        data: {
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          readTime: article.readTime,
          coverImageUrl: coverImage,
          status: "PUBLISHED",
          featured: index === 0,
          position: index,
          publishedAt,
          blocks: {
            create: paragraphs.map((text, position) => ({
              type: "paragraph",
              position,
              data: { text },
            })),
          },
          relatedProducts: {
            create: products.map((p, position) => ({ productId: p.id, position })),
          },
        },
      })
      created++
    }
  }

  console.log(`Story seed complete: ${created} created, ${updated} updated.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
