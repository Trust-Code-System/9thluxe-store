import { prisma } from "@/lib/prisma"
import { ProductCategory } from "@prisma/client"

export interface ProductForCard {
  id: string
  slug: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviewCount: number
  tags?: ("new" | "bestseller" | "limited")[]
  category: "perfumes"
}

export function mapPrismaProductToCard(product: any): ProductForCard {
  const images = Array.isArray(product.images) ? product.images : []
  const mainImage = (images[0] as string) || "/placeholder-flacon.svg"

  const categoryMap: Record<ProductCategory, "perfumes"> = {
    PERFUMES: "perfumes",
  }

  const category = (product.category as ProductCategory) || "PERFUMES"

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand ?? "",
    price: product.priceNGN,
    originalPrice: product.oldPriceNGN ?? undefined,
    image: mainImage,
    rating: product.ratingAvg || 0,
    reviewCount: product.ratingCount || 0,
    tags: [
      product.isNew ? "new" : null,
      product.isBestseller ? "bestseller" : null,
      product.isLimited ? "limited" : null,
    ].filter(Boolean) as ("new" | "bestseller" | "limited")[],
    category: categoryMap[category] || "perfumes",
  }
}

export async function getProductsByCategory(categorySlug: string) {
  const categoryMap: Record<string, ProductCategory> = {
    perfumes: "PERFUMES",
  }

  const category = categoryMap[categorySlug]
  if (!category) return []

  const products = await prisma.product.findMany({
    where: { category },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
  })

  return products.map(mapPrismaProductToCard)
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!product) return null

  return product
}

export async function getRelatedProducts(
  productId: string,
  category: ProductCategory,
  brand?: string | null,
  limit = 4,
) {
  const products = await prisma.product.findMany({
    where: {
      id: { not: productId },
      category,
      ...(brand ? { brand } : {}),
    },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: limit,
  })

  if (products.length < limit) {
    const additional = await prisma.product.findMany({
      where: {
        id: { notIn: [productId, ...products.map((p) => p.id)] },
        category,
      },
      orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
      take: limit - products.length,
    })

    products.push(...additional)
  }

  return products.map(mapPrismaProductToCard)
}

export async function getFeaturedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: limit,
  })

  return products.map(mapPrismaProductToCard)
}

