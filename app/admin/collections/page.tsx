import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CollectionInUseError,
  createCollection,
  deleteCollection,
  getCollectionsWithCounts,
  updateCollection,
} from "@/lib/services/collection-service"

export const dynamic = "force-dynamic"

interface AdminCollectionsPageProps {
  searchParams?: Promise<{
    success?: string
    error?: string
  }>
}

export default async function AdminCollectionsPage({ searchParams }: AdminCollectionsPageProps) {
  const collections = await getCollectionsWithCounts()
  const params = await searchParams
  const success = params?.success
  const error = params?.error

  async function createCollectionAction(formData: FormData) {
    "use server"

    await createCollection({
      name: (formData.get("name") as string) ?? "",
      slug: (formData.get("slug") as string) ?? "",
      description: (formData.get("description") as string) || undefined,
    })

    redirect("/admin/collections?success=created")
  }

  async function updateCollectionAction(formData: FormData) {
    "use server"

    const id = formData.get("id") as string
    if (!id) redirect("/admin/collections")

    await updateCollection(id, {
      name: (formData.get("name") as string) ?? "",
      slug: (formData.get("slug") as string) ?? "",
      description: (formData.get("description") as string) || undefined,
    })

    redirect("/admin/collections?success=updated")
  }

  async function deleteCollectionAction(formData: FormData) {
    "use server"

    const id = formData.get("id") as string
    if (!id) redirect("/admin/collections")

    try {
      await deleteCollection(id)
      redirect("/admin/collections?success=deleted")
    } catch (e) {
      if (e instanceof CollectionInUseError) {
        redirect("/admin/collections?error=in-use")
      }
      throw e
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Collections</h1>
        <p className="text-muted-foreground">
          Group products into curated collections such as &ldquo;Bestsellers&rdquo; or &ldquo;New Arrivals&rdquo;.
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-900 dark:text-emerald-100">
          {success === "created" && "Collection created successfully."}
          {success === "updated" && "Collection updated successfully."}
          {success === "deleted" && "Collection deleted successfully."}
        </div>
      )}

      {error === "in-use" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-50">
          Cannot delete a collection while products are still assigned to it.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* Create / update */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add collection</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createCollectionAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Bestsellers" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" placeholder="bestsellers" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Short description shown in the UI."
                  />
                </div>
                <Button type="submit" size="sm">
                  Create collection
                </Button>
              </form>
            </CardContent>
          </Card>

          {collections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rename collection</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={updateCollectionAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="id">Collection</Label>
                    <Select name="id" required>
                      <SelectTrigger id="id" className="w-full" aria-label="Collection">
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name} ({collection.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-name">New name</Label>
                    <Input id="new-name" name="name" placeholder="Updated name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-slug">New slug</Label>
                    <Input id="new-slug" name="slug" placeholder="updated-slug" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-description">Description</Label>
                    <Input id="new-description" name="description" placeholder="Updated description" />
                  </div>
                  <Button type="submit" size="sm">
                    Save changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* List */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Existing collections</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {collections.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                No collections yet. Create one to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>{collection.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{collection.slug}</TableCell>
                        <TableCell className="text-right text-sm">{collection._count.products}</TableCell>
                        <TableCell className="text-right">
                          <form action={deleteCollectionAction}>
                            <input type="hidden" name="id" value={collection.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                            >
                              Delete
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
