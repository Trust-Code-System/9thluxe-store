import Link from "next/link"

// Renders structured story blocks. All text is rendered as React children (auto-escaped);
// no raw HTML is ever injected. Unsafe/unknown block types are ignored.

interface Block {
  type: string
  data: Record<string, unknown>
}

function str(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function isSafeHref(href: string): boolean {
  if (href.startsWith("/")) return true
  try {
    const u = new URL(href)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export function StoryBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-7">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const text = str(block.data.text)
            if (!text) return null
            const level = block.data.level === 3 ? 3 : 2
            return level === 3 ? (
              <h3 key={i} className="mt-4 font-serif text-2xl font-light leading-snug">
                {text}
              </h3>
            ) : (
              <h2 key={i} className="mt-6 font-serif text-3xl font-light leading-snug">
                {text}
              </h2>
            )
          }
          case "paragraph": {
            const text = str(block.data.text)
            if (!text) return null
            return (
              <p
                key={i}
                className="text-base leading-[1.85] text-foreground/85 first:first-letter:float-left first:first-letter:mr-3 first:first-letter:font-serif first:first-letter:text-6xl first:first-letter:leading-[0.85] first:first-letter:text-accent"
              >
                {text}
              </p>
            )
          }
          case "quote": {
            const text = str(block.data.text)
            if (!text) return null
            const attribution = str(block.data.attribution)
            return (
              <blockquote
                key={i}
                className="border-l-2 border-accent pl-5 font-serif text-xl italic leading-relaxed text-foreground/90"
              >
                {text}
                {attribution && (
                  <cite className="mt-2 block font-sans text-sm not-italic text-muted-foreground">
                    &ndash; {attribution}
                  </cite>
                )}
              </blockquote>
            )
          }
          case "image": {
            const url = str(block.data.url)
            if (!url || !isSafeHref(url)) return null
            const alt = str(block.data.alt)
            const caption = str(block.data.caption)
            return (
              <figure key={i} className="my-4">
                <img src={url} alt={alt} className="w-full rounded-lg border border-border" loading="lazy" />
                {caption && (
                  <figcaption className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {caption}
                  </figcaption>
                )}
              </figure>
            )
          }
          case "button": {
            const label = str(block.data.label)
            const href = str(block.data.href)
            if (!label || !href || !isSafeHref(href)) return null
            return (
              <div key={i}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 border border-accent px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                </Link>
              </div>
            )
          }
          case "divider":
            return <div key={i} className="rule-fade my-4" aria-hidden />
          // "product" blocks are surfaced in the "Referenced in this story" grid, not inline.
          default:
            return null
        }
      })}
    </div>
  )
}
