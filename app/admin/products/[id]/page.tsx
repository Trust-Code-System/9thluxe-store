import { notFound, redirect } from "next/navigation"
import { ProductCategory } from "@prisma/client"

import { ProductForm, type ProductFormInitialValues } from "@/components/admin/product-form"
import { getCollectionsWithCounts } from "@/lib/services/collection-service"
import { getAdminProductById, parseProductFormData, updateProduct, getUniqueBrands } from "@/lib/services/product-service"
import { prisma } from "@/lib/prisma"
import { sendPriceDropAlert } from "@/emails/sendPriceDropAlert"

export const dynamic = "force-dynamic"

const categoryOptions = [
  { label: "Perfumes", value: ProductCategory.PERFUMES },
]

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  
  const [product, collections, brands] = await Promise.all([
    getAdminProductById(id),
    getCollectionsWithCounts(),
    getUniqueBrands(),
  ])

  if (!product) {
    notFound()
  }

  const images = Array.isArray(product.images) ? (product.images as string[]) : []

  const initialValues: ProductFormInitialValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand: product.brand,
    category: product.category,
    priceNGN: product.priceNGN,
    oldPriceNGN: product.oldPriceNGN ?? undefined,
    currency: product.currency,
    stock: product.stock,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    isNew: product.isNew,
    isLimited: product.isLimited,
    images,
    collectionId: product.collectionId,
    fragranceFamily: product.fragranceFamily,
  }

  async function handleUpdate(formData: FormData) {
    "use server"

    const { id: productId } = await params
    const input = parseProductFormData(formData)

    // Check price before updating for price-drop alerts
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { priceNGN: true, name: true, slug: true },
    })

    await updateProduct(productId, input)

    // Send price drop alerts to wishlist users if price decreased
    if (current && input.priceNGN < current.priceNGN) {
      try {
        const wishlistEntries = await prisma.wishlist.findMany({
          where: { productId },
          include: { user: { select: { email: true, name: true } } },
        })
        for (const entry of wishlistEntries) {
          await sendPriceDropAlert({
            to: entry.user.email,
            customerName: entry.user.name,
            productName: input.name,
            productSlug: current.slug,
            oldPriceNGN: current.priceNGN,
            newPriceNGN: input.priceNGN,
          })
        }
      } catch (e) {
        console.error("Price drop alert failed:", e)
      }
    }

    redirect("/admin/products?success=updated")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit product</h1>
          <p className="text-muted-foreground">Update product details for the Fádé storefront.</p>
        </div>
      </div>

      <ProductForm
        initialValues={initialValues}
        action={handleUpdate}
        categories={categoryOptions}
        collections={collections}
        brands={brands}
        submitLabel="Save changes"
      />
    </div>
  )
}
