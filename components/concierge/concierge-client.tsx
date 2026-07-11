"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUp, Bot, Check, Copy, History, Menu, MessageSquarePlus, RotateCcw, Search, Square, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ConciergeProductCard, ConciergeSource } from "@/lib/concierge/types"

interface Turn { id?: string; role: "user" | "assistant"; text: string; products?: ConciergeProductCard[]; sources?: ConciergeSource[]; status?: string; error?: { code: string; message: string } }
interface ConversationSummary { id: string; title: string | null; updatedAt: string; _count: { messages: number } }

const PROMPTS = ["What does bergamot smell like?", "What works for a rainy-season office?", "Compare oud and sandalwood.", "Which Fádé scents are currently available?"]
const money = (amount: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)

export function ConciergeClient() {
  const [turns, setTurns] = React.useState<Turn[]>([])
  const [conversations, setConversations] = React.useState<ConversationSummary[]>([])
  const [conversationId, setConversationId] = React.useState<string>()
  const [input, setInput] = React.useState("")
  const [sampleFirst, setSampleFirst] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [historyQuery, setHistoryQuery] = React.useState("")
  const [allowance, setAllowance] = React.useState<{ authenticated: boolean; remaining: number | null }>()
  const [copied, setCopied] = React.useState<string>()
  const abortRef = React.useRef<AbortController | null>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLTextAreaElement>(null)

  const loadSidebar = React.useCallback(async () => {
    const [historyRes, allowanceRes] = await Promise.all([fetch(`/api/v2/concierge/conversations${historyQuery ? `?q=${encodeURIComponent(historyQuery)}` : ""}`), fetch("/api/v2/concierge/allowance")])
    if (historyRes.ok) setConversations((await historyRes.json()).data?.conversations ?? [])
    if (allowanceRes.ok) setAllowance((await allowanceRes.json()).data)
  }, [historyQuery])

  React.useEffect(() => { void loadSidebar() }, [loadSidebar])
  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }) }, [turns, running])
  React.useEffect(() => { const el = textRef.current; if (el) { el.style.height = "0px"; el.style.height = `${Math.min(el.scrollHeight, 176)}px` } }, [input])
  React.useEffect(() => () => abortRef.current?.abort(), [])

  const newChat = () => { abortRef.current?.abort(); setConversationId(undefined); setTurns([]); setInput(""); setHistoryOpen(false) }

  const openConversation = async (id: string) => {
    if (running) return
    const response = await fetch(`/api/v2/concierge/conversations/${id}`)
    const json = await response.json()
    if (!response.ok || !json.data?.conversation) return
    const conversation = json.data.conversation
    setConversationId(id)
    setTurns((conversation.messages ?? []).map((message: any) => ({ id: message.id, role: message.role, text: message.content, sources: Array.isArray(message.sources) ? message.sources : [] })))
    setHistoryOpen(false)
  }

  const ask = React.useCallback(async (raw: string) => {
    const message = raw.trim()
    if (!message || running) return
    const controller = new AbortController(); abortRef.current = controller
    setInput(""); setRunning(true)
    setTurns((previous) => [...previous, { role: "user", text: message }, { role: "assistant", text: "", status: "Understanding your question" }])
    try {
      const response = await fetch("/api/v2/concierge/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, conversationId, sampleFirst }), signal: controller.signal })
      if (!response.ok || !response.body) {
        const json = await response.json().catch(() => null)
        throw Object.assign(new Error(json?.error?.message ?? "The concierge is unavailable."), { code: json?.error?.code ?? "SERVICE_UNAVAILABLE" })
      }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""
      while (true) {
        const { value, done } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n"); buffer = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line)
          setTurns((previous) => previous.map((turn, index) => index !== previous.length - 1 ? turn : event.type === "status" ? { ...turn, status: event.message }
            : event.type === "delta" ? { ...turn, text: turn.text + event.delta, status: undefined }
              : event.type === "products" ? { ...turn, products: event.products }
                : event.type === "sources" ? { ...turn, sources: event.sources }
                  : event.type === "done" ? { ...turn, id: event.result.messageId, status: undefined }
                    : event.type === "error" ? { ...turn, status: undefined, error: event.error }
                      : turn))
          if (event.type === "done") setConversationId(event.result.conversationId)
        }
      }
      await loadSidebar()
    } catch (error) {
      if ((error as Error).name !== "AbortError") setTurns((previous) => previous.map((turn, index) => index === previous.length - 1 ? { ...turn, status: undefined, error: { code: (error as any).code ?? "SERVICE_UNAVAILABLE", message: (error as Error).message } } : turn))
    } finally { setRunning(false); abortRef.current = null }
  }, [conversationId, loadSidebar, running, sampleFirst])

  const contextualTurn = [...turns].reverse().find((turn) => turn.role === "assistant" && ((turn.products?.length ?? 0) || (turn.sources?.length ?? 0)))
  const isEmpty = turns.length === 0
  return (
    <div className="relative flex h-[calc(100dvh-7rem)] min-h-[540px] w-full overflow-hidden bg-background">
      <HistoryRail open={historyOpen} onClose={() => setHistoryOpen(false)} conversations={conversations} query={historyQuery} onQuery={setHistoryQuery} onOpen={openConversation} onNew={newChat} />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-5">
          <div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setHistoryOpen(true)} aria-label="Open conversation history"><Menu className="h-5 w-5" /></Button><div><p className="font-serif text-sm font-semibold sm:text-base">Fádé Perfume Intelligence</p><p className="hidden text-[11px] text-muted-foreground sm:block">Perfume expertise, live catalogue checks, and cited research</p></div></div>
          <Button variant="outline" size="sm" onClick={newChat} className="gap-2"><MessageSquarePlus className="h-4 w-4" /><span className="hidden sm:inline">New chat</span></Button>
        </div>
        {isEmpty ? <EmptyState onAsk={ask} composer={<Composer input={input} setInput={setInput} ask={ask} running={running} stop={() => abortRef.current?.abort()} sampleFirst={sampleFirst} setSampleFirst={setSampleFirst} allowance={allowance} textRef={textRef} />} /> : <>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite" aria-busy={running}><div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-7 sm:px-6">{turns.map((turn, index) => <TurnView key={`${turn.role}-${index}`} turn={turn} onRetry={() => turn.role === "assistant" && index > 0 && ask(turns[index - 1].text)} onCopy={async () => { await navigator.clipboard.writeText(turn.text); setCopied(String(index)); setTimeout(() => setCopied(undefined), 1600) }} copied={copied === String(index)} />)}</div></div>
          <div className="shrink-0 border-t border-border bg-background/95 px-3 py-3 backdrop-blur sm:px-6"><div className="mx-auto max-w-3xl"><Composer input={input} setInput={setInput} ask={ask} running={running} stop={() => abortRef.current?.abort()} sampleFirst={sampleFirst} setSampleFirst={setSampleFirst} allowance={allowance} textRef={textRef} /></div></div>
        </>}
      </main>
      {contextualTurn && <ContextPanel turn={contextualTurn} />}
    </div>
  )
}

function HistoryRail({ open, onClose, conversations, query, onQuery, onOpen, onNew }: { open: boolean; onClose: () => void; conversations: ConversationSummary[]; query: string; onQuery: (value: string) => void; onOpen: (id: string) => void; onNew: () => void }) {
  return <><button type="button" aria-label="Close conversation history" onClick={onClose} className={cn("fixed inset-0 z-40 bg-black/55 lg:hidden", open ? "block" : "hidden")} /><aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[min(86vw,19rem)] flex-col border-r border-border bg-card transition-transform lg:static lg:z-auto lg:w-72 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}><div className="flex h-14 items-center justify-between border-b px-4"><p className="font-serif font-semibold">Conversations</p><Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}><X className="h-5 w-5" /><span className="sr-only">Close</span></Button></div><div className="space-y-3 p-3"><Button className="w-full justify-start gap-2" onClick={onNew}><MessageSquarePlus className="h-4 w-4" />New chat</Button><label className="relative block"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search history" className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-accent" /></label></div><div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">{conversations.length ? conversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => onOpen(conversation.id)} className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-secondary"><span className="line-clamp-2 text-sm font-medium">{conversation.title || "Perfume conversation"}</span><span className="mt-1 block text-[11px] text-muted-foreground">{conversation._count.messages} messages</span></button>) : <div className="px-3 py-8 text-center text-xs text-muted-foreground"><History className="mx-auto mb-2 h-5 w-5" />Your conversations will appear here.</div>}</div></aside></>
}

function EmptyState({ onAsk, composer }: { onAsk: (value: string) => void; composer: React.ReactNode }) { return <div className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-10"><span className="grid h-12 w-12 place-items-center rounded-full bg-accent/12 text-accent"><Bot className="h-5 w-5" /></span><h1 className="mt-5 text-center font-serif text-3xl font-semibold sm:text-4xl">Ask anything about perfume.</h1><p className="mt-3 max-w-xl text-center text-sm leading-6 text-muted-foreground sm:text-base">Explore notes, accords, ingredients, performance, layering, perfume history, Nigerian weather, external fragrances, or live Fádé availability. Current external claims use visible sources.</p><div className="mt-8 w-full">{composer}</div><div className="mt-5 grid w-full gap-2 sm:grid-cols-2">{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => onAsk(prompt)} className="min-h-11 rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm hover:border-accent/50 hover:bg-secondary/50">{prompt}</button>)}</div></div></div> }

function Composer({ input, setInput, ask, running, stop, sampleFirst, setSampleFirst, allowance, textRef }: { input: string; setInput: (value: string) => void; ask: (value: string) => void; running: boolean; stop: () => void; sampleFirst: boolean; setSampleFirst: (value: boolean) => void; allowance?: { authenticated: boolean; remaining: number | null }; textRef: React.RefObject<HTMLTextAreaElement | null> }) { return <form onSubmit={(event) => { event.preventDefault(); ask(input) }} className="w-full"><div className="rounded-2xl border border-border bg-card shadow-lg shadow-black/5 focus-within:border-accent/60"><textarea ref={textRef} rows={1} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(input) } }} placeholder="Ask about a note, perfume, climate, occasion, or Fádé product" className="max-h-44 min-h-12 w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] outline-none placeholder:text-muted-foreground" /><div className="flex items-center justify-between gap-3 px-3 pb-3 pl-4"><div className="flex min-w-0 items-center gap-3"><label className="flex min-h-8 cursor-pointer items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={sampleFirst} onChange={(event) => setSampleFirst(event.target.checked)} className="h-4 w-4 accent-accent" />Sample-first</label><span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{allowance?.authenticated ? "Signed in" : `${allowance?.remaining ?? 1} complimentary question remaining`}</span></div>{running ? <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-full" onClick={stop}><Square className="h-3.5 w-3.5 fill-current" /><span className="sr-only">Cancel generation</span></Button> : <Button type="submit" size="icon" className="h-9 w-9 rounded-full" disabled={!input.trim()}><ArrowUp className="h-4 w-4" /><span className="sr-only">Send message</span></Button>}</div></div><p className="mt-2 text-center text-[11px] text-muted-foreground">Enter to send. Shift + Enter for a new line. Not medical or allergy advice.</p></form> }

function TurnView({ turn, onRetry, onCopy, copied }: { turn: Turn; onRetry: () => void; onCopy: () => void; copied: boolean }) {
  if (turn.role === "user") return <div className="flex justify-end"><p className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground sm:max-w-[78%]">{turn.text}</p></div>
  return <article className="group flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/12 text-accent"><Bot className="h-4 w-4" /></span><div className="min-w-0 flex-1">{turn.status && !turn.text ? <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" />{turn.status}</div> : <RichText text={turn.text} />}{turn.error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"><p className="text-sm text-destructive">{turn.error.message}</p><div className="mt-3 flex gap-2">{turn.error.code === "GUEST_ALLOWANCE_EXHAUSTED" ? <Button asChild size="sm"><Link href="/auth/signin?callbackUrl=/concierge">Sign in to continue</Link></Button> : <Button size="sm" variant="outline" onClick={onRetry} className="gap-2"><RotateCcw className="h-4 w-4" />Retry</Button>}</div></div>} {!turn.error && turn.text && <div className="mt-3 flex items-center gap-1 text-muted-foreground"><button type="button" onClick={onCopy} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary" aria-label="Copy response">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button>{turn.id && <><FeedbackButton id={turn.id} rating="HELPFUL"><ThumbsUp className="h-4 w-4" /></FeedbackButton><FeedbackButton id={turn.id} rating="NOT_HELPFUL"><ThumbsDown className="h-4 w-4" /></FeedbackButton></>}</div>}<MobileContext turn={turn} /></div></article>
}

function RichText({ text }: { text: string }) { return <div className="space-y-3 text-[15px] leading-7 text-foreground">{text.split(/\n\n+/).filter(Boolean).map((block, index) => { const lines = block.split("\n"); if (lines.every((line) => /^[-*]\s/.test(line))) return <ul key={index} className="list-disc space-y-1 pl-5">{lines.map((line) => <li key={line}>{line.replace(/^[-*]\s/, "")}</li>)}</ul>; if (/^#{1,3}\s/.test(block)) return <h2 key={index} className="pt-2 font-serif text-xl font-semibold">{block.replace(/^#{1,3}\s/, "")}</h2>; return <p key={index}>{block}</p> })}</div> }
function FeedbackButton({ id, rating, children }: { id: string; rating: string; children: React.ReactNode }) { const [sent, setSent] = React.useState(false); return <button type="button" disabled={sent} onClick={async () => { await fetch(`/api/v2/concierge/messages/${id}/feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rating }) }); setSent(true) }} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary disabled:text-accent" aria-label={rating === "HELPFUL" ? "Mark response helpful" : "Mark response not helpful"}>{children}</button> }

function ContextPanel({ turn }: { turn: Turn }) { return <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-card/50 p-4 xl:block"><p className="mb-4 font-serif font-semibold">Context</p><ContextContent turn={turn} /></aside> }
function MobileContext({ turn }: { turn: Turn }) { if (!turn.products?.length && !turn.sources?.length) return null; return <div className="mt-4 space-y-4 xl:hidden"><ContextContent turn={turn} /></div> }
function ContextContent({ turn }: { turn: Turn }) { return <div className="space-y-5">{turn.products?.length ? <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fádé catalogue</h3><div className="flex snap-x gap-3 overflow-x-auto pb-2 xl:block xl:space-y-3 xl:overflow-visible">{turn.products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section> : null}{turn.sources?.length ? <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</h3><ol className="space-y-2">{turn.sources.map((source, index) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer noopener" className="block rounded-lg border border-border bg-card p-3 text-xs hover:border-accent/50"><span className="font-semibold text-foreground">{index + 1}. {source.title}</span><span className="mt-1 block text-muted-foreground">{source.domain} · {source.kind}</span></a></li>)}</ol></section> : null}</div> }
function ProductCard({ product }: { product: ConciergeProductCard }) { return <article className="w-[17rem] shrink-0 snap-start rounded-xl border border-border bg-card p-3 xl:w-auto"><Link href={`/product/${product.slug}`} className="flex gap-3"><div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary"><Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" /></div><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{product.brand || "Fádé"}</p><p className="font-serif text-sm font-semibold leading-5">{product.name}</p><p className="mt-1 text-sm font-semibold">{money(product.priceNGN)}</p><p className={cn("mt-1 text-[10px] font-medium capitalize", product.availability === "in_stock" ? "text-emerald-600" : "text-amber-600")}>{product.availability.replaceAll("_", " ")}</p></div></Link>{product.reasons[0] && <p className="mt-2 text-xs leading-5 text-muted-foreground">{product.reasons[0]}</p>}</article> }
