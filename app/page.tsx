import { MainLayout } from "@/components/layout/main-layout"
import { HeroSection } from "@/components/home/hero-section"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedProductsSection } from "@/components/home/featured-products-section"
import { BrandStorySection } from "@/components/home/brand-story-section"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { getFeaturedProducts } from "@/lib/queries/products"
import { mapProductToUI } from "@/lib/mappers"

export default async function HomePage() {
  const products = await getFeaturedProducts(8)
  const uiProducts = products.map(mapProductToUI)

  return (
    <MainLayout cartItemCount={3}>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProductsSection products={uiProducts} />
      <BrandStorySection />
      <NewsletterSection />
    </MainLayout>
  )
}
