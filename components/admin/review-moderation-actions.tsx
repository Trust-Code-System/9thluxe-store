"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type Decision = "approve" | "reject"

interface Props {
  reviewId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
}

export function ReviewModerationActions({ reviewId, status }: Props) {
  const router = useRouter()
  const [pending, setPending] = React.useState<Decision | null>(null)

  const moderate = async (decision: Decision) => {
    setPending(decision)
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(decision === "approve" ? "Review approved" : "Review rejected")
        router.refresh()
      } else {
        toast.error(body?.error?.message || "Could not moderate this review")
      }
    } catch {
      toast.error("Network error while moderating")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex justify-end gap-2">
      {status !== "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-success/40 text-success hover:bg-success/10 hover:text-success"
          disabled={pending !== null}
          onClick={() => moderate("approve")}
        >
          {pending === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={pending !== null}
          onClick={() => moderate("reject")}
        >
          {pending === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Reject
        </Button>
      )}
    </div>
  )
}
