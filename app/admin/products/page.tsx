import Link from "next/link"
import Image from "next/image"
import { PackageSearch, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAdminProducts } from "@/lib/services/product-service"
import { DeleteButton } from "./delete-button"
import type { ProductCategory } from "@prisma/client"

export const dynamic = "force-dynamic"

interface AdminProductsPageProps {
  searchParams?: Promise<{
    q?: string
    category?: string
    success?: string
  }>
}

const categoryLabels: Record<ProductCategory, string> = {
  PERFUMES: "Perfumes",
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams
  const q = params?.q?.toString() ?? ""
  const categorySlug = params?.category?.toString() ?? "all"
  const success = params?.success

  const products = await getAdminProducts({
    search: q || undefined,
    categorySlug: categorySlug === "all" ? undefined : categorySlug,
  })

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Create, update and manage storefront products.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add product
          </Link>
        </Button>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-900 dark:text-emerald-100">
          {success === "created" && "Product created successfully."}
          {success === "updated" && "Product updated successfully."}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">All products</CardTitle>
            <form className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center" method="get">
              <div className="relative flex-1 sm:min-w-[300px]">
                <PackageSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name or brand..."
                  className="h-10 pl-10 pr-3"
                />
              </div>
              <Select name="category" defaultValue={categorySlug}>
                <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filter by category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="perfumes">Perfumes</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="outline" size="sm" className="h-10 px-4">
                Filter
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-2">
              <p className="text-sm">No products found for this filter.</p>
              <p className="text-xs">Try adjusting your search or add a new product.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const images = Array.isArray(product.images) ? (product.images as string[]) : []
                    const mainImage = images[0] || "/placeholder-flacon.svg"
                    const inStock = product.stock > 0

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
                            <Image src={mainImage} alt={product.name} fill className="object-cover" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="font-medium hover:underline"
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {product.brand || "No brand"} · {product.slug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {categoryLabels[product.category] || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatPrice(product.priceNGN)}
                          {product.oldPriceNGN && (
                            <span className="ml-2 text-xs text-muted-foreground line-through">
                              {formatPrice(product.oldPriceNGN)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              inStock
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            }
                          >
                            {inStock ? "In stock" : "Out of stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs">
                              <Link href={`/admin/products/${product.id}`}>Edit</Link>
                            </Button>
                            <DeleteButton productId={product.id} productName={product.name} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
