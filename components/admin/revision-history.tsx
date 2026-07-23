"use client"

import * as React from "react"
import { History, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Revision = { id: string; version: number; createdAt: string; createdBy: string | null }

export function RevisionHistory({ entityType, entityId }: { entityType: "Story" | "Page"; entityId?: string }) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [revisions, setRevisions] = React.useState<Revision[]>([])
  React.useEffect(() => { if (!open || !entityId) return; setLoading(true); fetch(`/api/admin/revisions?entityType=${entityType}&entityId=${entityId}`).then((response) => response.json()).then((data) => setRevisions(data.revisions ?? [])).finally(() => setLoading(false)) }, [open, entityId, entityType])
  if (!entityId) return null
  async function restore(id: string) {
    if (!window.confirm("Restore this revision? The current version will be saved first.")) return
    const response = await fetch(`/api/admin/revisions/${id}/restore`, { method: "POST" })
    if (response.ok) { toast.success("Revision restored"); window.location.reload() } else toast.error((await response.json().catch(() => ({}))).error || "Restore failed")
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="sm"><History className="mr-2 h-4 w-4" />History</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Version history</DialogTitle></DialogHeader>{loading ? <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin" /> : revisions.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No earlier versions yet.</p> : <div className="divide-y">{revisions.map((revision) => <div key={revision.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-medium">Version {revision.version}</p><p className="text-xs text-muted-foreground">{new Date(revision.createdAt).toLocaleString("en-NG")}</p></div><Button size="sm" variant="outline" onClick={() => restore(revision.id)}>Restore</Button></div>)}</div>}</DialogContent></Dialog>
}
