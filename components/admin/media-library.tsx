"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Upload, Link2, Loader2, Trash2, Copy, Search, X } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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

interface Asset {
  id: string
  url: string
  kind: string
  filename: string | null
  alt: string | null
  caption: string | null
  sizeBytes: number | null
  source: string
}

function humanSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaLibrary({
  initialAssets,
  loadError,
}: {
  initialAssets: Asset[]
  loadError: boolean
}) {
  const router = useRouter()
  const fileInput = React.useRef<HTMLInputElement>(null)
  const [assets, setAssets] = React.useState<Asset[]>(initialAssets)
  const [search, setSearch] = React.useState("")
  const [kind, setKind] = React.useState<"all" | "image" | "video">("all")
  const [uploading, setUploading] = React.useState(false)
  const [urlOpen, setUrlOpen] = React.useState(false)
  const [urlValue, setUrlValue] = React.useState("")
  const [urlKind, setUrlKind] = React.useState<"image" | "video">("image")
  const [selected, setSelected] = React.useState<Asset | null>(null)
  const [deleting, setDeleting] = React.useState<{ asset: Asset; usage: number; forced: boolean } | null>(null)

  const refresh = React.useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (kind !== "all") params.set("kind", kind)
    const res = await fetch(`/api/admin/media?${params}`)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setAssets(data.assets ?? [])
  }, [search, kind])

  React.useEffect(() => {
    const t = setTimeout(refresh, 250)
    return () => clearTimeout(t)
  }, [refresh])

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const body = new FormData()
        body.append("file", file)
        const res = await fetch("/api/admin/media/upload", { method: "POST", body })
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          toast.success(`Uploaded ${file.name}`)
        } else {
          toast.error(data.error || `Failed to upload ${file.name}`)
        }
      }
      await refresh()
      router.refresh()
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  async function registerUrl() {
    const res = await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlValue, kind: urlKind }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success("Media added")
      setUrlOpen(false)
      setUrlValue("")
      await refresh()
      router.refresh()
    } else {
      toast.error(data.error || "Failed to add media")
    }
  }

  async function saveMeta() {
    if (!selected) return
    const res = await fetch(`/api/admin/media/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt: selected.alt ?? "", caption: selected.caption ?? "" }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success("Saved")
      setAssets((prev) => prev.map((a) => (a.id === selected.id ? { ...a, ...data.asset } : a)))
      setSelected(null)
    } else {
      toast.error(data.error || "Failed to save")
    }
  }

  async function requestDelete(asset: Asset) {
    const res = await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      toast.success("Deleted")
      setAssets((prev) => prev.filter((a) => a.id !== asset.id))
      return
    }
    if (res.status === 409) {
      // Referenced: ask for confirmation to force.
      const usageRes = await fetch(`/api/admin/media/${asset.id}`)
      const usageData = await usageRes.json().catch(() => ({ usage: [] }))
      setDeleting({ asset, usage: (usageData.usage ?? []).length, forced: true })
      return
    }
    toast.error(data.error || "Failed to delete")
  }

  async function confirmForceDelete() {
    if (!deleting) return
    const res = await fetch(`/api/admin/media/${deleting.asset.id}?force=1`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Deleted")
      setAssets((prev) => prev.filter((a) => a.id !== deleting.asset.id))
    } else {
      toast.error("Failed to delete")
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-muted-foreground">
            The media table could not be reached. If the <code>media_library</code> migration has
            not been applied to this environment yet, apply it to enable the library.
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
        <Button size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Upload
        </Button>
        <Button size="sm" variant="outline" onClick={() => setUrlOpen(true)}>
          <Link2 className="mr-2 h-4 w-4" />
          Add by URL
        </Button>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 pl-9"
          />
        </div>
        <div className="flex overflow-hidden rounded-md border border-border">
          {(["all", "image", "video"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`px-3 py-1.5 text-xs capitalize ${kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No media yet. Upload files or add an existing URL to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {assets.map((asset) => (
            <Card key={asset.id} className="group overflow-hidden">
              <button
                className="relative block aspect-square w-full overflow-hidden bg-muted"
                onClick={() => setSelected(asset)}
                title="Edit details"
              >
                {asset.kind === "video" ? (
                  <video src={asset.url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={asset.url} alt={asset.alt ?? ""} className="h-full w-full object-cover" loading="lazy" />
                )}
                {!asset.alt && asset.kind === "image" && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-medium uppercase text-white">
                    No alt
                  </span>
                )}
              </button>
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="truncate text-xs text-muted-foreground" title={asset.filename ?? asset.url}>
                  {asset.filename ?? asset.url}
                </span>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Copy URL"
                    onClick={() => {
                      navigator.clipboard?.writeText(asset.url)
                      toast.success("URL copied")
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    title="Delete"
                    onClick={() => requestDelete(asset)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add-by-URL dialog */}
      <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add media by URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="media-url">URL</Label>
              <Input
                id="media-url"
                placeholder="/images/... or https://..."
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(["image", "video"] as const).map((k) => (
                <Button
                  key={k}
                  type="button"
                  size="sm"
                  variant={urlKind === k ? "default" : "outline"}
                  onClick={() => setUrlKind(k)}
                  className="capitalize"
                >
                  {k}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlOpen(false)}>
              Cancel
            </Button>
            <Button onClick={registerUrl} disabled={!urlValue.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details / edit dialog */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Media details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-md border border-border bg-muted">
                {selected.kind === "video" ? (
                  <video src={selected.url} className="max-h-64 w-full object-contain" controls />
                ) : (
                  <img src={selected.url} alt={selected.alt ?? ""} className="max-h-64 w-full object-contain" />
                )}
              </div>
              <p className="break-all text-xs text-muted-foreground">
                {selected.url} · {selected.source} · {humanSize(selected.sizeBytes)}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="media-alt">Alt text</Label>
                <Input
                  id="media-alt"
                  value={selected.alt ?? ""}
                  onChange={(e) => setSelected({ ...selected, alt: e.target.value })}
                  placeholder="Describe the image for accessibility"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="media-caption">Caption</Label>
                <Input
                  id="media-caption"
                  value={selected.caption ?? ""}
                  onChange={(e) => setSelected({ ...selected, caption: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button onClick={saveMeta}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force-delete confirmation */}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This asset is in use</AlertDialogTitle>
            <AlertDialogDescription>
              It is referenced by {deleting?.usage} item(s). Deleting it may leave broken images.
              Remove those references first, or force-delete anyway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmForceDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Force delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
