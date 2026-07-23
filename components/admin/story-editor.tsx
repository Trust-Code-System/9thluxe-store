"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Type,
  Quote,
  ImageIcon,
  Minus,
  Package,
  MousePointerClick,
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { StoryBlockType } from "@/lib/stories/types"
import { MediaPicker } from "@/components/admin/media-picker"
import { RevisionHistory } from "@/components/admin/revision-history"

export interface ProductOption {
  id: string
  slug: string
  name: string
}

export interface EditorBlock {
  type: StoryBlockType
  data: Record<string, any>
}

export interface StoryEditorInitial {
  id?: string
  updatedAt?: string
  slug?: string
  title: string
  subtitle: string
  excerpt: string
  category: string
  readTime: string
  author: string
  tags: string
  coverImageUrl: string
  mobileCoverUrl: string
  socialImageUrl: string
  seoTitle: string
  seoDescription: string
  featured: boolean
  position: number
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  scheduledFor: string
  unpublishAt: string
  blocks: EditorBlock[]
  relatedProductIds: string[]
}

const BLOCK_MENU: { type: StoryBlockType; label: string; icon: React.ElementType }[] = [
  { type: "heading", label: "Heading", icon: Type },
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "product", label: "Product", icon: Package },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "divider", label: "Divider", icon: Minus },
]

function emptyBlock(type: StoryBlockType): EditorBlock {
  switch (type) {
    case "heading":
      return { type, data: { text: "", level: 2 } }
    case "image":
      return { type, data: { url: "", alt: "", caption: "" } }
    case "product":
      return { type, data: { productSlug: "" } }
    case "button":
      return { type, data: { label: "", href: "" } }
    case "divider":
      return { type, data: {} }
    default:
      return { type, data: { text: "" } }
  }
}

export function StoryEditor({
  initial,
  products,
  mode,
}: {
  initial: StoryEditorInitial
  products: ProductOption[]
  mode: "create" | "edit"
}) {
  const router = useRouter()
  const [form, setForm] = React.useState<StoryEditorInitial>(initial)
  const [saving, setSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const [productQuery, setProductQuery] = React.useState("")

  const set = <K extends keyof StoryEditorInitial>(key: K, value: StoryEditorInitial[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  // Warn on unsaved changes when navigating away.
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const addBlock = (type: StoryBlockType) => {
    setForm((prev) => ({ ...prev, blocks: [...prev.blocks, emptyBlock(type)] }))
    setDirty(true)
  }
  const updateBlock = (i: number, data: Record<string, any>) => {
    setForm((prev) => {
      const blocks = [...prev.blocks]
      blocks[i] = { ...blocks[i], data: { ...blocks[i].data, ...data } }
      return { ...prev, blocks }
    })
    setDirty(true)
  }
  const removeBlock = (i: number) => {
    setForm((prev) => ({ ...prev, blocks: prev.blocks.filter((_, idx) => idx !== i) }))
    setDirty(true)
  }
  const moveBlock = (i: number, dir: -1 | 1) => {
    setForm((prev) => {
      const blocks = [...prev.blocks]
      const j = i + dir
      if (j < 0 || j >= blocks.length) return prev
      ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
      return { ...prev, blocks }
    })
    setDirty(true)
  }

  const toggleProduct = (id: string) => {
    setForm((prev) => {
      const has = prev.relatedProductIds.includes(id)
      return {
        ...prev,
        relatedProductIds: has
          ? prev.relatedProductIds.filter((x) => x !== id)
          : [...prev.relatedProductIds, id],
      }
    })
    setDirty(true)
  }

  async function save(nextStatus?: StoryEditorInitial["status"]) {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    setSaving(true)
    const status = nextStatus ?? form.status
    const payload = {
      ...form,
      status,
      position: Number(form.position) || 0,
      scheduledFor: form.scheduledFor || null,
      unpublishAt: form.unpublishAt || null,
      expectedUpdatedAt: form.updatedAt,
    }
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/stories" : `/api/admin/stories/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setDirty(false)
        toast.success(mode === "create" ? "Story created" : "Story saved")
        if (mode === "create" && data.story?.id) {
          router.push(`/admin/stories/${data.story.id}/edit`)
        } else if (data.story) {
          setForm((prev) => ({ ...prev, status: data.story.status, updatedAt: data.story.updatedAt }))
          router.refresh()
        }
      } else if (res.status === 409) {
        toast.error(data.error || "This story changed elsewhere. Reload before saving.")
      } else {
        toast.error(data.error || "Failed to save story")
      }
    } catch {
      toast.error("Network error while saving")
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = productQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
          p.slug.toLowerCase().includes(productQuery.toLowerCase())
      )
    : products

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {mode === "create" ? "New story" : "Edit story"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "edit" && form.slug ? (
              <>
                Public URL: <code>/journal/{form.slug}</code>
              </>
            ) : (
              "Draft an editorial story for the Journal."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RevisionHistory entityType="Story" entityId={form.id} />
          {mode === "edit" && form.status === "PUBLISHED" && form.slug && (
            <Button asChild variant="outline" size="sm">
              <a href={`/journal/${form.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View live
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => save("DRAFT")} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save draft
          </Button>
          <Button size="sm" onClick={() => save("PUBLISHED")} disabled={saving}>
            {form.scheduledFor && new Date(form.scheduledFor).getTime() > Date.now()
              ? "Schedule"
              : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Main column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Title *">
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="The 5 Best Oud Fragrances for Lagos Heat" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Slug (URL)">
                  <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" />
                </Field>
                <Field label="Category">
                  <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Fragrance Guide" />
                </Field>
              </div>
              <Field label="Subtitle">
                <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
              </Field>
              <Field label="Excerpt">
                <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} placeholder="Short summary shown on the journal index." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Author">
                  <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
                </Field>
                <Field label="Read time">
                  <Input value={form.readTime} onChange={(e) => set("readTime", e.target.value)} placeholder="5 min read" />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Blocks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.blocks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No content yet. Add a block below to start writing.
                </p>
              )}
              {form.blocks.map((block, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {block.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <IconBtn label="Move up" onClick={() => moveBlock(i, -1)} disabled={i === 0}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="Move down" onClick={() => moveBlock(i, 1)} disabled={i === form.blocks.length - 1}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn label="Remove block" onClick={() => removeBlock(i)} destructive>
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                  <BlockFields block={block} products={products} onChange={(d) => updateBlock(i, d)} />
                </div>
              ))}
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {BLOCK_MENU.map((b) => (
                  <Button key={b.type} variant="outline" size="sm" onClick={() => addBlock(b.type)}>
                    <b.icon className="mr-1.5 h-3.5 w-3.5" />
                    {b.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO &amp; sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="SEO title">
                <Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="Defaults to the story title" />
              </Field>
              <Field label="Meta description">
                <Textarea value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={2} placeholder="Defaults to the excerpt" />
              </Field>
              <Field label="Social share image URL">
                <MediaPicker value={form.socialImageUrl} onChange={(value) => set("socialImageUrl", value)} />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{form.status}</span>
              </div>
              <Field label="Publish schedule (optional)">
                <Input
                  type="datetime-local"
                  value={form.scheduledFor}
                  onChange={(e) => set("scheduledFor", e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Publishing with a future time here schedules the story; it stays hidden until then.
                </p>
              </Field>
              <Field label="Auto-unpublish (optional)">
                <Input
                  type="datetime-local"
                  value={form.unpublishAt}
                  onChange={(e) => set("unpublishAt", e.target.value)}
                />
              </Field>
              <label className="flex items-center justify-between gap-2">
                <span className="text-sm">Featured</span>
                <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
              </label>
              <Field label="Sort position">
                <Input
                  type="number"
                  value={String(form.position)}
                  onChange={(e) => set("position", Number(e.target.value) as any)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cover image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Cover image URL">
                <MediaPicker value={form.coverImageUrl} onChange={(value) => set("coverImageUrl", value)} />
              </Field>
              <Field label="Mobile cover URL (optional)">
                <MediaPicker value={form.mobileCoverUrl} onChange={(value) => set("mobileCoverUrl", value)} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search products..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No products found.</p>
                ) : (
                  filteredProducts.map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={form.relatedProductIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4"
                      />
                      <span className="truncate">{p.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.relatedProductIds.length} product
                {form.relatedProductIds.length === 1 ? "" : "s"} linked.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`h-7 w-7 p-0 ${destructive ? "text-destructive hover:text-destructive" : ""}`}
    >
      {children}
    </Button>
  )
}

function BlockFields({
  block,
  products,
  onChange,
}: {
  block: EditorBlock
  products: ProductOption[]
  onChange: (data: Record<string, any>) => void
}) {
  switch (block.type) {
    case "heading":
      return (
        <div className="flex gap-2">
          <Select value={String(block.data.level ?? 2)} onValueChange={(v) => onChange({ level: Number(v) })}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
            </SelectContent>
          </Select>
          <Input value={block.data.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} placeholder="Heading text" />
        </div>
      )
    case "paragraph":
      return (
        <Textarea value={block.data.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} rows={4} placeholder="Write a paragraph..." />
      )
    case "quote":
      return (
        <div className="space-y-2">
          <Textarea value={block.data.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} rows={2} placeholder="Quote text" />
          <Input value={block.data.attribution ?? ""} onChange={(e) => onChange({ attribution: e.target.value })} placeholder="Attribution (optional)" />
        </div>
      )
    case "image":
      return (
        <div className="space-y-2">
          <MediaPicker value={block.data.url ?? ""} onChange={(url) => onChange({ url })} />
          <Input value={block.data.alt ?? ""} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Alt text (accessibility)" />
          <Input value={block.data.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} placeholder="Caption (optional)" />
        </div>
      )
    case "product":
      return (
        <Select value={block.data.productSlug ?? ""} onValueChange={(v) => onChange({ productSlug: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.slug}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case "button":
      return (
        <div className="space-y-2">
          <Input value={block.data.label ?? ""} onChange={(e) => onChange({ label: e.target.value })} placeholder="Button label" />
          <Input value={block.data.href ?? ""} onChange={(e) => onChange({ href: e.target.value })} placeholder="/shop or https://..." />
        </div>
      )
    case "divider":
      return <p className="text-xs text-muted-foreground">A horizontal divider.</p>
    default:
      return null
  }
}
