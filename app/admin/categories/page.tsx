"use client"

import * as React from "react"
import { ProductCategory } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Trash2, Edit2, Save, X, Plus, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  enumKey: ProductCategory | null
  productCount: number
}

const productCategoryOptions = [
  { label: "Perfumes", value: ProductCategory.PERFUMES },
]

export default function AdminCategoriesPage() {
  const _router = useRouter()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [loading, setLoading] = React.useState(true)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
    enumKey: "" as string | ProductCategory,
  })
  const [editFormData, setEditFormData] = React.useState<Record<string, any>>({})

  React.useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/categories")
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories || [])
      } else {
        toast.error("Failed to load categories")
      }
    } catch (error) {
      console.error("Fetch categories error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          enumKey: formData.enumKey || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Category created successfully")
        setFormData({ name: "", slug: "", description: "", enumKey: "" })
        fetchCategories()
      } else {
        toast.error(data.error || "Failed to create category")
      }
    } catch (error) {
      console.error("Create category error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setEditFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      enumKey: category.enumKey || "",
    })
  }

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name,
          slug: editFormData.slug,
          description: editFormData.description || null,
          enumKey: editFormData.enumKey || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Category updated successfully")
        setEditingId(null)
        setEditFormData({})
        fetchCategories()
      } else {
        toast.error(data.error || "Failed to update category")
      }
    } catch (error) {
      console.error("Update category error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Category deleted successfully")
        setDeletingId(null)
        fetchCategories()
      } else {
        toast.error(data.error || "Failed to delete category")
        setDeletingId(null)
      }
    } catch (error) {
      console.error("Delete category error:", error)
      toast.error("An unexpected error occurred")
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Manage high-level product groupings used across the storefront.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Create Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Add Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Perfumes"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Name *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="perfumes"
                  required
                />
                <p className="text-xs text-muted-foreground">Auto-created from name above. You can change it if needed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="What this category is about"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enumKey">Product Type (Optional)</Label>
                <Select
                  value={formData.enumKey || "__none__"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, enumKey: value === "__none__" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose product type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No product type</SelectItem>
                    {productCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="enumKey" value={formData.enumKey} />
                <p className="text-xs text-muted-foreground">
                  Link this category to a product type to see how many products match.
                </p>
              </div>
              <Button type="submit" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Existing Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                No categories yet. Create one to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL Name</TableHead>
                      <TableHead>Product Type</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        {editingId === category.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editFormData.name}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                    slug: prev.slug || generateSlug(e.target.value),
                                  }))
                                }
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editFormData.slug}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({ ...prev, slug: e.target.value }))
                                }
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={editFormData.enumKey || "__none__"}
                                onValueChange={(value) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    enumKey: value === "__none__" ? "" : value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">None</SelectItem>
                                  {productCategoryOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">{category.productCount}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdate(category.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingId(null)
                                    setEditFormData({})
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {category.slug}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {category.enumKey ? category.enumKey.toLowerCase() : "N/A"}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {category.productCount}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(category)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingId(category.id)}
                                  disabled={category.productCount > 0}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title={
                                    category.productCount > 0
                                      ? "Cannot delete category with products"
                                      : "Delete category"
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
