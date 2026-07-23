"use client"

import * as React from "react"
import { ProductCategory, type Collection } from "@prisma/client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ImageUploader } from "@/components/admin/image-uploader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ProductFormCategoryOption = {
  label: string
  value: ProductCategory
}

export interface ProductFormInitialValues {
  id?: string
  name?: string
  slug?: string
  description?: string
  brand?: string | null
  category?: ProductCategory
  priceNGN?: number
  oldPriceNGN?: number | null
  currency?: string
  stock?: number
  ratingAvg?: number
  ratingCount?: number
  isFeatured?: boolean
  isBestseller?: boolean
  isNew?: boolean
  isLimited?: boolean
  images?: string[]
  collectionId?: string | null
  fragranceFamily?: string | null
  sku?: string | null; barcode?: string | null; launchYear?: number | null; perfumer?: string | null; countryOfOrigin?: string | null
  concentration?: string | null; longevity?: string | null; sillage?: string | null; intensity?: string | null; sprayGuidance?: string | null
  climate?: string | null; season?: string | null; timeOfDay?: string | null; occasion?: string | null
  weightGrams?: number | null; shippingClass?: string | null; reorderPoint?: number | null; dropDate?: string | null
  seoTitle?: string | null; seoDescription?: string | null; publishStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  beginnerFriendly?: boolean; returnEligible?: boolean; isPreorder?: boolean; isWaitlist?: boolean
}

interface ProductFormProps {
  initialValues?: ProductFormInitialValues
  categories: ProductFormCategoryOption[]
  collections: Pick<Collection, "id" | "name">[]
  brands?: string[]
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

const CURRENCIES = [
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
]

export function ProductForm({ initialValues, categories, collections, brands = [], action, submitLabel }: ProductFormProps) {
  const images = Array.isArray(initialValues?.images) ? initialValues?.images : []
  const [name, setName] = React.useState(initialValues?.name ?? "")
  const [slug, setSlug] = React.useState(initialValues?.slug ?? "")
  const [selectedBrand, setSelectedBrand] = React.useState(initialValues?.brand ?? "")
  const [customBrand, setCustomBrand] = React.useState("")
  const [showCustomBrand, setShowCustomBrand] = React.useState(!initialValues?.brand || !brands.includes(initialValues.brand))
  const [category, setCategory] = React.useState(initialValues?.category ?? ProductCategory.PERFUMES)
  const [collectionId, setCollectionId] = React.useState(initialValues?.collectionId ?? "")
  const [currency, setCurrency] = React.useState(initialValues?.currency ?? "NGN")
  const [fragranceFamily, setFragranceFamily] = React.useState(initialValues?.fragranceFamily ?? "")

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!initialValues?.id && name && !slug) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
      setSlug(generatedSlug)
    }
  }, [name, slug, initialValues?.id])

  const handleBrandChange = (value: string) => {
    if (value === "__custom__") {
      setShowCustomBrand(true)
      setSelectedBrand("")
    } else {
      setShowCustomBrand(false)
      setSelectedBrand(value)
      setCustomBrand("")
    }
  }

  return (
    <form action={action} className="space-y-8">
      {initialValues?.id && <input type="hidden" name="id" value={initialValues.id} />}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="product-slug-url"
                required
              />
              <p className="text-xs text-muted-foreground">Auto-generated from name. Edit if needed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              {brands.length > 0 ? (
                <>
                  <Select
                    value={showCustomBrand ? "__custom__" : selectedBrand}
                    onValueChange={handleBrandChange}
                  >
                    <SelectTrigger id="brand">
                      <SelectValue placeholder="Select or add brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">+ Add New Brand</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomBrand && (
                    <Input
                      id="customBrand"
                      name="brand"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Enter brand name"
                      className="mt-2"
                    />
                  )}
                  {!showCustomBrand && <input type="hidden" name="brand" value={selectedBrand || ""} />}
                </>
              ) : (
                <Input 
                  id="brand" 
                  name="brand" 
                  defaultValue={initialValues?.brand ?? ""} 
                  placeholder="Enter brand name" 
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ProductCategory)} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="category" value={category} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collectionId">Collection</Label>
              <Select value={collectionId || "__none__"} onValueChange={(value) => setCollectionId(value === "__none__" ? "" : value)}>
                <SelectTrigger id="collectionId">
                  <SelectValue placeholder="Select collection (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="collectionId" value={collectionId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fragranceFamily">Fragrance Family</Label>
              <Select value={fragranceFamily || "__none__"} onValueChange={(v) => setFragranceFamily(v === "__none__" ? "" : v)}>
                <SelectTrigger id="fragranceFamily">
                  <SelectValue placeholder="Select family (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="CITRUS">Citrus</SelectItem>
                  <SelectItem value="WOODY">Woody</SelectItem>
                  <SelectItem value="FLORAL">Floral</SelectItem>
                  <SelectItem value="ORIENTAL">Oriental</SelectItem>
                  <SelectItem value="FRESH">Fresh</SelectItem>
                  <SelectItem value="SPICY">Spicy</SelectItem>
                  <SelectItem value="GOURMAND">Gourmand</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="fragranceFamily" value={fragranceFamily} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceNGN">Price (NGN)</Label>
                <Input
                  id="priceNGN"
                  name="priceNGN"
                  type="number"
                  min={0}
                  defaultValue={initialValues?.priceNGN ?? ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oldPriceNGN">Compare-at price</Label>
                <Input
                  id="oldPriceNGN"
                  name="oldPriceNGN"
                  type="number"
                  min={0}
                  defaultValue={initialValues?.oldPriceNGN ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.value} value={curr.value}>
                        {curr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="currency" value={currency} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min={0}
                  defaultValue={initialValues?.stock ?? 0}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ratingAvg">Rating</Label>
                <Input
                  id="ratingAvg"
                  name="ratingAvg"
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  defaultValue={initialValues?.ratingAvg ?? 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ratingCount">Review count</Label>
                <Input
                  id="ratingCount"
                  name="ratingCount"
                  type="number"
                  min={0}
                  defaultValue={initialValues?.ratingCount ?? 0}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Flags</Label>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    defaultChecked={Boolean(initialValues?.isFeatured)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isBestseller"
                    defaultChecked={Boolean(initialValues?.isBestseller)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <span>Bestseller</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isNew"
                    defaultChecked={Boolean(initialValues?.isNew)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <span>New</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isLimited"
                    defaultChecked={Boolean(initialValues?.isLimited)}
                    className="h-4 w-4 rounded border border-input"
                  />
                  <span>Limited</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialValues?.description ?? ""}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUploader initialImages={images} name="images" />
            <p className="text-xs text-muted-foreground">
              Upload up to 4 images. The first image will be used as the thumbnail on the storefront.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardContent className="space-y-6 pt-6">
          <h2 className="font-serif text-xl">Catalogue, performance, commerce and SEO</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['sku','SKU'],['barcode','Barcode'],['launchYear','Launch year'],['perfumer','Perfumer'],['countryOfOrigin','Country of origin'],['concentration','Concentration'],['longevity','Longevity'],['sillage','Sillage'],['intensity','Intensity'],['climate','Climate'],['season','Season'],['timeOfDay','Time of day'],['occasion','Occasion'],['weightGrams','Weight (grams)'],['shippingClass','Shipping class'],['reorderPoint','Reorder point'],['dropDate','Drop date']].map(([key,label]) => <div className="space-y-2" key={key}><Label htmlFor={key}>{label}</Label><Input id={key} name={key} type={key === 'launchYear' || key === 'weightGrams' || key === 'reorderPoint' ? 'number' : key === 'dropDate' ? 'datetime-local' : 'text'} defaultValue={String(initialValues?.[key as keyof ProductFormInitialValues] ?? '')} /></div>)}
          </div>
          <div className="space-y-2"><Label htmlFor="sprayGuidance">Spray guidance</Label><Textarea id="sprayGuidance" name="sprayGuidance" defaultValue={initialValues?.sprayGuidance ?? ''} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="seoTitle">SEO title</Label><Input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={initialValues?.seoTitle ?? ''} /></div><div className="space-y-2"><Label htmlFor="seoDescription">SEO description</Label><Textarea id="seoDescription" name="seoDescription" maxLength={180} defaultValue={initialValues?.seoDescription ?? ''} /></div></div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">{[['beginnerFriendly','Beginner friendly'],['returnEligible','Return eligible'],['isPreorder','Preorder'],['isWaitlist','Waitlist']].map(([key,label]) => <label className="flex items-center gap-2" key={key}><input type="checkbox" name={key} defaultChecked={key === 'returnEligible' ? initialValues?.returnEligible !== false : Boolean(initialValues?.[key as keyof ProductFormInitialValues])} />{label}</label>)}</div>
          <div className="space-y-2"><Label htmlFor="publishStatus">Publish status</Label><select id="publishStatus" name="publishStatus" defaultValue={initialValues?.publishStatus ?? 'DRAFT'} className="input"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="submit" size="lg" className="min-w-[140px]">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
