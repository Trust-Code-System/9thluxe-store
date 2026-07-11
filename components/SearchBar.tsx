"use client"

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatPrice } from '@/lib/format'

type SearchItem = {
  id?: string
  name: string
  slug: string
  brand?: string | null
  priceNGN?: number
  images?: unknown
  ratingAvg?: number
}

function useDebouncedValue<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function normalizeImages(images: unknown): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images as string[]
  try {
    const parsed = typeof images === 'string' ? JSON.parse(images) : images
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

type SearchBarProps = {
  /** Called when navigating (so parent e.g. SearchDialog can close) */
  onNavigate?: () => void
}

export default function SearchBar({ onNavigate }: SearchBarProps = {}) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 200)
  const [items, setItems] = useState<SearchItem[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const router = useRouter()

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setItems([])
      setActive(0)
      setOpen(false)
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    ;(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = await response.json().catch(() => ({}))
        const list: unknown[] = Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload.results)
          ? payload.results
          : []

        const next: SearchItem[] = list.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          brand: item.brand,
          priceNGN: item.priceNGN,
          images: item.images,
          ratingAvg: item.ratingAvg,
        }))

        setItems(next)
        setActive(0)
        setOpen(next.length > 0)
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          setItems([])
          setOpen(false)
        }
      }
    })()

    return () => controller.abort()
  }, [debouncedQuery])

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (open && items.length > 0) {
        event.preventDefault()
        setActive((index) => (index + 1) % items.length)
      }
    } else if (event.key === 'ArrowUp') {
      if (open && items.length > 0) {
        event.preventDefault()
        setActive((index) => (index - 1 + items.length) % items.length)
      }
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && items.length > 0) {
        const picked = items[active]
        if (picked) {
          setOpen(false)
          onNavigate?.()
          router.push(`/product/${picked.slug}`)
        }
      } else if (query.trim().length >= 2) {
        // No results yet or no results: go to shop with search query
        setOpen(false)
        onNavigate?.()
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const navigateToProduct = (slug: string) => {
    setOpen(false)
    onNavigate?.()
    router.push(`/product/${slug}`)
  }

  const placeholder = useMemo(() => 'Search perfumes...', [])

  return (
    <div ref={rootRef} className="relative">
      <input
        className="input h-11 rounded-full px-6"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => debouncedQuery.trim().length >= 2 && items.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        aria-expanded={open}
        aria-controls="search-suggestions"
        role="combobox"
      />

      {open && items.length > 0 && (
        <div
          id="search-suggestions"
          ref={listRef}
          role="listbox"
          className="panel absolute z-[var(--z-popover)] mt-2 max-h-[70vh] w-[28rem] max-w-[90vw] overflow-auto p-2"
        >
          {items.map((item, index) => {
            const images = normalizeImages(item.images)
            const cover = images[0] || '/placeholder.png'
            const selected = index === active

            return (
              <div
                key={`${item.id || item.slug}-${index}`}
                role="option"
                aria-selected={selected}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  selected ? 'bg-muted' : 'hover:bg-muted'
                }`}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  navigateToProduct(item.slug)
                }}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                  <Image src={cover} alt={item.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate font-medium text-foreground">{item.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.brand ? `${item.brand} - ` : ''}
                    {typeof item.priceNGN === 'number' ? `${formatPrice(item.priceNGN)}` : ''}
                  </div>
                </div>
                {typeof item.ratingAvg === 'number' && item.ratingAvg > 0 && (
                  <div className="shrink-0 text-xs font-medium text-amber-600">* {item.ratingAvg.toFixed(1)}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {open && items.length === 0 && debouncedQuery.trim().length >= 2 && (
        <div className="panel absolute z-[var(--z-popover)] mt-2 w-[28rem] max-w-[90vw] p-3 text-sm text-muted-foreground">
          No results for "{debouncedQuery}"
        </div>
      )}
    </div>
  )
}

