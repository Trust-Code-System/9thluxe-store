import { MainLayout } from "@/components/layout/main-layout"

import { HeroSection } from "@/components/home/hero-section"

import { CategoriesSection } from "@/components/home/categories-section"

import { FeaturedProductsSection } from "@/components/home/featured-products-section"

import { FragranceFamilies } from "@/components/home/fragrance-families"

import { BrandStorySection } from "@/components/home/brand-story-section"

import { ConciergeInvitation } from "@/components/home/concierge-invitation"

import { NewsletterSection } from "@/components/home/newsletter-section"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  // Fetch featured products from database (best-effort; allow the page to render even if DB isn't ready).
  let dbProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = []
  try {
    dbProducts = await prisma.product.findMany({
      where: {
        deletedAt: null, // Exclude soft-deleted products
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
    })
  } catch (err) {
    console.error("HomePage: failed to load featured products", err)
    dbProducts = []
  }

  // Transform database products to match ProductCard format
  const featuredProducts = dbProducts.map((product) => {
    const images = Array.isArray(product.images) ? (product.images as string[]) : []
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand || "",
      price: product.priceNGN,
      oldPrice: product.oldPriceNGN || undefined,
      image: images[0] || "/placeholder.svg",
      images: images,
      category: "perfumes" as const,
      rating: product.ratingAvg,
      reviewCount: product.ratingCount,
      tags: [
        product.isBestseller && "bestseller",
        product.isNew && "new",
        product.isLimited && "limited",
      ].filter(Boolean) as ("new" | "bestseller" | "limited")[],
    }
  })

  return (

    <MainLayout>

      <HeroSection />

      <CategoriesSection />

      <FeaturedProductsSection products={featuredProducts} />

      <FragranceFamilies />

      <BrandStorySection />

      <ConciergeInvitation />

      <NewsletterSection />

    </MainLayout>

  )

}
