import { prisma } from "@/lib/prisma"
import { invalidateCatalogueCache } from "@/lib/cache/catalogue"
import { Prisma, ProductCategory } from "@prisma/client"
import { z } from "zod"

export const productInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  brand: z.string().optional().nullable(),
  category: z.nativeEnum(ProductCategory, {
    errorMap: () => ({ message: "Category is required" }),
  }),
  priceNGN: z.number().int().nonnegative("Price must be positive"),
  oldPriceNGN: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().min(1).default("NGN"),
  stock: z.number().int().nonnegative("Stock must be positive"),
  ratingAvg: z.number().min(0).max(5).optional().default(0),
  ratingCount: z.number().int().nonnegative().optional().default(0),
  isFeatured: z.boolean().optional().default(false),
  isBestseller: z.boolean().optional().default(false),
  isNew: z.boolean().optional().default(false),
  isLimited: z.boolean().optional().default(false),
  images: z.array(z.string()).optional().default([]),
  collectionId: z.string().optional().nullable(),
  fragranceFamily: z.string().optional().nullable(),
})

export type ProductInput = z.infer<typeof productInputSchema>

export type AdminProduct = Prisma.ProductGetPayload<{
  include: { collection: true }
}>

export function parseProductFormData(formData: FormData): ProductInput {
  const toNumber = (value: FormDataEntryValue | null, fallback = 0): number => {
    if (value == null) return fallback
    const n = Number(value)
    return Number.isNaN(n) ? fallback : n
  }

  const toOptionalNumber = (value: FormDataEntryValue | null): number | null => {
    if (value == null || value === "") return null
    const n = Number(value)
    return Number.isNaN(n) ? null : n
  }

  const rawImages = formData.get("images")
  let images: string[] = []
  if (typeof rawImages === "string" && rawImages) {
    try {
      const parsed = JSON.parse(rawImages)
      if (Array.isArray(parsed)) {
        images = parsed.filter((v) => typeof v === "string")
      }
    } catch {
      images = []
    }
  }

  const category = formData.get("category") as ProductCategory

  const result: ProductInput = {
    name: (formData.get("name") as string) ?? "",
    slug: ((formData.get("slug") as string) ?? "").trim(),
    description: (formData.get("description") as string) ?? "",
    brand: ((formData.get("brand") as string) || "").trim() || null,
    category,
    priceNGN: toNumber(formData.get("priceNGN"), 0),
    oldPriceNGN: toOptionalNumber(formData.get("oldPriceNGN")),
    currency: ((formData.get("currency") as string) || "NGN").toUpperCase(),
    stock: toNumber(formData.get("stock"), 0),
    ratingAvg: toNumber(formData.get("ratingAvg"), 0),
    ratingCount: toNumber(formData.get("ratingCount"), 0),
    isFeatured: Boolean(formData.get("isFeatured")),
    isBestseller: Boolean(formData.get("isBestseller")),
    isNew: Boolean(formData.get("isNew")),
    isLimited: Boolean(formData.get("isLimited")),
    images,
    collectionId: ((formData.get("collectionId") as string) || "").trim() || null,
    fragranceFamily: ((formData.get("fragranceFamily") as string) || "").trim() || null,
  }

  return productInputSchema.parse(result)
}

export async function getAdminProducts(params: {
  search?: string
  categorySlug?: string
} = {}): Promise<AdminProduct[]> {
  const { search, categorySlug } = params

  let category: ProductCategory | undefined
  if (categorySlug === "perfumes") category = "PERFUMES"

  const whereConditions: Prisma.ProductWhereInput[] = [
    { deletedAt: null }, // Exclude soft-deleted products
  ]

  if (search) {
    whereConditions.push({
      OR: [{ name: { contains: search } }, { brand: { contains: search } }],
    })
  }

  if (categorySlug && categorySlug !== "all" && category) {
    whereConditions.push({ category })
  }

  return prisma.product.findMany({
    where: whereConditions.length > 0 ? { AND: whereConditions } : {},
    include: { collection: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAdminProductById(id: string): Promise<AdminProduct | null> {
  if (!id) return null

  return prisma.product.findUnique({
    where: { id },
    include: { collection: true },
  })
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null, publishStatus: "PUBLISHED" },
  })
}

export async function getProducts(params: {
  category?: ProductCategory
  featured?: boolean
  bestseller?: boolean
  isNew?: boolean
  isLimited?: boolean
  limit?: number
} = {}) {
  const { category, featured, bestseller, isNew, isLimited, limit } = params

  const where: Prisma.ProductWhereInput = {
    deletedAt: null, // Exclude soft-deleted products
    publishStatus: "PUBLISHED",
  }

  if (category) where.category = category
  if (featured !== undefined) where.isFeatured = featured
  if (bestseller !== undefined) where.isBestseller = bestseller
  if (isNew !== undefined) where.isNew = isNew
  if (isLimited !== undefined) where.isLimited = isLimited

  return prisma.product.findMany({
    where,
    take: limit || 100,
    orderBy: { createdAt: "desc" },
  })
}

export async function getProductsForSearch(query: string) {
  return prisma.product.findMany({
    where: {
      OR: [{ name: { contains: query } }, { brand: { contains: query } }],
      deletedAt: null, // Exclude soft-deleted products
      publishStatus: "PUBLISHED",
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  })
}

export async function getCartProducts(productIds: string[]) {
  if (productIds.length === 0) return []

  return prisma.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null, // Exclude soft-deleted products
      publishStatus: "PUBLISHED",
    },
  })
}

export async function createProduct(input: ProductInput) {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      brand: input.brand,
      category: input.category,
      priceNGN: input.priceNGN,
      oldPriceNGN: input.oldPriceNGN,
      currency: input.currency,
      stock: input.stock,
      ratingAvg: input.ratingAvg,
      ratingCount: input.ratingCount,
      isFeatured: input.isFeatured,
      isBestseller: input.isBestseller,
      isNew: input.isNew,
      isLimited: input.isLimited,
      images: input.images,
      collectionId: input.collectionId,
      fragranceFamily: input.fragranceFamily,
    },
  })
  invalidateCatalogueCache()
  return product
}

export async function updateProduct(id: string, input: ProductInput) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      brand: input.brand,
      category: input.category,
      priceNGN: input.priceNGN,
      oldPriceNGN: input.oldPriceNGN,
      currency: input.currency,
      stock: input.stock,
      ratingAvg: input.ratingAvg,
      ratingCount: input.ratingCount,
      isFeatured: input.isFeatured,
      isBestseller: input.isBestseller,
      isNew: input.isNew,
      isLimited: input.isLimited,
      images: input.images,
      collectionId: input.collectionId,
      fragranceFamily: input.fragranceFamily,
    },
  })
  invalidateCatalogueCache()
  return product
}

export class ProductInUseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProductInUseError"
  }
}

export async function deleteProduct(id: string): Promise<void> {
  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, deletedAt: true },
  })

  if (!product) {
    throw new Error("Product not found")
  }

  // If already soft-deleted, do nothing
  if (product.deletedAt) {
    return
  }

  // Remove product from wishlists
  await prisma.wishlist.deleteMany({
    where: { productId: id },
  })

  // Delete reviews for this product
  await prisma.review.deleteMany({
    where: { productId: id },
  })

  // Check if product is referenced by orders
  const orderItemsCount = await prisma.orderItem.count({
    where: { productId: id },
  })

  // If product has orders, use soft deletion to preserve order history
  if (orderItemsCount > 0) {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    invalidateCatalogueCache()
    throw new ProductInUseError(
      `Cannot delete "${product.name}": it is referenced by ${orderItemsCount} order item(s). The product has been soft-deleted (hidden from listings).`
    )
  }

  // Hard delete: product has no orders, safe to permanently delete
  await prisma.product.delete({
    where: { id },
  })
  invalidateCatalogueCache()
}

export async function getProductStats() {
  const totalProducts = await prisma.product.count({
    where: {
      deletedAt: null,
    },
  })

  const totalActive = await prisma.product.count({
    where: {
      stock: { gt: 0 },
      deletedAt: null,
    },
  })

  return {
    totalProducts,
    totalActive,
  }
}

export async function getUniqueBrands(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: {
      brand: { not: null },
      deletedAt: null, // Exclude soft-deleted products
    },
    select: { brand: true },
    distinct: ["brand"],
  })

  return products.map((p) => p.brand!).filter(Boolean).sort()
}

// Inventory management functions
export async function checkStock(productId: string, requestedQuantity: number): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  })

  if (!product) return false
  return product.stock >= requestedQuantity
}

export async function getLowStockProducts(threshold: number = 10) {
  return prisma.product.findMany({
    where: {
      stock: { lte: threshold, gt: 0 },
      deletedAt: null, // Exclude soft-deleted products
    },
    orderBy: { stock: "asc" },
  })
}

export async function updateProductStock(productId: string, newStock: number) {
  return prisma.product.update({
    where: { id: productId },
    data: { stock: newStock },
  })
}
