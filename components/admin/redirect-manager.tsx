"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Item = { id: string; source: string; destination: string; permanent: boolean; active: boolean }
export function RedirectManager({ redirects }: { redirects: Item[] }) {
  const router = useRouter(); const [source, setSource] = React.useState(""); const [destination, setDestination] = React.useState("")
  async function save() { const response = await fetch("/api/admin/redirects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, destination, permanent: true, active: true }) }); const data = await response.json().catch(() => ({})); if (!response.ok) return toast.error(data.error || "Save failed"); setSource(""); setDestination(""); toast.success("Redirect saved"); router.refresh() }
  async function remove(id: string) { if (!window.confirm("Delete this redirect?")) return; await fetch(`/api/admin/redirects/${id}`, { method: "DELETE" }); router.refresh() }
  return <div className="space-y-6"><Card><CardContent className="grid gap-3 pt-6 sm:grid-cols-[1fr_1fr_auto]"><Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="/old-path" /><Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="/new-path" /><Button onClick={save}>Save redirect</Button></CardContent></Card><Card><CardContent className="divide-y p-0">{redirects.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No redirects yet.</p> : redirects.map((item) => <div key={item.id} className="flex items-center gap-3 px-6 py-4"><code className="min-w-0 flex-1 truncate">{item.source}</code><span>→</span><code className="min-w-0 flex-1 truncate">{item.destination}</code><Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card></div>
}
