"use client"

import * as React from "react"
import { ImageIcon, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type Asset = { id: string; url: string; alt: string | null; filename: string | null }

export function MediaPicker({ value, onChange, placeholder, className }: { value: string; onChange: (url: string) => void; placeholder?: string; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/media?kind=image&search=${encodeURIComponent(search)}`, { signal: controller.signal })
        const data = await response.json()
        setAssets(response.ok ? data.assets ?? [] : [])
      } catch { if (!controller.signal.aborted) setAssets([]) } finally { if (!controller.signal.aborted) setLoading(false) }
    }, 150)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [open, search])

  return <div className={`flex gap-2 ${className ?? ""}`}>
    <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder ?? "/images/... or https://..."} />
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button type="button" variant="outline" aria-label="Choose from media library"><ImageIcon className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>Choose media</DialogTitle></DialogHeader>
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search filename, alt text, or URL" /></div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : assets.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No matching images. Register or upload one in Media first.</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{assets.map((asset) => <button key={asset.id} type="button" className="overflow-hidden rounded-lg border text-left transition hover:border-primary" onClick={() => { onChange(asset.url); setOpen(false) }}><img src={asset.url} alt={asset.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" /><span className="block truncate p-2 text-xs">{asset.alt || asset.filename || asset.url}</span></button>)}</div>}
      </DialogContent>
    </Dialog>
  </div>
}
