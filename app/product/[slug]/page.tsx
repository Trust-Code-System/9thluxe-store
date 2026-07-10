import { notFound } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductInfo } from "@/components/product/product-info"
import { ProductTabs } from "@/components/product/product-tabs"
import { RelatedProducts } from "@/components/product/related-products"
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/products"
import { Category } from "@prisma/client"
import type { Metadata } from "next"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: "Product Not Found | Fàdè" }
  }

  return {
    title: `${product.name} | ${product.brand || ""} | Fàdè`,
    description: product.description || `Shop ${product.name} by ${product.brand || "Fàdè"}. Premium quality available at Fàdè.`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = await getRelatedProducts(product.id, product.category, 4)

  const images = Array.isArray(product.images) 
    ? product.images as string[]
    : typeof product.images === 'string'
    ? [product.images]
    : product.images && typeof product.images === 'object'
    ? [product.images]
    : []

  // Build specifications based on category
  const specifications: { label: string; value: string }[] = []
  
  if (product.category === "WATCHES") {
    if (product.material) specifications.push({ label: "Case Material", value: product.material })
    if (product.waterResistance) specifications.push({ label: "Water Resistance", value: product.waterResistance })
    if (product.warranty) specifications.push({ label: "Warranty", value: product.warranty })
  } else if (product.category === "PERFUMES") {
    if (product.notesTop) specifications.push({ label: "Top Notes", value: product.notesTop })
    if (product.notesHeart) specifications.push({ label: "Heart Notes", value: product.notesHeart })
    if (product.notesBase) specifications.push({ label: "Base Notes", value: product.notesBase })
    if (product.longevity) specifications.push({ label: "Longevity", value: product.longevity })
  } else if (product.category === "GLASSES") {
    if (product.material) specifications.push({ label: "Frame Material", value: product.material })
    if (product.lensType) specifications.push({ label: "Lens Type", value: product.lensType })
    if (product.warranty) specifications.push({ label: "Warranty", value: product.warranty })
  }

  // Build product data for UI components
  const productData = {
    ...product,
    images: images.length > 0 ? images : ["/placeholder.svg"],
    description: product.description || "Experience the epitome of luxury craftsmanship with this exceptional piece.",
    specifications,
    inStock: product.stock > 0,
    stockCount: product.stock,
    rating: product.ratingAvg || 0,
    reviewCount: product.ratingCount || 0,
  }

  return (
    <MainLayout cartItemCount={3}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <ProductGallery images={productData.images} productName={product.name} />
          <ProductInfo product={productData} />
        </div>

        {/* Product Details Tabs */}
        <ProductTabs 
          description={productData.description} 
          specifications={productData.specifications}
          reviews={product.reviews || []}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts.map(p => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand || "Unknown",
            price: p.priceNGN,
            originalPrice: undefined,
            image: Array.isArray(p.images) 
              ? (p.images as string[])[0] || "/placeholder.svg"
              : typeof p.images === 'string'
              ? p.images
              : "/placeholder.svg",
            rating: p.ratingAvg || 0,
            reviewCount: p.ratingCount || 0,
            tags: [],
            category: product.category === "WATCHES" ? "watches" 
              : product.category === "PERFUMES" ? "perfumes" 
              : "eyeglasses",
          }))} />
        )}
      </div>
    </MainLayout>
  )
}
