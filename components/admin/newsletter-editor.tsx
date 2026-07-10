"use client"

import * as React from "react"
import { Send, Save, Eye, Loader2, AlertCircle, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

interface NewsletterEditorProps {
  subscriberCount: number
  campaignId?: string
  initialData?: {
    subject?: string
    html?: string
    text?: string
  }
  onSave?: () => void
}

export function NewsletterEditor({ subscriberCount, campaignId, initialData, onSave }: NewsletterEditorProps) {
  const [subject, setSubject] = React.useState(initialData?.subject || "")
  const [htmlContent, setHtmlContent] = React.useState(initialData?.html || "")
  const [textContent, setTextContent] = React.useState(initialData?.text || "")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("compose")
  const [uploadedImages, setUploadedImages] = React.useState<string[]>([])

  React.useEffect(() => {
    if (initialData) {
      setSubject(initialData.subject || "")
      setHtmlContent(initialData.html || "")
      setTextContent(initialData.text || "")
    }
  }, [initialData])

  const handleSaveDraft = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      toast.error("Subject and HTML content are required")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/newsletter/campaigns", {
        method: campaignId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: campaignId,
          subject,
          html: htmlContent,
          text: textContent,
          status: "DRAFT",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Draft saved successfully")
        if (onSave) onSave()
      } else {
        toast.error(data.error || "Failed to save draft")
      }
    } catch (error) {
      console.error("Save draft error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      toast.error("Subject and HTML content are required")
      return
    }

    if (subscriberCount === 0) {
      toast.error("No subscribers to send to")
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html: htmlContent, text: textContent }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const failed = data.failed ?? 0
        const sent = data.sent ?? 0
        if (failed > 0 && data.failures?.length) {
          toast.warning(
            `Sent to ${sent}; ${failed} failed`,
            { description: data.failures.slice(0, 3).join(" — ") }
          )
        } else {
          toast.success(`Newsletter sent to ${sent} subscriber${sent !== 1 ? "s" : ""}`)
        }
        if (data.hint) {
          toast.info("Delivery tip", { description: data.hint })
        }
        setSubject("")
        setHtmlContent("")
        setTextContent("")
        if (onSave) onSave()
      } else {
        toast.error(data.error || "Failed to send newsletter", {
          description: data.details ? String(data.details) : undefined,
        })
      }
    } catch (error) {
      console.error("Send newsletter error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Convert to base64 for embedding
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const imgTag = `<img src="${base64}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`
      setHtmlContent((prev) => prev + "\n" + imgTag)
      setUploadedImages((prev) => [...prev, base64])
      toast.success("Image added to content")
    }
    reader.readAsDataURL(file)
  }

  const insertTemplate = (template: string) => {
    setHtmlContent((prev) => prev + "\n" + template)
    toast.success("Template inserted")
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : ""

  const templates = {
    header: `<div style="text-align: center; padding: 20px; background: #f8f9fa;">
  <h1 style="color: #2f3e33; font-family: serif;">Fádé Essence</h1>
</div>`,
    product: `<div style="border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px;">
  <h3 style="color: #2f3e33;">Product Name</h3>
  <p>Product description goes here.</p>
  <a href="${siteUrl}/shop" style="display: inline-block; padding: 10px 20px; background: #2f3e33; color: white; text-decoration: none; border-radius: 4px;">Shop Now</a>
</div>`,
    footer: `<div style="text-align: center; padding: 20px; background: #f8f9fa; margin-top: 40px;">
  <p style="color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Fádé Essence. All rights reserved.</p>
  <p style="color: #6b7280; font-size: 12px;">
    <a href="{{unsubscribe}}" style="color: #6b7280;">Unsubscribe</a>
  </p>
</div>`,
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Create Newsletter Campaign</h3>
              <p className="text-sm text-muted-foreground mt-1">
                To: {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isSending}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || isSaving || subscriberCount === 0}
                className="gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter newsletter subject"
              disabled={isSaving || isSending}
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4 mt-4">
              {/* Image Upload */}
              <div className="flex items-center gap-4">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="gap-2" asChild>
                    <span>
                      <ImageIcon className="h-4 w-4" />
                      Upload Image
                    </span>
                  </Button>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isSaving || isSending}
                />
                <p className="text-xs text-muted-foreground">
                  Images will be embedded as base64 in the email
                </p>
              </div>

              {/* HTML Content */}
              <div className="space-y-2">
                <Label htmlFor="htmlContent">HTML Content *</Label>
                <Textarea
                  id="htmlContent"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Enter HTML content for your newsletter..."
                  disabled={isSaving || isSending}
                />
                <p className="text-xs text-muted-foreground">
                  Use HTML for rich formatting. You can use {"{{name}}"} to personalize with subscriber names.
                </p>
              </div>

              {/* Plain Text Content */}
              <div className="space-y-2">
                <Label htmlFor="textContent">Plain Text Content (Optional)</Label>
                <Textarea
                  id="textContent"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Enter plain text version (optional)..."
                  disabled={isSaving || isSending}
                />
                <p className="text-xs text-muted-foreground">
                  Plain text version for email clients that don't support HTML
                </p>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-lg p-6 bg-white">
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-muted-foreground">Subject:</p>
                  <p className="font-semibold">{subject || "No subject"}</p>
                </div>
                <div
                  dangerouslySetInnerHTML={{ __html: htmlContent || "<p>No content yet</p>" }}
                  className="prose max-w-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => insertTemplate(templates.header)}>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Header</h4>
                    <p className="text-xs text-muted-foreground">Branded header with logo</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => insertTemplate(templates.product)}>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Product Card</h4>
                    <p className="text-xs text-muted-foreground">Product showcase template</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => insertTemplate(templates.footer)}>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-2">Footer</h4>
                    <p className="text-xs text-muted-foreground">Email footer with unsubscribe</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {subscriberCount === 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>No subscribers to send to. Encourage users to sign up!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

