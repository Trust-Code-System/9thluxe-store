'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2, AlertCircle } from 'lucide-react'

interface NewsletterFormProps {
  subscriberCount: number
  defaultValues?: { subject?: string; html?: string; text?: string }
}

export function NewsletterForm({ subscriberCount, defaultValues }: NewsletterFormProps) {
  const [subject, setSubject] = useState(defaultValues?.subject || '')
  const [htmlContent, setHtmlContent] = useState(defaultValues?.html || '')
  const [textContent, setTextContent] = useState(defaultValues?.text || '')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

  useEffect(() => {
    if (defaultValues) {
      setSubject(defaultValues.subject || '')
      setHtmlContent(defaultValues.html || '')
      setTextContent(defaultValues.text || '')
    }
  }, [defaultValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setResult(null)

    if (!subject.trim() || !htmlContent.trim()) {
      setError('Subject and HTML content are required.')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, html: htmlContent, text: textContent }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(true)
        setResult(data)
        setSubject('')
        setHtmlContent('')
        setTextContent('')
      } else {
        setError(data.error || 'Failed to send newsletter.')
      }
    } catch (err) {
      console.error('Error sending newsletter:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Send New Campaign</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>To:</span>
          <span className="font-medium text-foreground">{subscriberCount} subscriber{subscriberCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-medium text-foreground">
            Subject *
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input w-full"
            placeholder="Enter newsletter subject"
            disabled={isSending}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="htmlContent" className="text-sm font-medium text-foreground">
            HTML Content *
          </label>
          <textarea
            id="htmlContent"
            name="htmlContent"
            required
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={10}
            className="input w-full font-mono text-sm"
            placeholder="Enter HTML content for your newsletter"
            disabled={isSending}
          />
          <p className="text-xs text-muted-foreground">
            You can use HTML for rich formatting.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="textContent" className="text-sm font-medium text-foreground">
            Plain Text Content (Optional)
          </label>
          <textarea
            id="textContent"
            name="textContent"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={5}
            className="input w-full font-mono text-sm"
            placeholder="Enter plain text content (optional)"
            disabled={isSending}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && result && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
            <Send className="h-4 w-4" />
            <span>Newsletter sent successfully! {result.sent} sent, {result.failed} failed</span>
          </div>
        )}

        <button
          type="submit"
          className="btn inline-flex items-center gap-2"
          disabled={isSending || subscriberCount === 0}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Newsletter
            </>
          )}
        </button>
        {subscriberCount === 0 && (
          <p className="text-sm text-orange-600">No subscribers to send to. Encourage users to sign up!</p>
        )}
      </form>
    </div>
  )
}
