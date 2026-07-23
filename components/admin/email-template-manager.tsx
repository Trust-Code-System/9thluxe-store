"use client"
import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
type Def = { key: string; name: string; variables: readonly string[] }; type Template = { key: string; subject: string; bodyText: string; enabled: boolean }
function Editor({ def, saved }: { def: Def; saved?: Template }) { const [subject, setSubject] = React.useState(saved?.subject ?? ""); const [bodyText, setBody] = React.useState(saved?.bodyText ?? ""); const [enabled, setEnabled] = React.useState(saved?.enabled ?? false); async function save() { const response = await fetch("/api/admin/email-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: def.key, subject, bodyText, enabled }) }); if (response.ok) toast.success("Template saved"); else toast.error((await response.json().catch(() => ({}))).error || "Save failed") } return <Card><CardHeader><CardTitle>{def.name}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-xs text-muted-foreground">Variables: {def.variables.map((v) => `{{${v}}}`).join(", ")}</p><div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div><div><Label>Plain-text body</Label><Textarea rows={6} value={bodyText} onChange={(e) => setBody(e.target.value)} /></div><label className="flex gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable override</label><Button onClick={save}>Save template</Button></CardContent></Card> }
export function EmailTemplateManager({ catalogue, templates }: { catalogue: Def[]; templates: Template[] }) { return <div className="grid gap-6 lg:grid-cols-2">{catalogue.map((def) => <Editor key={def.key} def={def} saved={templates.find((item) => item.key === def.key)} />)}</div> }
