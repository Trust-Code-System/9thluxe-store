import Link from "next/link"
import { notFound } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductInfo } from "@/components/product/product-info"
import { ProductTabs } from "@/components/product/product-tabs"
import { StickyProductBar } from "@/components/product/sticky-product-bar"
import { RelatedProducts } from "@/components/product/related-products"
import { ProductJsonLd } from "@/components/seo/product-json-ld"
import { getProductBySlug, getProducts } from "@/lib/services/product-service"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: "Product Not Found | Fàdè" }
  }

  const images = Array.isArray(product.images) ? (product.images as string[]) : []
  const firstImage = images[0] || ""

  return {
    title: `${product.name} | ${product.brand || "Fàdè"} | Fàdè Essence`,
    description: product.description,
    openGraph: {
      title: `${product.name} | Fàdè Essence`,
      description: product.description,
      images: firstImage ? [firstImage] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const images = Array.isArray(product.images)
    ? (product.images as string[]).filter((img): img is string => typeof img === "string")
    : []

  const relatedProducts = (await getProducts({ category: product.category, limit: 5 }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4)
    .map((p) => {
      const pImages = Array.isArray(p.images)
        ? (p.images as string[]).filter((img): img is string => typeof img === "string")
        : []
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand || "",
        price: p.priceNGN,
        originalPrice: p.oldPriceNGN || undefined,
        image: pImages[0] || "",
        rating: p.ratingAvg,
        reviewCount: p.ratingCount,
        tags: [
          p.isNew && "new",
          p.isBestseller && "bestseller",
          p.isLimited && "limited",
        ].filter(Boolean) as ("new" | "bestseller" | "limited")[],
        category: "perfumes" as const,
      }
    })

  const productDetails = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand || "",
    price: product.priceNGN,
    originalPrice: product.oldPriceNGN || undefined,
    image: images[0] || "",
    rating: product.ratingAvg,
    reviewCount: product.ratingCount,
    tags: ([
      product.isNew && "new",
      product.isBestseller && "bestseller",
      product.isLimited && "limited",
    ].filter(Boolean)) as ("new" | "bestseller" | "limited")[],
    category: "perfumes" as const,
    images: images.length > 0 ? images : ["/placeholder.svg"],
    description: product.description,
    specifications: [
      ...(product.longevity ? [{ label: "Wear time", value: product.longevity }] : []),
      ...(product.occasion ? [{ label: "Occasion", value: product.occasion }] : []),
      ...(product.productType ? [{ label: "Type", value: product.productType }] : []),
    ].filter(Boolean) as { label: string; value: string }[],
    inStock: product.stock > 0,
    stockCount: product.stock,
  }

  const availability = product.stock > 0 ? "InStock" : "OutOfStock"

  return (
    <MainLayout>
      <ProductJsonLd
        name={productDetails.name}
        description={productDetails.description}
        image={productDetails.images}
        price={product.priceNGN}
        currency="NGN"
        brand={productDetails.brand || undefined}
        availability={availability}
        rating={productDetails.rating}
        reviewCount={productDetails.reviewCount}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-24 lg:pb-12">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <span aria-hidden className="text-border">/</span>
          <Link href="/shop" className="transition-colors hover:text-foreground">Perfumes</Link>
          {productDetails.brand ? (
            <>
              <span aria-hidden className="text-border">/</span>
              <Link
                href={`/shop?brand=${encodeURIComponent(productDetails.brand)}`}
                className="transition-colors hover:text-foreground"
              >
                {productDetails.brand}
              </Link>
            </>
          ) : null}
          <span aria-hidden className="text-border">/</span>
          <span className="truncate text-foreground/70">{productDetails.name}</span>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <ProductGallery images={productDetails.images} productName={productDetails.name} />
          <ProductInfo product={productDetails} />
        </div>
        <StickyProductBar product={productDetails} />

        <ProductTabs
          description={productDetails.description}
          specifications={productDetails.specifications}
          productId={productDetails.id}
          productSlug={productDetails.slug}
          notesTop={product.notesTop ?? undefined}
          notesHeart={product.notesHeart ?? undefined}
          notesBase={product.notesBase ?? undefined}
          longevity={product.longevity ?? undefined}
          occasion={product.occasion ?? undefined}
        />

        {relatedProducts.length > 0 && <RelatedProducts products={relatedProducts} />}
      </div>
    </MainLayout>
  )
}
