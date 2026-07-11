import { notFound, permanentRedirect } from "next/navigation"
import { categoryData } from "@/lib/category-data"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

/**
 * The store is perfumes-only: the old category browse pages collapsed into
 * the single /shop catalogue. Keep old links working with a redirect.
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = categoryData[slug as keyof typeof categoryData]
  if (!category) {
    notFound()
  }

  permanentRedirect("/shop")
}
