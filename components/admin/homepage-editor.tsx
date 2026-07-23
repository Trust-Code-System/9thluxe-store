"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Field {
  key: string
  label: string
  type: "text" | "textarea" | "url"
  placeholder: string
}
interface SectionDef {
  type: string
  label: string
  description: string
  fields: Field[]
}
interface SectionView {
  type: string
  label: string
  visible: boolean
  position: number
  config: Record<string, string>
}

export function HomepageEditor({
  initialSections,
  catalogue,
}: {
  initialSections: SectionView[]
  catalogue: SectionDef[]
}) {
  const router = useRouter()
  const defByType = React.useMemo(
    () => Object.fromEntries(catalogue.map((c) => [c.type, c])),
    [catalogue]
  )
  const [sections, setSections] = React.useState<SectionView[]>(initialSections)
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

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

  const mutate = (next: SectionView[]) => {
    setSections(next.map((s, i) => ({ ...s, position: i })))
    setDirty(true)
  }
  const move = (i: number, dir: -1 | 1) => {
    const next = [...sections]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    mutate(next)
  }
  const toggleVisible = (i: number) =>
    mutate(sections.map((s, idx) => (idx === i ? { ...s, visible: !s.visible } : s)))
  const setField = (i: number, key: string, value: string) =>
    mutate(
      sections.map((s, idx) =>
        idx === i ? { ...s, config: { ...s.config, [key]: value } } : s
      )
    )

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSections(data.sections ?? sections)
        setDirty(false)
        toast.success("Homepage saved")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to save homepage")
      }
    } catch {
      toast.error("Network error while saving")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View homepage
          </a>
        </Button>
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>

      {sections.map((section, i) => {
        const def = defByType[section.type]
        return (
          <Card key={section.type} className={section.visible ? "" : "opacity-70"}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="font-mono text-xs text-muted-foreground">{i + 1}.</span>
                  {def?.label ?? section.type}
                  {!section.visible && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Hidden
                    </span>
                  )}
                </CardTitle>
                {def?.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => toggleVisible(i)}
                  aria-label={section.visible ? "Hide section" : "Show section"}
                  title={section.visible ? "Visible" : "Hidden"}
                >
                  {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </CardHeader>
            {def && def.fields.length > 0 && (
              <CardContent className="space-y-4">
                {def.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`${section.type}-${field.key}`} className="text-xs font-medium text-muted-foreground">
                      {field.label}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={`${section.type}-${field.key}`}
                        value={section.config[field.key] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(e) => setField(i, field.key, e.target.value)}
                        rows={2}
                      />
                    ) : (
                      <Input
                        id={`${section.type}-${field.key}`}
                        value={section.config[field.key] ?? ""}
                        placeholder={field.placeholder}
                        onChange={(e) => setField(i, field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )
      })}

      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  )
}
