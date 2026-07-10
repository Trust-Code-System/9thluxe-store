// app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** PostgreSQL: case-insensitive contains. */
function searchWhere(keywords: string[]) {
  const terms = keywords.map((t) => t.trim()).filter((t) => t.length > 0)
  if (terms.length === 0) return { deletedAt: null }

  return {
    deletedAt: null,
    OR: terms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" as const } },
      { brand: { contains: term, mode: "insensitive" as const } },
      { notesTop: { contains: term, mode: "insensitive" as const } },
      { notesHeart: { contains: term, mode: "insensitive" as const } },
      { notesBase: { contains: term, mode: "insensitive" as const } },
    ]),
  }
}

const SEARCH_PROMPT = (q: string) =>
  `This is a perfume store search. User typed: "${q}". Reply with ONLY a JSON array of 1-5 short search terms (product names, fragrance notes like oud/vanilla/citrus, or brands) we can use to search our catalog. Example: ["Aventus","citrus"]. Reply only the JSON array, no other text.`

function parseKeywordsFromText(text: string, fallback: string): string[] {
  const match = text.match(/\[[\s\S]*?\]/)
  if (!match) return [fallback]
  try {
    const parsed = JSON.parse(match[0]) as unknown
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return [...new Set([fallback, ...(parsed as string[])])]
    }
  } catch {
    //
  }
  return [fallback]
}

/** Optional: use Anthropic Claude to expand query into search keywords. */
async function expandQueryWithAnthropic(query: string): Promise<string[] | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim()
  if (!key) return null

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{ role: "user", content: SEARCH_PROMPT(query) }],
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { content?: { text?: string }[] }
    const text = data?.content?.[0]?.text?.trim() || ""
    return parseKeywordsFromText(text, query)
  } catch {
    return null
  }
}

/** Optional: use xAI (Grok) to expand query into search keywords. */
async function expandQueryWithXAI(query: string): Promise<string[] | null> {
  const key = process.env.XAI_API_KEY?.trim()
  if (!key) return null

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_SEARCH_MODEL || process.env.XAI_MODEL || "grok-4.5",
        max_tokens: 100,
        messages: [
          { role: "system", content: "Reply only with a JSON array. No other text." },
          { role: "user", content: SEARCH_PROMPT(query) },
        ],
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = data?.choices?.[0]?.message?.content?.trim() || ""
    return parseKeywordsFromText(text, query)
  } catch {
    return null
  }
}

/** Use Anthropic first, then xAI if set; otherwise return raw query. */
async function expandQuery(query: string): Promise<string[]> {
  const withAnthropic = await expandQueryWithAnthropic(query)
  if (withAnthropic && withAnthropic.length > 0) return withAnthropic
  const withXAI = await expandQueryWithXAI(query)
  if (withXAI && withXAI.length > 0) return withXAI
  return [query]
}

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim()
    if (q.length < 2) {
      return NextResponse.json({ items: [] })
    }

    // Use AI to expand query: Anthropic first, then xAI when keys are set
    const keywords = await expandQuery(q)
    const where = searchWhere(keywords)

    const items = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        priceNGN: true,
        images: true,
        ratingAvg: true,
      },
      orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }, { name: "asc" }],
      take: 12,
    })

    // Dedupe by id (same product can match multiple keywords)
    const seen = new Set<string>()
    const deduped = items.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    return NextResponse.json({ items: deduped.slice(0, 6) })
  } catch (err) {
    console.error("Search error", err)
    return NextResponse.json({ items: [], error: "search_failed" }, { status: 500 })
  }
}
