import { MainLayout } from "@/components/layout/main-layout"

import { PermanentHeroSection } from "@/components/home/hero/permanent/permanent-hero-section"

import { FeaturedProductsSection } from "@/components/home/featured-products-section"

import { FragranceFamilies } from "@/components/home/fragrance-families"

import { BrandStorySection } from "@/components/home/brand-story-section"

import { ConciergeInvitation } from "@/components/home/concierge-invitation"

import { getCachedHomepageProducts } from "@/lib/cache/catalogue"
import { isFeatureEnabled } from "@/lib/config/feature-flags"

import { getApprovedFusionHeroFragrance } from "@/lib/hero/fusion-config"

import { getHomepageLayout } from "@/lib/homepage/service"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const fusionFragrance = isFeatureEnabled("hero_fusion")
    ? getApprovedFusionHeroFragrance()
    : null

  // Fetch featured products from database (best-effort; allow the page to render even if DB isn't ready).
  let dbProducts: Awaited<ReturnType<typeof getCachedHomepageProducts>> = []
  try {
    dbProducts = await getCachedHomepageProducts()
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
      originalPrice: product.oldPriceNGN || undefined,
      image: images[0] || "/placeholder-flacon.svg",
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

  const layout = await getHomepageLayout()

  const renderSection = (type: string, config: Record<string, string>) => {
    switch (type) {
      case "hero":
        return (
          <PermanentHeroSection
            key={type}
            cinematic={isFeatureEnabled("hero_cinematic")}
            fusion={fusionFragrance}
          />
        )
      case "featured_products":
        return (
          <FeaturedProductsSection
            key={type}
            products={featuredProducts}
            eyebrow={config.eyebrow}
            title={config.title}
            subtitle={config.subtitle}
            viewAllLabel={config.viewAllLabel}
            viewAllHref={config.viewAllHref}
          />
        )
      case "fragrance_families":
        return (
          <FragranceFamilies
            key={type}
            eyebrow={config.eyebrow}
            title={config.title}
            subtitle={config.subtitle}
          />
        )
      case "brand_story":
        return (
          <BrandStorySection
            key={type}
            eyebrow={config.eyebrow}
            quote={config.quote}
            paragraph1={config.paragraph1}
            paragraph2={config.paragraph2}
            ctaLabel={config.ctaLabel}
            ctaHref={config.ctaHref}
          />
        )
      case "concierge_invitation":
        return (
          <ConciergeInvitation
            key={type}
            heading={config.heading}
            subtext={config.subtext}
            primaryCtaLabel={config.primaryCtaLabel}
            primaryCtaHref={config.primaryCtaHref}
            secondaryCtaLabel={config.secondaryCtaLabel}
            secondaryCtaHref={config.secondaryCtaHref}
          />
        )
      default:
        return null
    }
  }

  return (
    <MainLayout>
      {layout
        .filter((section) => section.visible)
        .map((section) => renderSection(section.type, section.config))}
    </MainLayout>
  )
}
