"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { MediaPicker } from "@/components/admin/media-picker"
import { RevisionHistory } from "@/components/admin/revision-history"

type BlockType = "heading" | "paragraph" | "quote" | "image" | "divider" | "button"
type EditorBlock = { type: BlockType; data: Record<string, string | number> }

export interface PageEditorInitial {
  id?: string
  updatedAt?: string
  slug: string
  title: string
  eyebrow: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  scheduledFor: string
  unpublishAt: string
  blocks: EditorBlock[]
}

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading", paragraph: "Paragraph", quote: "Quote", image: "Image", divider: "Divider", button: "Button",
}

function newBlock(type: BlockType): EditorBlock {
  if (type === "heading") return { type, data: { text: "", level: 2 } }
  if (type === "image") return { type, data: { url: "", alt: "", caption: "" } }
  if (type === "button") return { type, data: { label: "", href: "" } }
  if (type === "quote") return { type, data: { text: "", attribution: "" } }
  if (type === "divider") return { type, data: {} }
  return { type, data: { text: "" } }
}

function BlockFields({ block, onChange }: { block: EditorBlock; onChange: (data: EditorBlock["data"]) => void }) {
  const set = (key: string, value: string | number) => onChange({ ...block.data, [key]: value })
  if (block.type === "divider") return <p className="text-sm text-muted-foreground">A visual divider.</p>
  if (block.type === "image") return <div className="grid gap-3 sm:grid-cols-2"><MediaPicker className="sm:col-span-2" value={String(block.data.url ?? "")} onChange={(value) => set("url", value)} /><Input value={String(block.data.alt ?? "")} onChange={(e) => set("alt", e.target.value)} placeholder="Alt text" /><Input value={String(block.data.caption ?? "")} onChange={(e) => set("caption", e.target.value)} placeholder="Caption (optional)" /></div>
  if (block.type === "button") return <div className="grid gap-3 sm:grid-cols-2"><Input value={String(block.data.label ?? "")} onChange={(e) => set("label", e.target.value)} placeholder="Button label" /><Input value={String(block.data.href ?? "")} onChange={(e) => set("href", e.target.value)} placeholder="/safe-link" /></div>
  return <div className="space-y-3"><Textarea rows={block.type === "paragraph" ? 5 : 3} value={String(block.data.text ?? "")} onChange={(e) => set("text", e.target.value)} placeholder={BLOCK_LABELS[block.type]} />{block.type === "quote" && <Input value={String(block.data.attribution ?? "")} onChange={(e) => set("attribution", e.target.value)} placeholder="Attribution (optional)" />}{block.type === "heading" && <Select value={String(block.data.level ?? 2)} onValueChange={(value) => set("level", Number(value))}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2">Heading 2</SelectItem><SelectItem value="3">Heading 3</SelectItem></SelectContent></Select>}</div>
}

export function PageEditor({ initial, mode }: { initial: PageEditorInitial; mode: "create" | "edit" }) {
  const router = useRouter()
  const [form, setForm] = React.useState(initial)
  const [saving, setSaving] = React.useState(false)
  const [newType, setNewType] = React.useState<BlockType>("paragraph")
  const set = <K extends keyof PageEditorInitial>(key: K, value: PageEditorInitial[K]) => setForm((old) => ({ ...old, [key]: value }))
  const changeBlock = (index: number, data: EditorBlock["data"]) => set("blocks", form.blocks.map((block, i) => i === index ? { ...block, data } : block))
  const move = (index: number, offset: number) => {
    const next = [...form.blocks]
    const target = index + offset
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    set("blocks", next)
  }
  async function save(status: PageEditorInitial["status"]) {
    if (!form.title.trim() || !form.slug.trim()) return toast.error("Title and route are required")
    setSaving(true)
    try {
      const response = await fetch(mode === "create" ? "/api/admin/pages" : `/api/admin/pages/${form.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status, expectedUpdatedAt: form.updatedAt, scheduledFor: form.scheduledFor || null, unpublishAt: form.unpublishAt || null, blocks: form.blocks.map((block, position) => ({ ...block, position })) }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to save page")
      toast.success(mode === "create" ? "Page created" : "Page saved")
      if (mode === "create") router.push(`/admin/pages/${data.page.id}/edit`)
      else { setForm((old) => ({ ...old, status: data.page.status, updatedAt: data.page.updatedAt })); router.refresh() }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to save page") } finally { setSaving(false) }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="font-serif text-2xl font-semibold">{mode === "create" ? "New page" : "Edit page"}</h1><p className="text-muted-foreground">Public route: /{form.slug || "..."}</p></div><div className="flex gap-2"><RevisionHistory entityType="Page" entityId={form.id} /><Button variant="outline" onClick={() => save("DRAFT")} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save draft</Button><Button onClick={() => save("PUBLISHED")} disabled={saving}>{form.scheduledFor && new Date(form.scheduledFor) > new Date() ? "Schedule" : "Publish"}</Button></div></div>
    <Card><CardHeader><CardTitle className="text-base">Page details</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} /></div><div className="space-y-2"><Label htmlFor="slug">Route</Label><Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="help/shipping" /></div><div className="space-y-2"><Label htmlFor="eyebrow">Eyebrow</Label><Input id="eyebrow" value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="excerpt">Introduction</Label><Textarea id="excerpt" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Content blocks</CardTitle></CardHeader><CardContent className="space-y-4">{form.blocks.map((block, index) => <div key={index} className="rounded-lg border p-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-medium">{index + 1}. {BLOCK_LABELS[block.type]}</span><div><Button variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => move(index, 1)} disabled={index === form.blocks.length - 1}><ArrowDown className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => set("blocks", form.blocks.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div></div><BlockFields block={block} onChange={(data) => changeBlock(index, data)} /></div>)}<div className="flex gap-2"><Select value={newType} onValueChange={(value) => setNewType(value as BlockType)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(BLOCK_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => set("blocks", [...form.blocks, newBlock(newType)])}><Plus className="mr-2 h-4 w-4" />Add block</Button></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">SEO and publishing</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>SEO title</Label><Input value={form.seoTitle} maxLength={70} onChange={(e) => set("seoTitle", e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label>SEO description</Label><Textarea value={form.seoDescription} maxLength={180} onChange={(e) => set("seoDescription", e.target.value)} /></div><div className="space-y-2"><Label>Publish at (optional)</Label><Input type="datetime-local" value={form.scheduledFor} onChange={(e) => set("scheduledFor", e.target.value)} /></div><div className="space-y-2"><Label>Unpublish at (optional)</Label><Input type="datetime-local" value={form.unpublishAt} onChange={(e) => set("unpublishAt", e.target.value)} /></div></CardContent></Card>
  </div>
}
