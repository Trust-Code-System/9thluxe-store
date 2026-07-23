"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArchiveRestore, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function PageRowActions({ id, deleted }: { id: string; deleted: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function act() {
    if (!deleted && !window.confirm("Move this page to trash? Its built-in fallback will become visible.")) return
    setBusy(true)
    try {
      const response = await fetch(`/api/admin/pages/${id}${deleted ? "/restore" : ""}`, { method: deleted ? "POST" : "DELETE" })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Request failed")
      toast.success(deleted ? "Page restored as draft" : "Page moved to trash")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed")
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant="ghost" size="icon" disabled={busy} onClick={act} aria-label={deleted ? "Restore page" : "Trash page"}>
      {deleted ? <ArchiveRestore className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
