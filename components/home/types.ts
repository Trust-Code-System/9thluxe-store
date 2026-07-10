import type { Product } from '@prisma/client'

export type Collection = {
  id: string
  title: string
  description: string
  link: string
  products: Product[]
  accent: string
}
