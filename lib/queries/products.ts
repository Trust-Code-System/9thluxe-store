import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
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
}

export async function getProductsByCategory(categorySlug: string, options?: {
  brand?: string
  sort?: string
  limit?: number
}) {
  const categoryMap: Record<string, Category> = {
    watches: 'WATCHES',
    perfumes: 'PERFUMES',
    eyeglasses: 'GLASSES',
    glasses: 'GLASSES',
  }

  const category = categoryMap[categorySlug.toLowerCase()]
  if (!category) return []

  const where: any = { category }
  if (options?.brand && options.brand !== 'All Brands') {
    where.brand = options.brand
  }

  const orderBy: any[] = []
  if (options?.sort === 'price-asc') {
    orderBy.push({ priceNGN: 'asc' })
  } else if (options?.sort === 'price-desc') {
    orderBy.push({ priceNGN: 'desc' })
  } else if (options?.sort === 'rating') {
    orderBy.push({ ratingAvg: 'desc' })
  } else {
    orderBy.push({ createdAt: 'desc' })
  }

  return prisma.product.findMany({
    where,
    orderBy,
    take: options?.limit || 100,
  })
}

export async function getRelatedProducts(productId: string, category: Category, limit = 4) {
  return prisma.product.findMany({
    where: {
      category,
      id: { not: productId },
    },
    orderBy: { ratingAvg: 'desc' },
    take: limit,
  })
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    orderBy: [
      { ratingAvg: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  })
}

export async function getAllProducts(options?: {
  search?: string
  category?: string
  brand?: string
}) {
  const where: any = {}
  
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search } },
      { brand: { contains: options.search } },
    ]
  }
  
  if (options?.category) {
    const categoryMap: Record<string, Category> = {
      watches: 'WATCHES',
      perfumes: 'PERFUMES',
      eyeglasses: 'GLASSES',
      glasses: 'GLASSES',
    }
    where.category = categoryMap[options.category.toLowerCase()]
  }
  
  if (options?.brand && options.brand !== 'All Brands') {
    where.brand = options.brand
  }

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBrands() {
  const products = await prisma.product.findMany({
    select: { brand: true },
    where: { brand: { not: null } },
    distinct: ['brand'],
  })
  
  return ['All Brands', ...products.map(p => p.brand!).filter(Boolean).sort()]
}





