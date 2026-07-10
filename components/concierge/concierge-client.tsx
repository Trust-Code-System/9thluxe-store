"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, Send, RotateCcw, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Product shape returned by the recommendation engine (subset the UI needs). */
interface ConciergeProduct {
  id: string
  slug: string
  name: string
  brand: string | null
  price: { amountNGN: number }
  images: string[]
}

interface ConciergeItem {
  product: ConciergeProduct
  reasons: string[]
  availability: "in_stock" | "preorder" | "waitlist"
}

interface AssistantTurn {
  role: "assistant"
  text: string
  items: ConciergeItem[]
  disclaimer?: string
}
interface UserTurn {
  role: "user"
  text: string
}
type Turn = UserTurn | AssistantTurn

const SUGGESTED_PROMPTS = [
  "A warm oud for Lagos evenings",
  "Something clean and fresh for the office",
  "Vanilla, but not too sweet",
  "A romantic scent for a wedding under ₦200,000",
]

const AVAILABILITY_LABEL: Record<ConciergeItem["availability"], string> = {
  in_stock: "In stock",
  preorder: "Pre-order",
  waitlist: "Waitlist",
}

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ConciergeClient() {
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [input, setInput] = React.useState("")
  const [sampleFirst, setSampleFirst] = React.useState(false)
  const [status, setStatus] = React.useState<"idle" | "loading" | "error" | "unavailable">("idle")
  const [lastQuery, setLastQuery] = React.useState<string>("")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [turns, status])

  const ask = React.useCallback(
    async (message: string) => {
      const trimmed = message.trim()
      if (!trimmed || status === "loading") return

      setTurns((prev) => [...prev, { role: "user", text: trimmed }])
      setInput("")
      setLastQuery(trimmed)
      setStatus("loading")

      try {
        const res = await fetch("/api/v1/concierge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, sampleFirst, limit: 6 }),
        })
        const json = await res.json()

        if (!res.ok || json?.error) {
          const code = json?.error?.code
          if (code === "FEATURE_DISABLED") {
            setStatus("unavailable")
            return
          }
          setStatus("error")
          return
        }

        const data = json.data
        setTurns((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.message ?? "Here are some matches.",
            items: (data.items ?? []) as ConciergeItem[],
            disclaimer: data.disclaimer,
          },
        ])
        setStatus("idle")
      } catch {
        setStatus("error")
      }
    },
    [sampleFirst, status],
  )

  const isEmpty = turns.length === 0

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col">
      {/* Conversation */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto pb-6"
        aria-live="polite"
        aria-busy={status === "loading"}
      >
        {isEmpty && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/12 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-serif text-2xl font-medium">How can I help you find a scent?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tell me the mood, the occasion, notes you love or want to avoid, and your budget.
              I only recommend fragrances that are really in our catalogue.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => ask(p)}
                  className="rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={i} className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
                  <Sparkles className="h-4 w-4" />
                </span>
                <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-card px-4 py-2.5 text-sm leading-relaxed text-foreground">
                  {turn.text}
                </p>
              </div>

              {turn.items.length > 0 && (
                <div className="grid gap-3 pl-11 sm:grid-cols-2">
                  {turn.items.map((item) => (
                    <ConciergeCard key={item.product.id} item={item} />
                  ))}
                </div>
              )}

              {turn.disclaimer && (
                <p className="pl-11 text-xs italic text-muted-foreground">{turn.disclaimer}</p>
              )}
            </div>
          ),
        )}

        {status === "loading" && (
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/12 text-accent">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </span>
            <div className="flex items-center gap-1 rounded-2xl bg-card px-4 py-3">
              <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
            </div>
          </div>
        )}

        {status === "error" && (
          <StatusCard
            title="The concierge hit a snag"
            body="Something went wrong reaching the recommendation service. Please try again."
            action={
              <Button size="sm" variant="outline" onClick={() => ask(lastQuery)} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Retry
              </Button>
            }
          />
        )}

        {status === "unavailable" && (
          <StatusCard
            title="The concierge is resting"
            body="Our AI concierge is temporarily unavailable. You can still browse the full collection while it’s away."
            action={
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link href="/shop">
                  Browse perfumes <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
        className="sticky bottom-0 border-t border-border bg-background/95 pt-4 backdrop-blur"
      >
        <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={sampleFirst}
            onChange={(e) => setSampleFirst(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-accent"
          />
          Prefer sample-first suggestions
        </label>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                ask(input)
              }
            }}
            rows={1}
            placeholder="Describe the scent you’re looking for…"
            className="max-h-40 flex-1 resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl"
            disabled={status === "loading" || !input.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" />
          AI concierge · grounded in the Fàdè catalogue. Not medical or allergy advice.
        </p>
      </form>
    </div>
  )
}

function ConciergeCard({ item }: { item: ConciergeItem }) {
  const { product } = item
  const image = product.images?.[0] || "/placeholder.svg"
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-accent/40 hover:shadow-[0_14px_30px_-22px_rgba(33,24,19,0.5)]"
    >
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
        <Image src={image} alt={product.name} fill className="object-cover" sizes="64px" />
      </div>
      <div className="min-w-0 flex-1">
        {product.brand && (
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
            {product.brand}
          </p>
        )}
        <p className="truncate font-serif text-sm font-medium text-foreground">{product.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{formatNGN(product.price.amountNGN)}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              item.availability === "in_stock"
                ? "bg-moss/15 text-moss"
                : "bg-accent/15 text-accent",
            )}
          >
            {AVAILABILITY_LABEL[item.availability]}
          </span>
        </div>
        {item.reasons?.[0] && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.reasons[0]}</p>
        )}
      </div>
    </Link>
  )
}

function StatusCard({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="font-serif text-lg text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-4 flex justify-center">{action}</div>
    </div>
  )
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  )
}
