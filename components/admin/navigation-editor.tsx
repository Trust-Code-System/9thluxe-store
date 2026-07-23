"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NavItem {
  id?: string
  label: string
  href: string
  newTab: boolean
  visible: boolean
}

type Menus = Record<string, NavItem[]>

export function NavigationEditor({
  locations,
  initialMenus,
}: {
  locations: { location: string; label: string }[]
  initialMenus: Menus
}) {
  const router = useRouter()
  const [menus, setMenus] = React.useState<Menus>(() => {
    const seeded: Menus = {}
    for (const { location } of locations) seeded[location] = initialMenus[location] ?? []
    return seeded
  })
  const [savingLoc, setSavingLoc] = React.useState<string | null>(null)
  const [dirty, setDirty] = React.useState<Record<string, boolean>>({})

  const update = (loc: string, next: NavItem[]) => {
    setMenus((prev) => ({ ...prev, [loc]: next }))
    setDirty((prev) => ({ ...prev, [loc]: true }))
  }

  const addItem = (loc: string) =>
    update(loc, [...menus[loc], { label: "", href: "/", newTab: false, visible: true }])
  const removeItem = (loc: string, i: number) =>
    update(loc, menus[loc].filter((_, idx) => idx !== i))
  const editItem = (loc: string, i: number, patch: Partial<NavItem>) =>
    update(loc, menus[loc].map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const move = (loc: string, i: number, dir: -1 | 1) => {
    const items = [...menus[loc]]
    const j = i + dir
    if (j < 0 || j >= items.length) return
    ;[items[i], items[j]] = [items[j], items[i]]
    update(loc, items)
  }

  async function saveMenu(loc: string) {
    setSavingLoc(loc)
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, items: menus[loc] }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        if (data.menus) {
          setMenus((prev) => ({ ...prev, [loc]: data.menus[loc] ?? [] }))
        }
        setDirty((prev) => ({ ...prev, [loc]: false }))
        toast.success("Menu saved")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to save menu")
      }
    } catch {
      toast.error("Network error while saving")
    } finally {
      setSavingLoc(null)
    }
  }

  return (
    <div className="space-y-6">
      {locations.map(({ location, label }) => {
        const items = menus[location] ?? []
        return (
          <Card key={location}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{label}</CardTitle>
              <Button
                size="sm"
                onClick={() => saveMenu(location)}
                disabled={savingLoc === location || !dirty[location]}
              >
                {savingLoc === location ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No custom items yet: using the built-in default for this menu. Add an item to
                  override it.
                </p>
              )}
              {items.map((item, i) => (
                <div key={item.id ?? i} className="flex flex-wrap items-center gap-2">
                  <Input
                    className="min-w-32 flex-1"
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) => editItem(location, i, { label: e.target.value })}
                  />
                  <Input
                    className="min-w-40 flex-[2]"
                    placeholder="/shop or https://..."
                    value={item.href}
                    onChange={(e) => editItem(location, i, { href: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant={item.newTab ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => editItem(location, i, { newTab: !item.newTab })}
                    title="Open in new tab"
                  >
                    New tab
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => editItem(location, i, { visible: !item.visible })}
                    title={item.visible ? "Visible" : "Hidden"}
                    aria-label={item.visible ? "Hide item" : "Show item"}
                  >
                    {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => move(location, i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => move(location, i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => removeItem(location, i)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem(location)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add item
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
