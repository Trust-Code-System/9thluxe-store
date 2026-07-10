import { redirect } from "next/navigation"
import { ProductCategory } from "@prisma/client"

import { ProductForm } from "@/components/admin/product-form"
import { getCollectionsWithCounts } from "@/lib/services/collection-service"
import { createProduct, parseProductFormData, getUniqueBrands } from "@/lib/services/product-service"

export const dynamic = "force-dynamic"

const categoryOptions = [
  { label: "Perfumes", value: ProductCategory.PERFUMES },
]

export default async function NewProductPage() {
  const [collections, brands] = await Promise.all([
    getCollectionsWithCounts(),
    getUniqueBrands(),
  ])

  async function handleCreate(formData: FormData) {
    "use server"

    const input = parseProductFormData(formData)
    await createProduct(input)

    redirect("/admin/products?success=created")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Add product</h1>
          <p className="text-muted-foreground">Create a new product for the Fádé storefront.</p>
        </div>
      </div>

      <ProductForm
        action={handleCreate}
        categories={categoryOptions}
        collections={collections}
        brands={brands}
        submitLabel="Create product"
      />
    </div>
  )
}
