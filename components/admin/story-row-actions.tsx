"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Trash2, RotateCcw, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

interface Props {
  storyId: string
  slug: string
  status: string
  deleted: boolean
}

export function StoryRowActions({ storyId, slug, status, deleted }: Props) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [confirmTrash, setConfirmTrash] = React.useState(false)

  const trash = async () => {
    setPending(true)
    try {
      const res = await fetch(`/api/admin/stories/${storyId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("Moved to trash")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to trash story")
      }
    } finally {
      setPending(false)
      setConfirmTrash(false)
    }
  }

  const restore = async () => {
    setPending(true)
    try {
      const res = await fetch(`/api/admin/stories/${storyId}/restore`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("Restored as draft")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to restore story")
      }
    } finally {
      setPending(false)
    }
  }

  if (deleted) {
    return (
      <Button variant="ghost" size="sm" onClick={restore} disabled={pending} className="gap-2">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        Restore
      </Button>
    )
  }

  return (
    <>
      {status === "PUBLISHED" && (
        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
          <a href={`/journal/${slug}`} target="_blank" rel="noreferrer" aria-label="View live">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmTrash(true)}
        disabled={pending}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        aria-label="Move to trash"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={confirmTrash} onOpenChange={setConfirmTrash}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move story to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This unpublishes the story and removes it from the public journal. You can restore it
              from the Trash section afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={trash}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
