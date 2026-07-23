"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { SettingDef } from "@/lib/settings/schema"
import { MediaPicker } from "@/components/admin/media-picker"

type Values = Record<string, string | boolean>

export function SettingsForm({
  fields,
  initialValues,
}: {
  fields: SettingDef[]
  initialValues: Values
}) {
  const router = useRouter()
  const [values, setValues] = React.useState<Values>(initialValues)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const set = (key: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

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

  const groups = React.useMemo(() => {
    const map = new Map<string, SettingDef[]>()
    for (const f of fields) {
      const list = map.get(f.group) ?? []
      list.push(f)
      map.set(f.group, list)
    }
    return Array.from(map.entries())
  }, [fields])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setValues(data.values ?? values)
        setDirty(false)
        toast.success("Settings saved")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to save settings")
      }
    } catch {
      toast.error("Network error while saving")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>

      {groups.map(([group, defs]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base">{group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {defs.map((def) => (
              <div key={def.key} className="space-y-1.5">
                {def.type === "boolean" ? (
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{def.label}</span>
                    <Switch
                      checked={Boolean(values[def.key])}
                      onCheckedChange={(v) => set(def.key, v)}
                    />
                  </label>
                ) : (
                  <>
                    <Label htmlFor={def.key} className="text-xs font-medium text-muted-foreground">
                      {def.label}
                    </Label>
                    {def.type === "image" ? (
                      <MediaPicker
                        value={String(values[def.key] ?? "")}
                        onChange={(value) => set(def.key, value)}
                      />
                    ) : def.type === "textarea" ? (
                      <Textarea
                        id={def.key}
                        value={String(values[def.key] ?? "")}
                        onChange={(e) => set(def.key, e.target.value)}
                        rows={2}
                      />
                    ) : (
                      <Input
                        id={def.key}
                        type={def.type === "email" ? "email" : "text"}
                        value={String(values[def.key] ?? "")}
                        onChange={(e) => set(def.key, e.target.value)}
                      />
                    )}
                  </>
                )}
                {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  )
}
