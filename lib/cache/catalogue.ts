import { revalidateTag, unstable_cache } from "next/cache"

import { logger } from "@/lib/observability/logger"
import { prisma } from "@/lib/prisma"

export const CATALOGUE_CACHE_TAG = "catalogue-metadata"

export const getCachedHomepageProducts = unstable_cache(
  async () => {
    const select = {
      id: true,
      name: true,
      slug: true,
      brand: true,
      priceNGN: true,
      oldPriceNGN: true,
      images: true,
      ratingAvg: true,
      ratingCount: true,
      isBestseller: true,
      isNew: true,
      isLimited: true,
    } as const
    const featured = await prisma.product.findMany({
      where: {
        deletedAt: null,
        publishStatus: "PUBLISHED",
        OR: [
          { isBestseller: true },
          { isNew: true },
          { isLimited: true },
          { isFeatured: true },
        ],
      },
      orderBy: [
        { isFeatured: "desc" },
        { isBestseller: "desc" },
        { ratingAvg: "desc" },
        { createdAt: "desc" },
      ],
      take: 8,
      select,
    })
    if (featured.length > 0) return featured
    return prisma.product.findMany({
      where: { deletedAt: null, publishStatus: "PUBLISHED" },
      orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
      take: 8,
      select,
    })
  },
  ["homepage-products-v1"],
  { revalidate: 60, tags: [CATALOGUE_CACHE_TAG] },
)

export const getCachedPublishedBrands = unstable_cache(
  async () => {
    const rows = await prisma.product.findMany({
      where: {
        brand: { not: null },
        deletedAt: null,
        publishStatus: "PUBLISHED",
      },
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    })
    return rows.map((row) => row.brand).filter((brand): brand is string => !!brand)
  },
  ["published-brands-v1"],
  { revalidate: 600, tags: [CATALOGUE_CACHE_TAG] },
)

export function invalidateCatalogueCache() {
  try {
    revalidateTag(CATALOGUE_CACHE_TAG, "max")
  } catch (error) {
    // The database mutation has already succeeded. Let the short TTL recover
    // rather than converting a successful write into a misleading 500 response.
    logger.warn("catalogue_cache_invalidation_failed", {
      internal: String(error),
    })
  }
}
