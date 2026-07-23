"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Status = "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM"
type Submission = { id: string; source: string; name: string | null; email: string; subject: string | null; message: string; status: Status; notes: string | null; createdAt: string | Date }
const LABELS: Record<Status, string> = { NEW: "New", IN_PROGRESS: "In progress", RESOLVED: "Resolved", SPAM: "Spam" }

function EnquiryCard({ item }: { item: Submission }) {
  const router = useRouter()
  const [status, setStatus] = React.useState(item.status)
  const [notes, setNotes] = React.useState(item.notes ?? "")
  const [saving, setSaving] = React.useState(false)
  async function save() {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/enquiries/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, notes }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to update enquiry")
      toast.success("Enquiry updated")
      router.refresh()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Failed to update enquiry") } finally { setSaving(false) }
  }
  return <Card><CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="text-base">{item.subject || "No subject"}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{item.name || "Unknown"} · <a className="hover:text-foreground" href={`mailto:${item.email}`}>{item.email}</a> · {new Date(item.createdAt).toLocaleString("en-NG")}</p></div><Badge variant={item.status === "NEW" ? "default" : "secondary"}>{LABELS[item.status]}</Badge></div></CardHeader><CardContent className="space-y-4"><p className="whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm leading-relaxed">{item.message}</p><div className="grid gap-4 md:grid-cols-[12rem_1fr_auto]"><div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={(value) => setStatus(value as Status)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Internal notes</Label><Textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Not visible to the customer" /></div><Button className="self-end" onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save</Button></div></CardContent></Card>
}

export function EnquiriesInbox({ submissions, counts, query, status }: { submissions: Submission[]; counts: Partial<Record<Status, number>>; query: string; status: string }) {
  return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-serif text-2xl font-semibold">Enquiries</h1><p className="text-muted-foreground">Contact-form messages, triage state, and private support notes.</p></div><Button asChild variant="outline"><a href={`/admin/enquiries/export?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`}><Download className="mr-2 h-4 w-4" />Export CSV</a></Button></div><Card><CardContent className="pt-6"><form className="flex flex-wrap gap-3"><Input className="min-w-64 flex-1" name="q" defaultValue={query} placeholder="Search name, email, subject, or message" /><Select name="status" defaultValue={status || "ALL"}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem>{Object.entries(LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label} ({counts[value as Status] ?? 0})</SelectItem>)}</SelectContent></Select><Button type="submit">Filter</Button></form></CardContent></Card>{submissions.length ? submissions.map((item) => <EnquiryCard key={item.id} item={item} />) : <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No enquiries match this view.</CardContent></Card>}</div>
}
