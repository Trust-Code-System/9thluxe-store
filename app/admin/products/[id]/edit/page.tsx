import { Category, Prisma } from '@prisma/client'
import { notFound, redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { ImageUploader } from './image-uploader'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  await requireAdmin()

  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    notFound()
  }

  const productRecord = product

  async function updateProduct(formData: FormData) {
    'use server'

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const priceNGN = parseInt(formData.get('priceNGN') as string)
    const category = formData.get('category') as Category
    const brand = formData.get('brand') as string
    const stock = parseInt(formData.get('stock') as string)
    const imagesInput = formData.get('images') as string

    // Parse images - handle both JSON string and comma-separated values
    let images: Prisma.InputJsonValue = productRecord.images as Prisma.InputJsonValue
    if (imagesInput) {
      try {
        images = JSON.parse(imagesInput)
      } catch {
        // If not JSON, treat as comma-separated
        images = imagesInput.split(',').map(img => img.trim()).filter(Boolean)
      }
    }

    await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description,
        priceNGN,
        category,
        brand: brand || null,
        stock,
        images,
      },
    })

    redirect('/admin/products')
  }

  const images = Array.isArray(productRecord.images) ? (productRecord.images as string[]) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Edit Product</h2>
      </div>

      <form action={updateProduct} className="rounded-3xl border border-border bg-card p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Product Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={productRecord.name}
              className="input w-full"
              placeholder="Enter product name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-foreground">
              Category *
            </label>
            <select id="category" name="category" required className="input w-full" defaultValue={productRecord.category}>
              <option value="WATCHES">Watches</option>
              <option value="PERFUMES">Perfumes</option>
              <option value="GLASSES">Eye Glasses</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="brand" className="text-sm font-medium text-foreground">
              Brand
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              defaultValue={productRecord.brand || ''}
              className="input w-full"
              placeholder="Enter brand name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="priceNGN" className="text-sm font-medium text-foreground">
              Price (NGN) *
            </label>
            <input
              id="priceNGN"
              name="priceNGN"
              type="number"
              required
              defaultValue={productRecord.priceNGN}
              className="input w-full"
              placeholder="Enter price"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="stock" className="text-sm font-medium text-foreground">
              Stock *
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              required
              defaultValue={productRecord.stock}
              className="input w-full"
              placeholder="Enter stock quantity"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            required
            defaultValue={productRecord.description}
            rows={4}
            className="input w-full"
            placeholder="Enter product description"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="images" className="text-sm font-medium text-foreground">
            Product Images
          </label>
          <ImageUploader 
            initialImages={images} 
            name="images"
          />
          <p className="text-xs text-muted-foreground">
            Upload up to 4 images from different angles. Use images with transparent background for best results.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn">
            Update Product
          </button>
          <a href="/admin/products" className="btn-outline">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
