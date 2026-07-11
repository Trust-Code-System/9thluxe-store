import { ProductCategory, Prisma } from '@prisma/client'
import { notFound, redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { ImageUploader } from '@/components/admin/image-uploader'
import { ScentStoryComposer } from '@/components/admin/scent-story-composer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sendPriceDropAlert } from '@/emails/sendPriceDropAlert'
import {
  getProductTemplate,
  setProductTemplate,
  ensureScentTemplateColumn,
  isTemplateId,
} from '@/lib/fragrance/template-store'

/** Empty / sentinel string -> null, for optional text columns. */
function nn(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)?.trim()
  return s && s !== 'NONE' ? s : null
}

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()

  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
  })

  if (!product) {
    notFound()
  }

  const productRecord = product

  async function updateProduct(formData: FormData) {
    'use server'

    const { id: productId } = await params
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const priceNGN = parseInt(formData.get('priceNGN') as string)
    const category = formData.get('category') as ProductCategory
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

    const fragranceFamily = nn(formData.get('fragranceFamily'))

    // Scent-story fields (persisted to real columns; the composition regenerates from these).
    const scentData = {
      notesTop: nn(formData.get('notesTop')),
      notesHeart: nn(formData.get('notesHeart')),
      notesBase: nn(formData.get('notesBase')),
      mainAccords: nn(formData.get('mainAccords')),
      olfactoryDesc: nn(formData.get('olfactoryDesc')),
      moodTags: nn(formData.get('moodTags')),
      season: nn(formData.get('season')),
      climate: nn(formData.get('climate')),
      timeOfDay: nn(formData.get('timeOfDay')),
      occasion: nn(formData.get('occasion')),
    }

    // Draft / publish action. Only set when a draft/publish button was the submitter; the plain
    // "Update Product" button leaves publish status untouched.
    const rawPublish = formData.get('publishStatus') as string | null
    const publishStatus =
      rawPublish === 'PUBLISHED' ? 'PUBLISHED' : rawPublish === 'DRAFT' ? 'DRAFT' : undefined

    // Fetch current price to check for price drops
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { priceNGN: true, name: true, slug: true },
    })

    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        priceNGN,
        category,
        brand: brand || null,
        stock,
        images,
        fragranceFamily,
        ...scentData,
        ...(publishStatus ? { publishStatus } : {}),
      },
    })

    // Persist the chosen visual template (resilient: additive column, applied on demand). Empty
    // value clears the override so the storefront uses the recommended template.
    if (formData.has('scentTemplate')) {
      const rawTemplate = ((formData.get('scentTemplate') as string) || '').trim()
      const template = rawTemplate && isTemplateId(rawTemplate) ? rawTemplate : null
      await ensureScentTemplateColumn()
      await setProductTemplate(productId, template)
    }

    // Send price drop alerts if price decreased
    if (currentProduct && !isNaN(priceNGN) && priceNGN < currentProduct.priceNGN) {
      try {
        const wishlistEntries = await prisma.wishlist.findMany({
          where: { productId },
          include: { user: { select: { email: true, name: true } } },
        })
        for (const entry of wishlistEntries) {
          await sendPriceDropAlert({
            to: entry.user.email,
            customerName: entry.user.name,
            productName: name || currentProduct.name,
            productSlug: currentProduct.slug,
            oldPriceNGN: currentProduct.priceNGN,
            newPriceNGN: priceNGN,
          })
        }
      } catch (e) {
        console.error('Price drop alert failed:', e)
      }
    }

    redirect('/admin/products')
  }

  const images = Array.isArray(productRecord.images) ? (productRecord.images as string[]) : []
  const savedTemplate = await getProductTemplate(productRecord.id)

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
            <Select name="category" required defaultValue={productRecord.category}>
              <SelectTrigger id="category" className="w-full" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERFUMES">Perfumes</SelectItem>
              </SelectContent>
            </Select>
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

        <ScentStoryComposer
          initial={{
            notesTop: productRecord.notesTop || '',
            notesHeart: productRecord.notesHeart || '',
            notesBase: productRecord.notesBase || '',
            mainAccords: productRecord.mainAccords || '',
            fragranceFamily: productRecord.fragranceFamily || '',
            olfactoryDesc: productRecord.olfactoryDesc || '',
            moodTags: productRecord.moodTags || '',
            season: productRecord.season || '',
            climate: productRecord.climate || '',
            timeOfDay: productRecord.timeOfDay || '',
            occasion: productRecord.occasion || '',
            bottleImage: images[0] ?? null,
            productName: productRecord.name,
            publishStatus: productRecord.publishStatus,
            scentTemplate: savedTemplate ?? '',
          }}
        />

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
