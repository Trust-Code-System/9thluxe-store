import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { isPageVisible, normalizePageSlug } from "./util"

export async function getPublishedPage(route: string) {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: normalizePageSlug(route) },
      include: { blocks: { orderBy: { position: "asc" } } },
    })
    return page && isPageVisible(page) ? page : null
  } catch {
    // Migrations are intentionally not applied to production until owner approval. Existing static
    // content remains the storefront fallback until the Page tables are available and seeded.
    return null
  }
}

export async function getManagedPageMetadata(route: string, fallback: Metadata): Promise<Metadata> {
  const page = await getPublishedPage(route)
  if (!page) return fallback
  return {
    ...fallback,
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt || fallback.description,
  }
}
