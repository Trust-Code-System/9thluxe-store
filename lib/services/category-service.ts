import { prisma } from "@/lib/prisma"
import { Prisma, ProductCategory } from "@prisma/client"
import { z } from "zod"
import { invalidateCatalogueCache } from "@/lib/cache/catalogue"

export const categoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
  enumKey: z.nativeEnum(ProductCategory).optional().nullable(),
})

export type CategoryInput = z.infer<typeof categoryInputSchema>

export type AdminCategory = Prisma.CategoryGetPayload<Record<string, never>> & {
  productCount: number
}

export async function getCategoriesWithCounts(): Promise<AdminCategory[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  const counts = await prisma.product.groupBy({
    by: ["category"],
    where: { deletedAt: null },
    _count: { _all: true },
  })
  const countByCategory = new Map(
    counts.map((row) => [row.category, row._count._all]),
  )
  return categories.map((category) => ({
    ...category,
    productCount: category.enumKey
      ? (countByCategory.get(category.enumKey) ?? 0)
      : 0,
  }))
}

export async function createCategory(input: CategoryInput) {
  const data = categoryInputSchema.parse(input)

  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      enumKey: data.enumKey ?? null,
    },
  })
  invalidateCatalogueCache()
  return category
}

export async function updateCategory(id: string, input: CategoryInput) {
  const data = categoryInputSchema.parse(input)

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      enumKey: data.enumKey ?? null,
    },
  })
  invalidateCatalogueCache()
  return category
}

export class CategoryInUseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CategoryInUseError"
  }
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  })

  if (!category) return

  if (category.enumKey) {
    const count = await prisma.product.count({
      where: { category: category.enumKey },
    })

    if (count > 0) {
      throw new CategoryInUseError(
        `Cannot delete category with ${count} product${count === 1 ? "" : "s"}.`,
      )
    }
  }

  await prisma.category.delete({
    where: { id },
  })
  invalidateCatalogueCache()
}
