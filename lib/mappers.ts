import { Product, Category, Review } from '@prisma/client'
import type { Product as UIProduct } from '@/components/ui/product-card'

type ProductWithReviews = Product & {
  reviews?: Review[]
}

export function mapProductToUI(product: ProductWithReviews): UIProduct {
  const images = Array.isArray(product.images) 
    ? product.images as string[]
    : typeof product.images === 'string'
    ? [product.images]
    : []

  const categoryMap: Record<Category, UIProduct['category']> = {
    WATCHES: 'watches',
    PERFUMES: 'perfumes',
    GLASSES: 'eyeglasses',
  }

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand || 'Unknown',
    price: product.priceNGN,
    image: images[0] || '/placeholder.svg',
    rating: product.ratingAvg || 0,
    reviewCount: product.ratingCount || 0,
    category: categoryMap[product.category] || 'watches',
    tags: [], // Can be added based on business logic
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}





