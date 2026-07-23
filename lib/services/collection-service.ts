import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { invalidateCatalogueCache } from "@/lib/cache/catalogue"

export const collectionInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
})

export type CollectionInput = z.infer<typeof collectionInputSchema>

export type AdminCollection = Prisma.CollectionGetPayload<{
  include: { _count: { select: { products: true } } }
}>

export async function getCollectionsWithCounts(): Promise<AdminCollection[]> {
  return prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  })
}

export async function createCollection(input: CollectionInput) {
  const data = collectionInputSchema.parse(input)

  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
    },
  })
  invalidateCatalogueCache()
  return collection
}

export async function updateCollection(id: string, input: CollectionInput) {
  const data = collectionInputSchema.parse(input)

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
    },
  })
  invalidateCatalogueCache()
  return collection
}

export class CollectionInUseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CollectionInUseError"
  }
}

export async function deleteCollection(id: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  if (!collection) return

  if (collection._count.products > 0) {
    throw new CollectionInUseError(
      `Cannot delete collection with ${collection._count.products} product${collection._count.products === 1 ? "" : "s"}.`,
    )
  }

  await prisma.collection.delete({
    where: { id },
  })
  invalidateCatalogueCache()
}
