"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "No admin access" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "CONTENT_MANAGER", label: "Content Manager" },
  { value: "PRODUCT_MANAGER", label: "Product Manager" },
  { value: "ORDER_MANAGER", label: "Order Manager" },
  { value: "MARKETING_MANAGER", label: "Marketing Manager" },
  { value: "ANALYST", label: "Analyst / Viewer" },
]

export function UserRoleSelect({
  userId,
  current,
  self,
}: {
  userId: string
  current: string // "none" | AdminRole
  self: boolean
}) {
  const router = useRouter()
  const [value, setValue] = React.useState(current)
  const [saving, setSaving] = React.useState(false)

  async function change(next: string) {
    const prev = value
    setValue(next)
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("Role updated")
        router.refresh()
      } else {
        setValue(prev)
        toast.error(data.error || "Failed to update role")
      }
    } catch {
      setValue(prev)
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={value} onValueChange={change} disabled={saving || self}>
      <SelectTrigger className="h-8 w-48 text-xs" title={self ? "You cannot change your own role" : undefined}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
